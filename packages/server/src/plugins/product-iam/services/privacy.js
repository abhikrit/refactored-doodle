// PRD-IAM-016 Terms acceptance with versioning (the acceptance record itself).
//
// BR-IAM-091: policy acceptance is recorded only by IAM, per policy system name and version, for
// a customer and, for seller terms, the vendor. The version and the "re-acceptance required"
// flag are those of the MKT-008 effective version; IAM stores no policy text, version or flag.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';

const acceptanceRepo = () => repository('PolicyAcceptance');
const versionRepo = () => repository('PolicyVersion');

/** IC-MKT-03 Effective version, supplied by MKT-008. */
export async function effectiveVersionAsync({ policySystemName, storeId = 1 }) {
  const versions = await versionRepo().getAllAsync((v) => v.policySystemName === policySystemName
    && (v.storeId ?? storeId) === storeId && v.published !== false);
  const effective = versions.sort((a, b) => b.versionNo - a.versionNo)[0];
  if (!effective) {
    return {
      policySystemName, versionNo: 'unversioned', reacceptanceRequired: false, suppliedBy: 'PRD-MKT-008',
    };
  }
  return { ...effective, suppliedBy: 'PRD-MKT-008' };
}

/** IC-IAM-05 RecordAcceptance. */
export async function recordAcceptanceAsync({
  customerId, vendorId = null, policySystemName, decision = 'accepted', channel = 'storefront',
  ipAddress = null, agentId = null, consentScope = null, storeId = 1,
}) {
  const version = await effectiveVersionAsync({ policySystemName, storeId });
  const row = await acceptanceRepo().insertAsync({
    customerId,
    vendorId,
    policySystemName,
    versionNo: version.versionNo,
    decision,
    channel,
    ipAddress,
    agentId,
    consentScope,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-014',
    area: 'IAM',
    feature: 'PRD-IAM-016',
    entity: 'PolicyAcceptance',
    entityId: row.id,
    actor: String(customerId),
    after: { policySystemName, versionNo: version.versionNo, decision },
    note: `policy ${decision}`,
  });
  return row;
}

export const acceptancesAsync = (customerId = null) => acceptanceRepo()
  .getAllAsync((a) => (customerId ? a.customerId === customerId : true));

/** Has this customer accepted the effective version of the policy? */
export async function hasAcceptedEffectiveAsync({ customerId, policySystemName, storeId = 1 }) {
  const version = await effectiveVersionAsync({ policySystemName, storeId });
  const rows = await acceptanceRepo().getAllAsync((a) => a.customerId === customerId
    && a.policySystemName === policySystemName);
  const accepted = rows.some((a) => a.decision === 'accepted' && String(a.versionNo) === String(version.versionNo));
  return { accepted, version, reacceptanceRequired: version.reacceptanceRequired === true && !accepted };
}
