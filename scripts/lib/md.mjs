// Markdown helpers shared by the generator scripts.
// The PRD set in /docs is the single source of truth; nothing here invents values.

/** Split a markdown table row into cells, honouring escaped pipes (\|). */
export function splitRow(line) {
  const cells = [];
  let cur = '';
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\' && line[i + 1] === '|') {
      cur += '|';
      i += 1;
    } else if (ch === '|') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  // a markdown row starts and ends with a pipe -> drop the empty edges
  if (cells.length && cells[0].trim() === '') cells.shift();
  if (cells.length && cells[cells.length - 1].trim() === '') cells.pop();
  return cells.map((c) => c.trim());
}

const isSeparator = (line) => /^\|[\s:|-]+\|?\s*$/.test(line) && line.includes('-');

/**
 * Split into lines with CRLF normalised. A Windows checkout (core.autocrlf=true) leaves a \r on
 * every line, and in a JavaScript regex "." does not match \r - so "^#+\s+(.*)$" stops matching
 * headings and every section lookup silently returns nothing. Normalise once, here.
 */
export const lines = (md) => String(md).replace(/\r\n?/g, '\n').split('\n');

/**
 * Find every markdown table in `md`.
 * @returns {{headers: string[], rows: Object[], line: number}[]}
 */
export function parseTables(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const tables = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trimStart().startsWith('|')) continue;
    if (!(i + 1 < lines.length && isSeparator(lines[i + 1]))) continue;
    const headers = splitRow(lines[i].trim());
    const rows = [];
    let j = i + 2;
    for (; j < lines.length; j += 1) {
      const l = lines[j].trim();
      if (!l.startsWith('|')) break;
      if (isSeparator(l)) continue;
      const cells = splitRow(l);
      const row = {};
      headers.forEach((h, k) => { row[h] = cells[k] === undefined ? '' : cells[k]; });
      row._cells = cells;
      rows.push(row);
    }
    tables.push({ headers, rows, line: i + 1 });
    i = j - 1;
  }
  return tables;
}

/** Slice the document from the heading matching `re` up to the next heading of the same or higher level. */
export function section(md, re) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^(#{1,6})\s+(.*)$/.exec(lines[i]);
    if (!m) continue;
    if (start === -1) {
      if (re.test(m[2])) { start = i; level = m[1].length; }
    } else if (m[1].length <= level) {
      return lines.slice(start, i).join('\n');
    }
  }
  return start === -1 ? '' : lines.slice(start).join('\n');
}

/** All `### <id> <title>` blocks whose id matches `idRe`, within `md`. */
export function blocksByHeading(md, headingLevel, idRe) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const hashes = '#'.repeat(headingLevel);
  const out = [];
  let cur = null;
  for (let i = 0; i < lines.length; i += 1) {
    const m = new RegExp(`^${hashes}\\s+(.*)$`).exec(lines[i]);
    const anyHeading = /^(#{1,6})\s+/.exec(lines[i]);
    if (m) {
      const idm = idRe.exec(m[1]);
      if (cur) { out.push(cur); cur = null; }
      if (idm) cur = { heading: m[1], id: idm[1], title: m[1].slice(idm[0].length).trim(), body: [] };
      continue;
    }
    if (cur && anyHeading && anyHeading[1].length < headingLevel) { out.push(cur); cur = null; continue; }
    if (cur) cur.body.push(lines[i]);
  }
  if (cur) out.push(cur);
  return out.map((b) => ({ ...b, body: b.body.join('\n') }));
}

/** Bullet list items that follow a `**Label**` line, until the next blank-line-separated block. */
export function bulletsAfter(mdRaw, label) {
  const md = String(mdRaw).replace(/\r\n?/g, '\n');
  const re = new RegExp(`^\\*\\*${label}\\*\\*\\s*$`, 'm');
  const m = re.exec(md);
  if (!m) return [];
  const rest = md.slice(m.index + m[0].length).split('\n');
  const out = [];
  let started = false;
  for (const line of rest) {
    const t = line.trim();
    if (t.startsWith('- ')) { out.push(t.slice(2).trim()); started = true; continue; }
    if (!started) { if (t === '') continue; break; }
    if (t === '') { if (out.length) break; continue; }
    break;
  }
  return out;
}

/** Inline `**Label:** value` capture. */
export function inlineField(md, label) {
  const m = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`).exec(md);
  return m ? m[1].trim() : '';
}

/** Turn an `| Item | Value |` table into a plain object. */
export function kvTable(table) {
  const out = {};
  if (!table) return out;
  for (const row of table.rows) {
    const [k, v] = row._cells;
    if (k) out[k] = v === undefined ? '' : v;
  }
  return out;
}

export const uniq = (a) => [...new Set(a)];
export const splitList = (s) => (s || '')
  .split(/[,;]/)
  .map((x) => x.trim())
  .filter((x) => x && x !== '—' && x !== '-');
