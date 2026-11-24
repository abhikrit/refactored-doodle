# nopCommerce 5.00.1 UI reference — collected from the open source

Collected on 2026-11-24 from the official source, tag `release-5.00.1`
(`github.com/nopSolutions/nopCommerce`, commit `daed7a6`), by sparse checkout of:

| Path (relative to `src/`) | What it gives |
|---|---|
| `Presentation/Nop.Web/Themes/DefaultClean/Content/css/styles.css` | the storefront design system (148 KB, the whole theme) |
| `Presentation/Nop.Web/Views/Shared/_Root.cshtml`, `_Header.cshtml` | the storefront page skeleton |
| `Presentation/Nop.Web/Areas/Admin/Views/Shared/_AdminLayout.cshtml` | the admin page skeleton |
| `Presentation/Nop.Web/wwwroot/css/admin/styles.css` | the admin design system (42 KB) |

Nothing from that source is copied into this repository. What follows is the measured design
system, so the React + Tailwind replica is faithful instead of approximate.

---

## 1. Storefront — DefaultClean

### 1.1 Design tokens, verbatim from the theme's `:root`

```css
:root {
  --accent-blue-color:        #4ab2f1;   /* links, product titles, primary buttons */
  --accent-blue-active-color: #248ece;   /* its focus / active state */
  --gray-color:               #6B6B6B;   /* body text */
  --dark-gray-color:          #444;      /* headings, emphasis */
  --error-red-color:          #d51f28;
  --success-green-color:      #207d4c;
}
body { font: normal 14px Arial, Helvetica, sans-serif; color: var(--gray-color); background: #fff; }
```

Greys that carry the layout, by frequency of use in the theme: `#ddd` (every border, 66 uses),
`#f6f6f6` (block titles, order progress), `#f9f9f9` (totals panel), `#eee`, `#e6e6e6`, `#999`,
`#888`. There is **no border radius and no shadow** anywhere in the theme: edges are square.

### 1.2 Page skeleton (`_Root.cshtml`)

```
.master-wrapper-page
├── _Header                     .header > .header-upper (border-bottom 1px #ddd)
│                                       > .header-lower (padding 35px 0)
│                                 .header-logo · .header-links-wrapper
│                                 .header-selectors-wrapper (currency, language)
│                                 .search-box.store-search-box (input 200×36)
├── .header-menu                 the category menu
├── main.master-wrapper-content  width 90%, margin auto
│   └── .master-column-wrapper   .side-2 + .center-2 (two-column) or .center-1
└── Footer                       .footer-upper (flex, gap 100px, border-bottom #ddd)
```

### 1.3 Component rules worth matching exactly

| Component | Rule as the theme states it |
|---|---|
| `.page-title` | `min-height 50px; margin 0 0 25px; border-bottom 1px solid #ddd; padding 6px 10px`; `h1` is `30px`, **font-weight normal** |
| `.block .title` (left column) | `border-bottom 1px solid #ddd; background #f6f6f6; padding 12px 30px 12px 10px; font-size 20px; color #444` |
| `.item-box` (product card) | `margin 0 0 80px; text-align left` |
| `.item-box .picture a:before` | `padding-top 100%` — the picture is a **square** box, image centred inside |
| `.item-box .product-title` | `font-size 17px; line-height 1.2; font-weight normal; color #4ab2f1` |
| `.item-box .actual-price` | `font-size 16px; color #6B6B6B` |
| `.button-1` (primary) | `border none; background #4ab2f1; padding 10px 30px; font-size 15px; color #fff; **text-transform uppercase**`; focus → `#248ece` |
| `.button-2` (secondary) | same shape, `background #888` (or `#eaeaea` with dark text); uppercase |
| `.cart-footer .totals` | `width 350px; background #f9f9f9; padding 10px; color #444` |
| `.cart-total .order-total` | `font-size 20px; color #4ab2f1` |
| `.cart-footer .checkout-button` | `min-width 160px; background #4ab2f1; padding 10px 20px; font-size 16px; uppercase` |
| `.cart-footer .checkout-disabled` | `background #ffa500; border 1px solid #c3891e; color #fff; padding 15px 50px; font-size 20px` |
| `.order-progress` (checkout steps) | `background #f6f6f6; padding 15px 0; text-align center`; each step `a:before` is a `40×40` circle, `border 1px solid #bbb`, `background #fff`; inactive step `opacity 0.3` |
| `.cart` on mobile | the table **becomes cards**: `thead` hidden, each `tr` a bordered block |

---

## 2. Administration

`_AdminLayout.cshtml` sets `<body class="hold-transition sidebar-mini layout-fixed control-sidebar-slide-open">`
and `<aside class="main-sidebar sidebar-dark-primary elevation-4">` — the admin area is
**AdminLTE 3 on Bootstrap 4**, with nopCommerce's own `wwwroot/css/admin/styles.css` on top.

### 2.1 Palette, by frequency in `css/admin/styles.css`

| Colour | Use |
|---|---|
| `#3c8dbc` | primary (buttons, active nav item, links) |
| `#367fa9` | its hover / active |
| `#ecf0f5` | `.content-wrapper` canvas |
| `#f4f4f4` | panel and table headers |
| `#d2d6de` | borders and inputs |
| `#dd4b39` | danger |
| `#f39c12` | warning |
| `#00c0ef` | info |
| `#2e2e2e` | the dark navbar / sidebar |

`.form-control { border-radius: 0 }` — square inputs here too. `.content-header { padding: 15px 1rem }`.

### 2.2 Page skeleton

```
.wrapper
├── nav.main-header.navbar.navbar-expand-md.navbar-dark.bg-dark
│     pushmenu toggle · brand · language selector · user name · Logout · Public store · maintenance menu
├── aside.main-sidebar.sidebar-dark-primary.elevation-4
│     .brand-link · .sidebar > .sidebar-form (search) · .nav-sidebar (the menu tree)
├── .content-wrapper
│     .content-header (page title + breadcrumb) · .content > .card(s)
└── footer.main-footer
```

---

## 3. What this changes in the prototype

| Was | Now, from source |
|---|---|
| Segoe UI, 14px | **Arial, Helvetica, sans-serif, 14px** |
| body text `#333` | **`#6B6B6B`**, headings `#444` |
| storefront borders `#d2d6de` | **`#ddd`** |
| rounded corners on cards and buttons | **square** — the theme has no radius |
| sentence-case buttons | **uppercase, 15px, `padding 10px 30px`** |
| page title 20px semibold | **30px, weight normal, 1px `#ddd` underline** |
| left-column block titles plain | **`#f6f6f6` fill, 20px, `#444`** |
| checkout steps as pills | **`.order-progress` bar: `#f6f6f6`, 40px numbered circles, inactive at `opacity 0.3`** |
| product card picture free-height | **square picture box (`padding-top: 100%`)**, 17px accent-blue title, 16px price |
| totals panel white | **`#f9f9f9`**, order total 20px in the accent colour |

The admin area already matched (`#3c8dbc` / `#ecf0f5` / `#d2d6de` / `#f4f4f4`), which this
collection confirms rather than changes.

**Branding (PRD-PLT-006) stays on top of this.** `--accent-blue-color` is the nopCommerce
default; the client pack overrides it — KTDA green, Malawi Post red — which is exactly what
"Branding and theme: colours, fonts, layout per client without code" means. Switching the pack
changes the accent, never the structure.
