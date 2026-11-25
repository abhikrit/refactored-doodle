// nopCommerce UI kit.
//
// Module chapters section 11.1 note: "Screen layouts are not specified here. They follow the
// approved designs (to be produced) and the client theme (PLT-006); until approved, developers
// build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront
// patterns."
//
// So every component here reproduces a native nopCommerce pattern: the admin panel/card, the
// Kendo-style grid with its search panel, the tab strip, the button bar, the storefront product
// box, the checkout progress bar. Nothing invents a layout.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ admin ---- */

export function Panel({
  title, subtitle, actions, children, className = '', bodyClass = 'p-4',
}) {
  return (
    <section className={`bg-white border border-nop-border rounded-sm shadow-[0_1px_1px_rgba(0,0,0,0.06)] ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center gap-3 justify-between border-b border-nop-border px-4 py-2.5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-nop-ink truncate">{title}</h2>}
            {subtitle && <p className="text-xs text-nop-muted mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

const BTN = {
  primary: 'bg-nop-blue hover:bg-nop-blue-dark text-white border-nop-blue-dark',
  default: 'bg-white hover:bg-gray-50 text-nop-ink border-nop-border',
  success: 'bg-nop-green hover:brightness-95 text-white border-transparent',
  danger: 'bg-nop-red hover:brightness-95 text-white border-transparent',
  warning: 'bg-nop-amber hover:brightness-95 text-white border-transparent',
  // .button-1 in DefaultClean: no border, uppercase, 15px, padding 10px 30px, square
  brand: 'brand-bg hover:brightness-110 border-transparent uppercase tracking-wide rounded-none',
};

export function Button({
  variant = 'default', size = 'md', as = 'button', to, children, className = '', ...rest
}) {
  const cls = `inline-flex items-center justify-center gap-1.5 border rounded-sm font-medium transition
    ${variant === 'brand' ? (size === 'lg' ? '!px-8 !py-2.5 !text-[15px]' : '') : ''}
    ${size === 'sm' ? 'text-xs px-2.5 py-1.5' : size === 'lg' ? 'text-[15px] px-5 py-2.5' : 'text-[13px] px-3 py-2'}
    ${BTN[variant] ?? BTN.default} disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
  if (as === 'link') return <Link to={to} className={cls} {...rest}>{children}</Link>;
  return <button type="button" className={cls} {...rest}>{children}</button>;
}

/** The native admin button bar: Save / Save and Continue Edit / Back to list. */
export function ButtonBar({ onSave, onSaveContinue, backTo, backLabel = 'Back to list', extra }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onSave && <Button variant="primary" onClick={onSave}>Save</Button>}
      {onSaveContinue && <Button onClick={onSaveContinue}>Save and Continue Edit</Button>}
      {extra}
      {backTo && <Button as="link" to={backTo}>{backLabel}</Button>}
    </div>
  );
}

export function Badge({ tone = 'default', children, title }) {
  const tones = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    purple: 'bg-violet-50 text-violet-800 border-violet-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
  };
  return (
    <span title={title} className={`inline-flex items-center gap-1 border rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap ${tones[tone] ?? tones.default}`}>
      {children}
    </span>
  );
}

