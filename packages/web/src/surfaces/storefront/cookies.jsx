// The cookie consent banner and the cookie settings page. Replaces the native single-button
// cookie warning: this one offers the categories, and only the necessary cookies are set before
// a visitor has chosen.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import {
  Alert, Button, Checkbox, Panel, Spinner,
} from '../../ui/nop/kit.jsx';

export function CookieBanner() {
  const [banner, setBanner] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const [picked, setPicked] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get('/security/cookies/banner').then(setBanner).catch(() => setBanner({ show: false }));
  }, []);

  const save = async (option, accepted = []) => {
    try {
      await api.post('/security/cookies', { option, accepted });
      setDone(true);
    } catch { setDone(true); }
  };

  if (!banner?.show || done) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-store-border bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-[1280px] px-4 py-4 space-y-3">
        <p className="text-[13px] text-gray-700">{banner.message}</p>

        {choosing && (
          <div className="grid gap-1 sm:grid-cols-2">
            {banner.categories.map((c) => (
              <Checkbox
                key={c.systemName}
                label={c.name}
                hint={c.alwaysOn ? 'Always on' : c.description}
                disabled={c.alwaysOn}
                checked={c.alwaysOn || picked.includes(c.systemName)}
                onChange={(e) => setPicked(e.target.checked
                  ? [...picked, c.systemName]
                  : picked.filter((x) => x !== c.systemName))}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="brand" onClick={() => save('accept-all')}>Accept all</Button>
          <Button onClick={() => save('reject-all-except-necessary')}>Only necessary</Button>
          {choosing
            ? <Button onClick={() => save('choose-per-category', picked)}>Save my choices</Button>
            : <Button onClick={() => setChoosing(true)}>Choose</Button>}
          <Link to="/cookie-settings" className="text-[12px] brand-text hover:underline ml-auto">Cookie settings</Link>
        </div>
      </div>
    </div>
  );
}

export function CookieSettings() {
  const [choice, setChoice] = useState(null);
  const [picked, setPicked] = useState([]);
  const [notice, setNotice] = useState(null);

  const load = () => api.get('/security/cookies').then((c) => {
    setChoice(c);
    setPicked(c.accepted);
  }).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const result = await api.post('/security/cookies', { option: 'choose-per-category', accepted: picked });
      setNotice(result.message ?? 'Your cookie choices are saved.');
      load();
    } catch (e) { setNotice(e.message); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="nop-page-title">Cookie settings</h1>
      {notice && <Alert tone="success">{notice}</Alert>}
      {!choice ? <Spinner /> : (
        <Panel title="What you allow" subtitle="Your choice applies from the next page.">
          {choice.categories.map((c) => (
            <Checkbox
              key={c.systemName}
              label={c.name}
              hint={c.alwaysOn ? 'Always on — these keep the shop working.' : c.description}
              disabled={c.alwaysOn}
              checked={c.alwaysOn || picked.includes(c.systemName)}
              onChange={(e) => setPicked(e.target.checked
                ? [...picked, c.systemName]
                : picked.filter((x) => x !== c.systemName))}
            />
          ))}
          <div className="pt-4 flex flex-wrap gap-2">
            <Button variant="brand" onClick={save}>Save my choices</Button>
            <Button onClick={() => { setPicked(choice.categories.map((c) => c.systemName)); }}>Select all</Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
