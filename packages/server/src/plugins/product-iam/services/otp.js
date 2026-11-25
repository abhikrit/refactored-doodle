// One-time codes - PRD-IAM-002, used by IAM-004 (second factor) and IAM-026 (assisted consent).
//
// SM-IAM-01 OtpChallenge: Issued -> Verified / Locked / Expired / Superseded.
// BR-IAM-012: codes are random, single-use, bound to one purpose, stored only as a hash and never
// logged in clear. Validity, length, attempts, resend interval and send limits are the native
// OtpSettings values; the limit per IP address is an IAM setting.
// BR-IAM-150: IAM asks TRK (IC-TRK-06 CheckAllowed, category "Security codes") before every send,
// and sends the code itself through IC-IAM-01 (CHN-005), not through the TRK-005 engine.

import { createHash, randomInt } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { resource } from '../../../core/messages.js';
import { auditAsync } from '../../../core/audit.js';
import { checkAllowedAsync } from '../../product-trk/services/preferences.js';

const challengeRepo = () => repository('OtpChallenge');

export const PURPOSES = ['register', 'login', 'recover', 'confirm-change', 'assisted-consent', 'mfa'];

const hash = (code, purpose, recipient) => createHash('sha256').update(`${code}|${purpose}|${recipient}`).digest('hex');

async function settingsAsync(storeId) {
  const [timeLife, length, attempts, sendLimit, repeat, ipLimit] = await Promise.all([
    getSettingAsync('otpsettings.otptimelife', storeId, 300),
    getSettingAsync('otpsettings.otplength', storeId, 6),
    getSettingAsync('otpsettings.otpfailedallowedattempts', storeId, 3),
    getSettingAsync('otpsettings.otpcountattemptstosendcode', storeId, 5),
    getSettingAsync('otpsettings.otptimetorepeat', storeId, 1),
    getSettingAsync('iam.otpsendlimitperip', storeId, 10),
  ]);
  return {
    timeLifeSeconds: Number(timeLife),
    length: Number(length),
    maxAttempts: Number(attempts),
    sendLimit: Number(sendLimit),
    repeatMinutes: Number(repeat),
    ipLimit: Number(ipLimit),
  };
}

/**
 * IC-IAM-01 SendCode. Returns the challenge and, because no real handset exists here, the code
 * itself for the screen to show.
 */
export async function requestCodeAsync({
  recipient, purpose = 'login', customerId = null, storeId = 1, ipAddress = null, smsProvider = null,
  channel = 'sms',
}) {
  if (!PURPOSES.includes(purpose)) throw new Error(`unknown one-time code purpose ${purpose}`);
  const cfg = await settingsAsync(storeId);

  // BR-IAM-150: ask TRK first (category "Security codes")
  const allowed = await checkAllowedAsync({
    recipient, channel, category: 'Security codes', sender: 'IAM', storeId,
  });
  if (!allowed.allowed) {
    return {
      ok: false, messageKey: 'Iam.Otp.Unavailable', message: resource('Iam.Otp.Unavailable'), blockedByTrk: true, challenge: null,
    };
  }

  const existing = await challengeRepo().getAllAsync((c) => c.recipient === recipient && c.purpose === purpose);
  const live = existing.filter((c) => c.status === 'Issued');
  const recent = existing.filter((c) => Date.now() - new Date(c.createdOnUtc).getTime() < 3600 * 1000);
  if (recent.length >= cfg.sendLimit) {
    return {
      ok: false, messageKey: 'Iam.Otp.TooManyAttempts', message: resource('Iam.Otp.TooManyAttempts'), sendLimitReached: true, challenge: null,
    };
  }
  const byIp = ipAddress ? (await challengeRepo().getAllAsync((c) => c.ipAddress === ipAddress
    && Date.now() - new Date(c.createdOnUtc).getTime() < 3600 * 1000)) : [];
  if (ipAddress && byIp.length >= cfg.ipLimit) {
    return {
      ok: false, messageKey: 'Iam.Otp.Unavailable', message: resource('Iam.Otp.Unavailable'), ipLimitReached: true, challenge: null,
    };
  }
  const newest = live.sort((a, b) => new Date(b.createdOnUtc) - new Date(a.createdOnUtc))[0];
  if (newest && Date.now() - new Date(newest.createdOnUtc).getTime() < cfg.repeatMinutes * 60 * 1000) {
    return {
      ok: false,
      messageKey: 'Iam.Otp.TooManyAttempts',
      message: resource('Iam.Otp.TooManyAttempts'),
      resendIntervalSeconds: cfg.repeatMinutes * 60,
      waitSeconds: Math.ceil((cfg.repeatMinutes * 60 * 1000 - (Date.now() - new Date(newest.createdOnUtc).getTime())) / 1000),
      challenge: null,
    };
  }
  // SM-IAM-01: a new code for the same purpose supersedes the live one
  for (const c of live) await challengeRepo().updateAsync({ ...c, status: 'Superseded' });

  const code = String(randomInt(0, 10 ** cfg.length)).padStart(cfg.length, '0');
  let delivery = { status: 'sent', provider: null };
  if (smsProvider) {
    try {
      const sent = await smsProvider.sendAsync({ to: recipient, body: `Your code is ${code}`, code });
      delivery = { status: sent.status ?? 'sent', provider: smsProvider.systemName, providerRef: sent.providerRef ?? null };
    } catch (err) {
      delivery = { status: 'failed', provider: smsProvider.systemName, error: err.message };
    }
  }
  if (delivery.status === 'failed') {
    await auditAsync({
      event: 'AUD-IAM-002',
      area: 'IAM',
      feature: 'PRD-IAM-002',
      entity: 'OtpChallenge',
      entityId: recipient,
      actor: 'system',
      outcome: 'failed',
      note: `the gateway could not send a ${purpose} code: ${delivery.error}`,
    });
    return {
      ok: false, messageKey: 'Iam.Otp.Unavailable', message: resource('Iam.Otp.Unavailable'), delivery, challenge: null,
    };
  }

  const challenge = await challengeRepo().insertAsync({
    recipient,
    purpose,
    customerId,
    codeHash: hash(code, purpose, recipient), // BR-IAM-012: only the hash is stored
    attempts: 0,
    status: 'Issued',
    channel,
    ipAddress,
    delivery,
    createdOnUtc: new Date().toISOString(),
    expiresOnUtc: new Date(Date.now() + cfg.timeLifeSeconds * 1000).toISOString(),
  });
  return {
    ok: true,
    messageKey: 'Iam.Otp.Sent',
    message: resource('Iam.Otp.Sent'),
    challengeId: challenge.id,
    challenge: { ...challenge, codeHash: undefined },
    // shown on screen because no real handset exists in this installation
    demonstrationCode: code,
    settings: cfg,
  };
}