/** The nopCommerce admin grid: optional search panel, header row, hover rows, footer paging. */
export function Grid({
  columns, rows, empty = 'No data available.', rowKey = (r, i) => i, onRowClick, dense = false, footer,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full nop-grid border-collapse">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key ?? c.header} style={{ width: c.width }} className={c.align === 'right' ? 'text-right' : ''}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={dense ? 'text-[12.5px]' : 'text-[13px]'}>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="text-center text-nop-muted py-8">{empty}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr
              key={rowKey(r, i)}
              className={onRowClick ? 'cursor-pointer' : undefined}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key ?? c.header} className={c.align === 'right' ? 'text-right' : ''}>
                  {c.render ? c.render(r, i) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}

export function SearchPanel({ children, onSearch, onClear }) {
  return (
    <div className="border border-nop-border rounded-sm bg-nop-head">
      <div className="px-3 py-2 border-b border-nop-border text-xs font-semibold text-gray-600 uppercase tracking-wide">Search</div>
      <div className="p-3 grid gap-3 md:grid-cols-3 lg:grid-cols-4">{children}</div>
      {(onSearch || onClear) && (
        <div className="px-3 pb-3 flex gap-2">
          {onSearch && <Button variant="primary" size="sm" onClick={onSearch}>Search</Button>}
          {onClear && <Button size="sm" onClick={onClear}>Clear</Button>}
        </div>
      )}
    </div>
  );
}

export function Field({ label, hint, children, required }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-nop-red"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11.5px] text-nop-muted mt-1">{hint}</span>}
    </label>
  );
}

const inputCls = 'w-full border border-nop-border rounded-sm px-2.5 py-1.5 text-[13px] bg-white focus:border-nop-blue';
export const Input = (p) => <input {...p} className={`${inputCls} ${p.className ?? ''}`} />;
export const Select = ({ children, ...p }) => <select {...p} className={`${inputCls} ${p.className ?? ''}`}>{children}</select>;
export const Textarea = (p) => <textarea {...p} className={`${inputCls} ${p.className ?? ''}`} />;

