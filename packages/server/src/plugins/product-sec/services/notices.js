// BR-SEC-100: SEC sends nothing itself. Every SEC notification is registered with TRK-005 at
// installation through IC-TRK-04 RegisterEventCode and sent through IC-TRK-04 SendEvent, so the
// channels come from the pack and the TRK-006 preferences apply. The code names are the ones
// BR-TRK-023 lists (Proposed).

import {
  registerEventCode, sendEventAsync, isEventCodeRegistered,
} from '../../product-trk/services/event-codes.js';
import { getSettingAsync } from '../../../core/settings.js';
import { messageGateways } from '@product/mocks';

export const SEC_EVENT_CODES = [
  {
    code: 'Sec.BreachNotice', feature: 'PRD-SEC-008', defaultChannels: ['email', 'sms'], note: 'the notice to an affected person; the SMS default text is the resource Sec.BreachNotice', mandatoryCategory: true,
  },
  { code: 'Sec.Core.AuditChainBroken', feature: 'PRD-SEC-004', defaultChannels: ['email', 'inapp'], note: 'audit-chain verification failed' },
  { code: 'Sec.Core.ExportBacklog', feature: 'PRD-SEC-005', defaultChannels: ['email'], note: 'the security-monitoring export is behind' },
  { code: 'Sec.Core.BreachDeadline', feature: 'PRD-SEC-008', defaultChannels: ['email'], note: 'a breach deadline is near or passed' },
  { code: 'Sec.Core.AuditorAccess', feature: 'PRD-SEC-010', defaultChannels: ['email'], note: 'an auditor grant started, ended or expired' },
  { code: 'Sec.Core.ImpactAssessmentReview', feature: 'PRD-SEC-012', defaultChannels: ['email'], note: 'an impact assessment is due for review' },
  { code: 'Sec.Core.ProfileIncomplete', feature: 'PRD-SEC-012', defaultChannels: ['email'], note: 'the country profile is missing a value' },
];

/** IC-TRK-04 RegisterEventCode, at installation. */
export function registerEventCodesAsync() {
  const registered = [];
  for (const entry of SEC_EVENT_CODES) {
    registered.push(registerEventCode({
      code: entry.code,
      owner: 'Product.SEC',
      feature: entry.feature,
      defaultChannels: entry.defaultChannels,
      note: entry.note,
    }));
  }
  return { registered: registered.map((r) => r.code), contract: 'IC-TRK-04 RegisterEventCode' };
}

export const secEventCodesAsync = async () => SEC_EVENT_CODES.map((e) => ({
  ...e, registered: isEventCodeRegistered(e.code),
}));

/** IC-TRK-04 SendEvent. A code SEC has not registered cannot be sent. */
export async function noticeAsync({
  code, to, tokens = {}, storeId = 1, senderReference = null,
}) {
  const recipients = Array.isArray(to) ? to : [to];
  const sent = [];
  for (const recipient of recipients) {
    if (!recipient) continue;
    try {
      const delivery = await sendEventAsync({
        code,
        to: recipient,
        tokens: { ...tokens, senderReference },
        storeId,
        gateways: messageGateways,
      });
      sent.push({
        to: recipient, code, result: 'Sent', delivery: Array.isArray(delivery) ? delivery[0] ?? null : delivery,
      });
    } catch (err) {
      sent.push({ to: recipient, code, result: 'Failed', reason: err.message });
    }
  }
  return {
    code, contract: 'IC-TRK-04 SendEvent', sentBy: 'PRD-TRK-005', senderReference, deliveries: sent,
  };
}

export const officerAsync = async (which, storeId = 1) => getSettingAsync(
  which === 'privacy' ? 'sec.privacyofficeremail' : 'sec.securityofficeremail',
  storeId,
  which === 'privacy' ? 'privacy@example.com' : 'security@example.com',
);