/** Verify a code. SM-IAM-01 Issued -> Verified / Locked, or Expired. */
export async function verifyCodeAsync({
  recipient, purpose = 'login', code, storeId = 1,
}) {
  const cfg = await settingsAsync(storeId);
  const live = (await challengeRepo().getAllAsync((c) => c.recipient === recipient
    && c.purpose === purpose && c.status === 'Issued'))
    .sort((a, b) => new Date(b.createdOnUtc) - new Date(a.createdOnUtc));
  const challenge = live[0];
  if (!challenge) {
    return { ok: false, messageKey: 'Iam.Otp.Expired', message: resource('Iam.Otp.Expired') };
  }
  if (new Date(challenge.expiresOnUtc).getTime() < Date.now()) {
    await challengeRepo().updateAsync({ ...challenge, status: 'Expired' });
    return {
      ok: false, messageKey: 'Iam.Otp.Expired', message: resource('Iam.Otp.Expired'), status: 'Expired',
    };
  }
  if (challenge.codeHash !== hash(String(code), purpose, recipient)) {
    const attempts = challenge.attempts + 1;
    if (attempts >= cfg.maxAttempts) {
      await challengeRepo().updateAsync({ ...challenge, attempts, status: 'Locked' });
      return {
        ok: false,
        messageKey: 'Iam.Otp.TooManyAttempts',
        message: resource('Iam.Otp.TooManyAttempts'),
        status: 'Locked',
        resendIntervalSeconds: cfg.repeatMinutes * 60,
      };
    }
    await challengeRepo().updateAsync({ ...challenge, attempts });
    return {
      ok: false, wrongCode: true, attemptsLeft: cfg.maxAttempts - attempts, status: 'Issued',
    };
  }
  const verified = await challengeRepo().updateAsync({ ...challenge, status: 'Verified', verifiedOnUtc: new Date().toISOString() });
  return {
    ok: true, challenge: { ...verified, codeHash: undefined }, purpose, customerId: challenge.customerId,
  };
}

export const challengesAsync = async () => (await challengeRepo().getAllAsync())
  .map(({ codeHash, ...rest }) => rest);

/** Used by the tests and the admin screen: the live challenge for a recipient and purpose. */
export const liveChallengeAsync = (recipient, purpose) => challengeRepo()
  .getOneAsync((c) => c.recipient === recipient && c.purpose === purpose && c.status === 'Issued');

export async function expireChallengeAsync(id) {
  const challenge = await challengeRepo().getByIdAsync(id);
  if (!challenge) return null;
  return challengeRepo().updateAsync({ ...challenge, expiresOnUtc: new Date(Date.now() - 1000).toISOString() });
}