export function Checkbox({ label, hint, ...rest }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input type="checkbox" {...rest} className="mt-0.5 size-4 accent-[var(--color-nop-blue)]" />
      <span>
        <span className="text-[13px] text-gray-800">{label}</span>
        {hint && <span className="block text-[11.5px] text-nop-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** The native admin tab strip. */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-nop-border flex gap-0.5 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-[13px] whitespace-nowrap border border-b-0 rounded-t-sm -mb-px
            ${active === t.id
            ? 'bg-white border-nop-border text-nop-ink font-semibold'
            : 'bg-nop-head border-transparent text-nop-muted hover:text-nop-ink'}`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-[11px] text-nop-muted">({t.count})</span>}
        </button>
      ))}
    </div>
  );
}

export function useTabs(tabs, initial) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  return [active, setActive];
}

/** AdminLTE small box - the dashboard tiles. */
export function StatTile({
  label, value, hint, tone = 'blue', to,
}) {
  const tones = {
    blue: 'bg-nop-blue',
    green: 'bg-nop-green',
    amber: 'bg-nop-amber',
    red: 'bg-nop-red',
    purple: 'bg-violet-700',
    slate: 'bg-slate-600',
  };
  const inner = (
    <div className="bg-white border border-nop-border rounded-sm overflow-hidden h-full">
      <div className={`${tones[tone] ?? tones.blue} px-3 py-2 text-white`}>
        <div className="text-2xl font-semibold leading-tight">{value}</div>
        <div className="text-[12px] opacity-90">{label}</div>
      </div>
      {hint && <div className="px-3 py-1.5 text-[11.5px] text-nop-muted">{hint}</div>}
    </div>
  );
  return to ? <Link to={to} className="block h-full hover:brightness-[1.03]">{inner}</Link> : inner;
}

export function Alert({ tone = 'info', title, children }) {
  const tones = {
    info: 'bg-sky-50 border-sky-200 text-sky-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-950',
    error: 'bg-red-50 border-red-200 text-red-900',
  };
  return (
    <div className={`border rounded-sm px-3 py-2.5 text-[13px] ${tones[tone]}`}>
      {title && <div className="font-semibold mb-0.5">{title}</div>}
      {children}
    </div>
  );
}

/** The label every held feature carries - decision P-1. */
export function HeldLabel({ feature, className = '' }) {
  if (!feature?.held) return null;
  return (
    <span className={`inline-flex items-center gap-1 border border-amber-300 bg-amber-50 text-amber-900 rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${className}`}>
      Prototype default - decision {feature.heldBy.join(' / ')} pending
    </span>
  );
}

/** Where a value or behaviour comes from in the PRD. Shown, not hidden: the prototype is evidence. */
export function Citation({ children, className = '' }) {
  if (!children) return null;
  return (
    <p className={`text-[11.5px] text-nop-muted leading-relaxed ${className}`}>
      <span className="font-semibold text-gray-600">Source: </span>
      {children}
    </p>
  );
}

export function NotBuilt({ wave, waveName, note }) {
  return (
    <Alert tone="warning" title={`Not built in Session 0${wave ? ` - wave ${wave} ${waveName ?? ''}` : ''}`}>
      {note ?? 'Session 0 set up the repository, the 24 area plugins, the configuration packs, the mocks, the tests and the trace report, and built one end-to-end journey. This screen is registered from the module chapter and is built in its own session.'}
    </Alert>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-2 text-nop-muted text-[13px] py-8 justify-center">
      <span className="size-4 border-2 border-nop-border border-t-nop-blue rounded-full animate-spin" />
      {label}
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[12.5px] text-nop-muted flex items-center gap-1.5 flex-wrap">
      {items.map((it, i) => (
        <React.Fragment key={`${it.label}-${i}`}>
          {i > 0 && <span className="text-gray-300">/</span>}
          {it.to ? <Link to={it.to} className="hover:text-nop-blue">{it.label}</Link> : <span className="text-gray-700">{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function KeyValue({ rows, className = '' }) {
  return (
    <dl className={`grid grid-cols-[minmax(9rem,auto)_1fr] gap-x-4 gap-y-1.5 text-[13px] ${className}`}>
      {rows.filter((r) => r).map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-nop-muted">{k}</dt>
          <dd className="text-gray-800 break-words">{v ?? <span className="text-gray-400">-</span>}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/** Product picture stand-in. No client images were supplied (P-5), so this is a drawn placeholder. */
export function ProductPicture({ picture, name, size = 'md' }) {
  const tones = {
    green: ['#e8f3ec', '#0f6b45'],
    lightgreen: ['#eef7e9', '#4d8c3f'],
    purple: ['#f1eaf7', '#6b3fa0'],
    gold: ['#fbf3e0', '#a9811b'],
    brown: ['#f3ece6', '#7a5438'],
    grey: ['#f1f2f4', '#5b6168'],
    slate: ['#eef1f5', '#44546a'],
    red: ['#fbeceb', '#9c1b1f'],
  };
  const [bg, fg] = tones[picture?.tone] ?? tones.grey;
  // .item-box .picture a:before { padding-top: 100% } - a square box, image centred
  const dims = { sm: 'size-12', md: 'size-full aspect-square', lg: 'size-full aspect-square' };
  const icons = {
    tea: 'M6 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9Zm12 1h2a2 2 0 0 1 0 4h-2',
    coffee: 'M6 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9Zm12 1h2a2 2 0 0 1 0 4h-2',
    sack: 'M8 4h8l-1 3c2 1 3 3 3 6v4a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-4c0-3 1-5 3-6L8 4Z',
    craft: 'M4 10h16l-2 9H6l-2-9Zm3 0a5 5 0 0 1 10 0',
    electronics: 'M9 3h6v4h3v14H6V7h3V3Zm3 7v7',
    box: 'M4 8l8-4 8 4v8l-8 4-8-4V8Zm0 0l8 4 8-4M12 12v8',
    service: 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3Z',
  };
  const d = icons[picture?.kind] ?? icons.box;
  return (
    <div className={`${dims[size]} flex items-center justify-center border border-store-border`} style={{ background: bg }} role="img" aria-label={name ? `${name} (placeholder picture)` : 'placeholder picture'}>
      <svg viewBox="0 0 24 24" className={size === 'sm' ? 'size-7' : 'size-16'} fill="none" stroke={fg} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </div>
  );
}
