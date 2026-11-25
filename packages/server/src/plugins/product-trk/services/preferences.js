// IC-TRK-06 CheckAllowed - PRD-TRK-006 message preferences and opt-outs.
//
// Every module asks TRK before it sends. BR-TRK-031: a recipient who opted out of a channel is
// Blocked, unless the client marked the category mandatory. BR-IAM-150: IAM asks for the category
// "Security codes" before every one-time code, and quiet hours and message limits do not apply to
// codes.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';

const prefRepo = () => repository('MessagePreference');

export const preferencesAsync = () => prefRepo().getAllAsync();

export async function setPreferenceAsync({
  recipient, channel, category, optedOut, storeId = 1,
}) {
  const existing = await prefRepo().getOneAsync((p) => p.recipient === recipient
    && p.channel === channel && p.category === category);
  if (existing) return prefRepo().updateAsync({ ...existing, optedOut });
  return prefRepo().insertAsync({
    recipient, channel, category, optedOut, storeId,
  });
}

/**
 * CheckAllowed. Answers Allowed or Blocked for one recipient, channel and category.
 * A category the client marks mandatory is always Allowed.
 */
export async function checkAllowedAsync({
  recipient, channel, category, sender = null, storeId = 1,
}) {
  const mandatory = await getSettingAsync(`trk.category.${String(category).toLowerCase().replace(/\s+/g, '-')}.mandatory`, storeId, false);
  if (mandatory === true) {
    return {
      allowed: true, mandatory: true, category, recipient, sender,
    };
  }
  const pref = await prefRepo().getOneAsync((p) => p.recipient === recipient
    && p.channel === channel && p.category === category);
  if (pref?.optedOut === true) {
    return {
      allowed: false, blocked: true, reason: 'the recipient opted out of this category on this channel', category, recipient, sender,
    };
  }
  return { allowed: true, category, recipient, sender };
}
