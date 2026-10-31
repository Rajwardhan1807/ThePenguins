---
name: Archival Research Terminal
colors:
  surface: '#101319'
  surface-dim: '#101319'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2eb'
  on-surface-variant: '#dbc2b0'
  inverse-surface: '#e1e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#a38c7c'
  outline-variant: '#554336'
  surface-tint: '#ffb77d'
  primary: '#ffb77d'
  on-primary: '#4d2600'
  primary-container: '#d97707'
  on-primary-container: '#432100'
  inverse-primary: '#904d00'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#b9c8de'
  on-tertiary: '#233143'
  tertiary-container: '#8392a6'
  on-tertiary-container: '#1c2b3c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d4e4fa'
  tertiary-fixed-dim: '#b9c8de'
  on-tertiary-fixed: '#0d1c2d'
  on-tertiary-fixed-variant: '#39485a'
  background: '#101319'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
typography:
  headline-xl:
    fontFamily: Newsreader
    fontSize: 3.5rem
    fontWeight: '400'
    lineHeight: 3.75rem
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: '400'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 2.5rem
    fontWeight: '400'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 1.75rem
    fontWeight: '400'
    lineHeight: 2.125rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Newsreader
    fontSize: 1.75rem
    fontWeight: '500'
    lineHeight: 2.125rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.625rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Newsreader
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.08em
  code-tabular:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: -0.02em
spacing:
  gutter: 0px
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies the solemn, austere, and uncompromising reality of deep archival investigation, forensic intelligence, and institutional verification. It rejects modern software clichés—eliminating playfulness, rounded cards, vibrant gradients, floating avatars, and decorative visualizations in favor of an authoritative, print-informed digital broadsheet.

### Personality & Core Tenets
- **Sovereign & Impartial:** Interfaces present unvarnished evidence, structural provenance, and primary sources without editorializing or decorative patronization.
- **Austere & Scholarly:** Drawing from declassified government dossiers, international court transcripts, and specialized research archives. Form follows analytical necessity.
- **Tense & Deliberate:** Asymmetrical proportions, expansive tabular density, and stark spatial hierarchy evoke an environment built for scrutiny, deep focus, and high-consequence judgment.

### Design Movement
**Classical Monastic Brutalism & Editorial Typographic System:** Flat, opaque structural planes separated by razor-thin hairline borders, strictly governed by ink-trap logic and historical print composition. Spatial depth is communicated through framing and density rather than optical elevation or soft drop shadows.

## Colors

The chromatic architecture is constructed entirely from deep mineral carbon, raw slate, and deliberate, low-luminance functional signals. 

### Palette Definition
- **Base Terminal Canvas (`#08090b`):** The foundational absolute void, reserved for canvas-level backdrop and deep margin borders.
- **Primary Surface / Containers (`#0e1117`):** The default plane for primary textual documents, dossiers, and reading chambers.
- **Elevated Substratum (`#131720`):** Secondary structural blocks, table headers, and metadata sidecars.
- **Interactive Planes / Active Cells (`#1c212d`):** Focused record rows, active tab indicators, and input backgrounds.
- **Hairline Dividers (`#222735` & `#2a3142`):** 1px boundaries serving as structural rules, column dividing gutters, and registration lines.
- **Amber / Muted Gold (`#d97706`, text highlight `#f59e0b`):** The primary semantic accent. Signifies methodological friction, disputed facts, pending adjudication, and unverified propositions.
- **Muted Emerald (`#10b981`):** The secondary verification accent. Reserved strictly for corroborated statutory filings, notarized chains of custody, and cryptographic validations.
- **Archival Slate (`#94a3b8`):** The tertiary metadata tier. Used for catalog callouts, timestamps, filing IDs, and cross-references.
- **Ink White (`#f1f5f9`):** Primary editorial text and high-contrast headlines.

## Typography

The typographical structure balances historical literary authority with analytical neutrality.

### Font Roles
- **Newsreader:** Applied exclusively to editorial narratives, inquiry questions, contested propositions, section registers, and dossier titles. It must always render with standard ligatures and natural optical sizing. Headlines in Newsreader convey historical permanence and investigative weight.
- **Inter:** Applied to UI controls, table rows, comparative data grids, metadata ribbons, and analytical annotations. Inter must always be configured with tabular lining numbers (`font-variant-numeric: tabular-nums`) to preserve strict column alignment across numerical balances, statutory dates, and registry codes.

### Typographic Rules
- All `label-sm` classifications, dossier tags, status markers, and column keys are rendered in uppercase with wide tracking (`0.08em`).
- Headings never use heavy bold weights; maximum weight is 500, preserving fine serifs and ink contours against dark backgrounds.

## Layout & Spacing

The terminal uses an asymmetrical broadsheet grid inspired by legal gazettes and forensic ledgers. Layout elements sit within structural hairline cell blocks.

### Grid & Composition
- **Hairline Collapsed Matrix:** Gutters are set to `0px`. Visual separation is achieved via `1px solid #222735` borders between adjacent panels, mimicking column rules in letterpress composition.
- **Asymmetric Proportions:** Desktop layouts divide across an intentional split—such as a 30% analytical index / dossier index panel paired with a 70% primary reading and verification ledger.
- **Section Margins:** Outer boundaries remain disciplined at `1.5rem` on desktop and `1rem` on mobile terminals, ensuring content fills the display with archival density.

