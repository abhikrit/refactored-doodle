// PRD-ADM-008 Upload and content scanning controls - one test per AC, named by AC ID.
// 2 stories, 10 criteria. BR-ADM-060 and decision SINGLE-FILTER.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').toString('base64');
const PDF = Buffer.from('255044462d312e34', 'hex').toString('base64');
const big = (kb) => Buffer.alloc(kb * 1024, 0x25).toString('base64');

const upload = (body) => api.post('/api/admin-console/uploads/check', body);

describe('US-ADM-008-01 which file types and sizes', () => {
  test('AC-ADM-008-01-01', async () => {
    // "a file with an extension not allowed is refused with Adm.UploadTypeNotAllowed before
    //  anything is stored"
    const contexts = await api.get('/api/admin-console/uploads/contexts');
    assert.equal(contexts.length, 15, 'the fifteen ADM contexts of the native upload actions');
    assert.ok(contexts.every((c) => c.allowedExtensions && c.maxSizeKb), 'each sets extensions and a maximum size');

    const refused = await upload({
      action: 'Nop.Web CustomerController.UploadAvatar', fileName: 'avatar.exe', contentBase64: PNG,
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Adm.UploadTypeNotAllowed');
    assert.equal(refused.message, 'This type of file cannot be uploaded here.');
    assert.equal(refused.stored, false, 'nothing is stored');
    assert.equal(refused.context, 'avatar');

    const accepted = await upload({
      action: 'Nop.Web CustomerController.UploadAvatar', fileName: 'avatar.png', contentBase64: PNG,
    });
    assert.equal(accepted.ok, true);
    assert.equal(accepted.stored, true);
  });

  test('AC-ADM-008-01-02', async () => {
    // "a file larger than the maximum is refused with Adm.UploadTooLarge before anything is stored"
    const refused = await upload({
      action: 'Admin SettingController.UploadIcons', fileName: 'icon.png', contentBase64: big(300),
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Adm.UploadTooLarge');
    assert.match(refused.message, /larger than 256 KB/);
    assert.equal(refused.stored, false);
  });

  test('AC-ADM-008-01-03', async () => {
    // "the stricter of the native per-field limit and the policy applies"
    // the policy for a return-request file is 4096 KB; a native per-field limit of 512 KB wins
    const refused = await upload({
      action: 'Nop.Web ReturnRequestController.UploadFileReturnRequest',
      fileName: 'evidence.pdf',
      contentBase64: big(600),
      nativeLimit: { maxSizeKb: 512 },
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Adm.UploadTooLarge');
    assert.equal(refused.effectiveMaxKb, 512, 'the stricter of the two limits');

    // and the stricter extension list wins too
    const narrowed = await upload({
      action: 'Nop.Web ReturnRequestController.UploadFileReturnRequest',
      fileName: 'evidence.pdf',
      contentBase64: PDF,
      nativeLimit: { allowedExtensions: ['png', 'jpg'] },
    });
    assert.equal(narrowed.ok, false);
    assert.deepEqual(narrowed.effectiveAllowed, ['png', 'jpg']);

    // where the policy is the stricter one, the policy wins
    const policyWins = await upload({
      action: 'Admin SettingController.UploadIcons', fileName: 'icon.png', contentBase64: big(300), nativeLimit: { maxSizeKb: 10240 },
    });
    assert.equal(policyWins.effectiveMaxKb, 256);
  });

  test('AC-ADM-008-01-04', async () => {
    // "the file content does not match its extension (file signature check): refused with
    //  Adm.UploadTypeNotAllowed"
    const disguised = await upload({
      action: 'Admin PictureController.AsyncUpload',
      fileName: 'not-really.png',
      contentBase64: Buffer.from('MZ\u0090\u0000this is an executable').toString('base64'),
    });
    assert.equal(disguised.ok, false);
    assert.equal(disguised.messageKey, 'Adm.UploadTypeNotAllowed');
    assert.equal(disguised.stored, false);

    const genuine = await upload({ action: 'Admin PictureController.AsyncUpload', fileName: 'real.png', contentBase64: PNG });
    assert.equal(genuine.ok, true);
  });

  test('AC-ADM-008-01-05', async () => {
    // "a global action filter on the known upload actions checks Request.Form.Files before the
    //  action runs, and DI overrides of IDownloadService.GetDownloadBitsAsync and
    //  IPictureService.InsertPictureAsync apply the same checks as a backstop"
    const register = await api.get('/api/admin-console/extension-register');
    const uploadFilters = register.entries.filter((e) => e.feature === 'PRD-ADM-008' && e.mechanism === 'action filter');
    assert.ok(uploadFilters.length >= 20, 'one filter entry per known upload action');
    for (const action of [
      'Admin PictureController.AsyncUpload',
      'Admin DownloadController.AsyncUpload',
      'Admin ProductController.Upload3dObject',
      'Admin PriceListController.ImportExcel',
      'Admin ElFinderController.Connector',
      'Nop.Web ShoppingCartController.UploadFileProductAttribute',
      'Nop.Web CustomerController.UploadAvatar',
    ]) {
      assert.ok(uploadFilters.some((e) => e.target === action), `${action} carries the ADM-008 filter`);
    }
    // the backstop goes through the same check, so an endpoint with no context is still checked
    const backstop = await upload({ contextCode: 'other-upload', fileName: 'anything.exe', contentBase64: PDF });
    assert.equal(backstop.ok, false);
    assert.equal(backstop.context, 'other-upload');
  });

  test('AC-ADM-008-01-06', async () => {
    // "a module registers an upload context through IC-ADM-08 RegisterUploadContext ... a
    //  resolver match takes precedence over the ADM default context of the action; the module
    //  keeps no file-type or size check of its own and registers no upload filter"
    const { registerUploadContextAsync } = await import('../../packages/server/src/plugins/product-adm/services/uploads.js');
    await registerUploadContextAsync({
      code: 'egv-application-document',
      owningFeature: 'PRD-EGV-002',
      coveredActions: ['Nop.Web ShoppingCartController.UploadFileProductAttribute'],
      resolver: function isEgvService(routeValues) { return routeValues.productType === 'egv-service'; },
      allowedExtensions: ['pdf'],
      maxSizeKb: 8192,
      scanEnabled: true,
      failMode: 'reject',
    });

    // the ADM default context of that action allows images; the EGV context allows pdf only
    const viaResolver = await upload({
      action: 'Nop.Web ShoppingCartController.UploadFileProductAttribute',
      routeValues: { productType: 'egv-service' },
      fileName: 'passport.png',
      contentBase64: PNG,
    });
    assert.equal(viaResolver.context, 'egv-application-document', 'the resolver match wins');
    assert.equal(viaResolver.ok, false, 'and its policy applies');

    const admDefault = await upload({
      action: 'Nop.Web ShoppingCartController.UploadFileProductAttribute',
      routeValues: { productType: 'physical' },
      fileName: 'photo.png',
      contentBase64: PNG,
    });
    assert.equal(admDefault.context, 'storefront-attribute-file');
    assert.equal(admDefault.ok, true);

    // EGV registers no upload filter of its own (BR-EGV-004, SINGLE-FILTER)
    const register = await api.get('/api/admin-console/extension-register');
    const onThatAction = register.entries.filter((e) => e.mechanism === 'action filter'
      && e.target === 'Nop.Web ShoppingCartController.UploadFileProductAttribute');
    assert.equal(onThatAction.length, 1);
    assert.equal(onThatAction[0].feature, 'PRD-ADM-008');
  });

  test('AC-ADM-008-01-07', async () => {
    // "every context is listed with its owning feature, covered actions or endpoint and current
    //  values; values of a module context are edited here, not in the owning module"
    const contexts = await api.get('/api/admin-console/uploads/contexts');
    const egv = contexts.find((c) => c.code === 'egv-application-document');
    assert.ok(egv, 'the module context is listed on the ADM-008 page');
    assert.equal(egv.owningFeature, 'PRD-EGV-002');
    assert.deepEqual(egv.coveredActions, ['Nop.Web ShoppingCartController.UploadFileProductAttribute']);
    assert.equal(egv.hasResolver, true);

    const edited = await api.patch('/api/admin-console/uploads/contexts/egv-application-document', {
      allowedExtensions: ['pdf', 'png'], maxSizeKb: 4096,
    });
    assert.equal(edited.ok, true);
    assert.deepEqual(edited.context.allowedExtensions, ['pdf', 'png'], 'a module context is edited here');

    const denied = await api.call('PATCH', '/api/admin-console/uploads/contexts/avatar', { maxSizeKb: 10 }, SESSIONS.operations);
    assert.equal(denied.status, 403);
    assert.equal(denied.body.permission, 'Configuration.ManageSettings');
  });

  test('AC-ADM-008-01-08', async () => {
    // "the upload actions added in nopCommerce 5.00: Upload3dObject, PriceListController
    //  .ImportExcel and the elFinder connector"
    // the 3D object policy is 20 MB; the request body limit of the prototype is smaller, so the
    // policy is narrowed for this check rather than posting a 20 MB file
    await api.patch('/api/admin-console/uploads/contexts/product-3d-object', { maxSizeKb: 64 });
    const tooBig3d = await upload({ action: 'Admin ProductController.Upload3dObject', fileName: 'model.glb', contentBase64: big(100) });
    assert.equal(tooBig3d.messageKey, 'Adm.UploadTooLarge');
    assert.equal(tooBig3d.context, 'product-3d-object');
    await api.patch('/api/admin-console/uploads/contexts/product-3d-object', { maxSizeKb: 20480 });

    const wrongType = await upload({ action: 'Admin PriceListController.ImportExcel', fileName: 'prices.pdf', contentBase64: PDF });
    assert.equal(wrongType.messageKey, 'Adm.UploadTypeNotAllowed');
    assert.equal(wrongType.context, 'data-imports');

    // for elFinder the stricter of the policy and the elFinder allow-list applies
    const elfinder = await upload({
      action: 'Admin ElFinderController.Connector', fileName: 'page.html', contentBase64: PNG, nativeLimit: { allowedExtensions: ['png', 'jpg', 'gif', 'pdf', 'txt'], maxSizeKb: 10240 },
    });
    assert.equal(elfinder.ok, false);
    assert.equal(elfinder.messageKey, 'Adm.UploadTypeNotAllowed');
  });
});

describe('US-ADM-008-02 virus scanning', () => {
  test('AC-ADM-008-02-01', async () => {
    // "a clean file is stored, an infected file is refused with Adm.UploadInfected and the event
    //  is audited (AUD-ADM-006)"
    const clean = await upload({ action: 'Admin DownloadController.AsyncUpload', fileName: 'manual.pdf', contentBase64: PDF });
    assert.equal(clean.ok, true);
    assert.equal(clean.scanned, true, 'the file was scanned before it was stored');
    assert.equal(clean.stored, true);

    const infected = await upload({ action: 'Admin DownloadController.AsyncUpload', fileName: 'eicar-test.pdf', contentBase64: PDF });
    assert.equal(infected.ok, false);
    assert.equal(infected.messageKey, 'Adm.UploadInfected');
    assert.equal(infected.message, 'The file was rejected by the virus check.');
    assert.equal(infected.stored, false);

    const trail = await api.get('/api/security/audit?event=AUD-ADM-006');
    const entry = trail.find((e) => e.after?.reason === 'Adm.UploadInfected');
    assert.ok(entry, 'the event is audited as AUD-ADM-006');
    assert.ok(entry.after.fileHash, 'with the file hash');
    assert.equal(entry.after.context, 'admin-download');
  });

  test('AC-ADM-008-02-02', async () => {
    // "the configured fail mode applies: reject with Adm.UploadScanUnavailable (default) or
    //  accept into quarantine, not usable until scanned"
    await api.post('/api/mocks/Antivirus.Engine/health', { health: 'failing' });

    const rejected = await upload({ action: 'Admin DownloadController.AsyncUpload', fileName: 'report.pdf', contentBase64: PDF });
    assert.equal(rejected.ok, false);
    assert.equal(rejected.messageKey, 'Adm.UploadScanUnavailable');

    await api.patch('/api/admin-console/uploads/contexts/admin-download', { failMode: 'quarantine' });
    const quarantined = await upload({ action: 'Admin DownloadController.AsyncUpload', fileName: 'report.pdf', contentBase64: PDF });
    assert.equal(quarantined.ok, true);
    assert.equal(quarantined.quarantined, true);
    assert.equal(quarantined.usable, false, 'not usable until scanned');

    await api.post('/api/mocks/Antivirus.Engine/health', { health: 'healthy' });
    const released = await api.post(`/api/admin-console/uploads/scans/${quarantined.scanId}/complete`, { result: 'Clean' });
    assert.equal(released.released, true);
    await api.patch('/api/admin-console/uploads/contexts/admin-download', { failMode: 'reject' });
  });
});