### Breakpoints & Adaptivity
- **Desktop (1280px+):** Multi-pane split screen. Dossier ledger, primary text panel, and citation metadata manifest simultaneously side-by-side.
- **Tablet (768px - 1279px):** Collapses to a dual-pane view. Citations and statutory verification shift into expandable bottom sheets or drawer panels.
- **Mobile (< 768px):** Linear stacked broadsheet. Outer margin drops to `1rem`, headline scales collapse to mobile-specific tokens, and table matrices gain horizontal scroll with locked primary columns.

## Elevation & Depth

This system intentionally rejects ambient blur, dropshadows, glassmorphism, and simulated 3D Z-axes. Depth is strictly architectural, tonal, and planographic.

### Surface Tiers
- **Sub-level 0 (`#08090b`):** Terminal viewport boundary, workspace margins, and structural matrix background.
- **Sub-level 1 (`#0e1117`):** Primary document canvas and reading sheets.
- **Sub-level 2 (`#131720`):** Secondary utility sidebars, metadata columns, and table headers.
- **Sub-level 3 (`#1c212d`):** Focused cells, command inputs, and contextual flyouts.

### Hairline Rules & Structural Borders
- Surface boundaries are demarcated exclusively by a `1px` stroke:
  - Inactive / passive separation: `#222735`
  - Active / selected container boundary: `#2a3142`
  - Warning / contested proposition perimeter: `#d97706` (1px solid)
  - Statutory corroboration perimeter: `#10b981` (1px solid)

Modals, menus, and contextual overlays do not hover with blurred shadows; they render as solid, opaque `#0e1117` surfaces framed by a crisp `1px solid #2a3142` structural line.

## Shapes

The design system enforces complete geometric discipline. 

- **Corner Radius:** Every component, container, input, modal, and badge features strict, unrounded corners (`0px` / Level 0).
- **Rationale:** Rounded geometry suggests consumer friendliness and tactile softness. A 0px structural geometry treats the terminal screen as a ledger sheet, maintaining mechanical tension and uncompromising archival authority.
- **Borders & Framing:** Crisp right angles with 1px hairline edges represent standard document bounds, filing index cards, and microfilm frames.

## Components

### Buttons & Operational Triggers
- **Primary Action:** Solid `#d97706` background with `#08090b` high-contrast monospace/sans text (`label-md`). 0px radius, 0px border. Hover shifts tone to `#f59e0b`.
- **Secondary / Archival Action:** `#0e1117` background, `1px solid #2a3142` border, `#f1f5f9` text. Hover shifts background to `#1c212d` and border to `#94a3b8`.
- **Danger / Deletion Action:** Black ground with `1px solid #dc2626`, crimson ink text. Zero glow.

### Chips & Classification Indicators
- Rectangular pill counters are forbidden. Chips are rectangular ledger stamps: `0px` radius, `1px solid` perimeter, uppercase `label-sm` font.
- **Contested / Friction:** `1px solid #d97706`, text `#f59e0b`, background `rgba(217, 119, 6, 0.08)`.
- **Verified Statutory:** `1px solid #10b981`, text `#10b981`, background `rgba(16, 185, 129, 0.08)`.
- **Metadata Reference:** `1px solid #222735`, text `#94a3b8`, background `#131720`.

### Data Ledgers & Comparative Lists
- Replaces standard lists with archival tables.
- Rows feature alternating or unified `#0e1117` backgrounds separated by `1px solid #222735` borders.
- Header cells set in uppercase `label-sm` with text `#94a3b8`.
- Numeric data, statutory dates, and reference codes strictly align right using tabular figures.
- Hover states highlight the entire row in `#131720` with a `2px solid #d97706` indicator on the left boundary.

### Checkboxes & Binary Selectors
- Rigid square boxes (`14px` by `14px`) with `1px solid #2a3142` borders and `0px` border radius.
- Unchecked: `#08090b` interior.
- Checked: `#0e1117` interior with a centered, non-decorative checkmark or cross in `#f1f5f9`.
- Radio selectors are represented as hollow 0px diamond glyphs or square matrix cells rather than circles.

### Terminal Inputs & Search Ledgers
- Flat surfaces (`#08090b`) framed by `1px solid #222735`.
- Focus state: Replaces border with `1px solid #94a3b8` without focus rings or drop glows.
- Cursor: Solid, non-blinking block or standard thin bar in `#d97706`.
- Typography: `body-md` in `#f1f5f9` with placeholder text in muted `#475569`.

### Archival Dossier Cards
- Strictly rectangular containers (`#0e1117`) bordered by `1px solid #222735`.
- Headers are delineated by a horizontal rule (`1px solid #222735`).
- Title in `Newsreader` (`headline-sm` or `headline-md`), accompanied by filing serial numbers and timestamps set in `Inter` (`code-tabular` or `label-sm`).
- Zero drop shadows; separation from neighboring dossiers is achieved via grid borders.

### Dossier Dossier Verification Stamp (Specialized Component)
- High-visibility structural badge applied to contested or validated documents.
- Positioned in upper right margin with `1px solid #10b981` (verified) or `1px solid #d97706` (contested).
- Consists of catalog stamp text, signature date, and filing seal represented purely with vector lines and monospaced codes.