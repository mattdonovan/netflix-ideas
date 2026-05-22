/**
 * Hawkins-flavored design tokens.
 *
 * The values here are inferred from public Hawkins documentation, Netflix
 * screenshots, and the TV design primer in /context. We deliberately do NOT
 * use Netflix's brand red as the accent — this is a Netflix-flavored system,
 * not a Netflix knockoff. The warm-red accent here is adjacent, not identical.
 *
 * Design scale assumes 1080p (1920×1080) as the canonical TV viewport.
 * Spacing, type, and radius are absolute px values, not rems — TV doesn't
 * give us reliable root-em scaling and absolute values let us reason
 * about the couch-distance experience directly.
 */

export const tokens = {
  /**
   * Color. Dark-first; off-whites instead of pure white to avoid TV halo.
   * Surfaces step from base → low → mid → high to give breathing room
   * without needing borders.
   */
  color: {
    // Backgrounds — `base` is the page background. Matches Netflix's real
    // home-page surface color (#141414). Higher surfaces step up from there
    // to give cards / panels visual lift on the same flat background.
    base: "#141414",
    surfaceLow: "#1A1A1A",
    surfaceMid: "#222222",
    surfaceHigh: "#2A2A2A",

    // Text — never pure white (#F5F5F5 is the Netflix-region off-white)
    textPrimary: "#F5F5F5",
    textSecondary: "#A8A8A8",
    textTertiary: "#6E6E6E",
    textInverse: "#0B0B0B",

    // Accent — warm red, adjacent to Netflix red without being it
    accent: "#E4404C",
    accentHover: "#F25862",
    accentMuted: "rgba(228, 64, 76, 0.16)",

    // Brand quotation — real Netflix red. Held in reserve for moments where
    // the reference is intentional (Invite share CTA, acceptance flash).
    brand: "#E50914",

    // Semantic
    success: "#2BB673",
    warning: "#E5A23A",
    danger: "#E4404C",
    errorStroke: "#E50914",

    // Borders / dividers — minimum 2px on TV
    border: "rgba(245, 245, 245, 0.08)",
    borderStrong: "rgba(245, 245, 245, 0.16)",

    // Focus — the loudest signal in the system
    focusRing: "#F5F5F5",
    focusGlow: "rgba(245, 245, 245, 0.24)",
    focusShadow: "0 0 0 4px rgba(245, 245, 245, 0.16), 0 16px 48px rgba(0,0,0,0.6)",
  },

  /**
   * Spacing scale — 4px base. TV layouts skew toward larger steps.
   * Use the named slots; only fall back to raw px for truly one-off cases.
   */
  space: {
    xxs: 4,
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    "2xl": 64,
    "3xl": 96,
    "4xl": 128,
  },

  /**
   * Grouping spacing — semantic tokens that encode "how much air should sit
   * between things that belong together vs. things that are separate."
   *
   * cardGap: cards within a row are tightly grouped (they form one logical
   *   reel). Tight gaps signal "these scroll together."
   * rowGap: rows are independent sections — they need breathing room.
   * rowReelPadding: vertical breathing room *inside* the reel, so that the
   *   card-pop scale animation has room to extend above/below the resting
   *   tile footprint without being clipped by the row title or the next row.
   */
  grouping: {
    cardGap: 8,
    rowGap: 32,
    rowReelPadding: 16,
  },

  /**
   * Typography. Inter as the open-source stand-in for Netflix Sans.
   * Sizes are tuned for 10ft viewing — body floors at 24px.
   */
  type: {
    family: {
      sans: `'Inter Variable', 'Inter', system-ui, -apple-system, 'Helvetica Neue', sans-serif`,
      mono: `'JetBrains Mono', 'SF Mono', Menlo, monospace`,
    },
    weight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    /**
     * Type scale at 1080p TV design size.
     * Each entry: { size, lineHeight, letterSpacing }
     */
    scale: {
      display: { size: 96, lineHeight: 1.04, letterSpacing: "-0.02em" },
      h1: { size: 64, lineHeight: 1.08, letterSpacing: "-0.015em" },
      h2: { size: 48, lineHeight: 1.12, letterSpacing: "-0.01em" },
      h3: { size: 32, lineHeight: 1.2, letterSpacing: "-0.005em" },
      h4: { size: 24, lineHeight: 1.3, letterSpacing: "0em" },
      body: { size: 24, lineHeight: 1.4, letterSpacing: "0em" },
      bodySmall: { size: 20, lineHeight: 1.4, letterSpacing: "0em" },
      label: { size: 18, lineHeight: 1.3, letterSpacing: "0.04em" },
      micro: { size: 14, lineHeight: 1.3, letterSpacing: "0.08em" },
    },
  },

  /**
   * Border radius. Posters and cards are nearly square on TV;
   * pills/chips are fully rounded.
   */
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 16,
    pill: 999,
  },

  /**
   * Motion. Focus is the primary feedback channel — generous timing.
   * Press is fast. Entrance is slowest.
   */
  motion: {
    duration: {
      press: 100,
      focusFast: 150,
      focus: 220,
      page: 400,
      entrance: 480,
    },
    easing: {
      // out-quart-ish — slows down at the end, like physical objects settling
      focus: "cubic-bezier(0.22, 1, 0.36, 1)",
      // standard ease-out for press
      press: "cubic-bezier(0.32, 0.72, 0, 1)",
      // soft entrance
      entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
  },

  /**
   * TV safe zone — 5% on every edge per Fire TV spec. We pre-compute the
   * inner content box for 1080p so layouts can reference it directly.
   */
  tv: {
    viewport: { width: 1920, height: 1080 },
    safeZonePct: 0.05,
    safeBox: { width: 1728, height: 972, marginX: 96, marginY: 54 },
    // Focused tile scale-up factor — the Netflix tile bloom is ~1.08–1.12
    focusScale: 1.08,
    // Time after no input before idle ambient motion can begin
    idleDelayMs: 4000,
  },

  /**
   * Shadow tokens — used sparingly. TV gamma turns subtle shadows into mud,
   * so we use them only when something needs to lift visibly off the surface.
   */
  shadow: {
    none: "none",
    sm: "0 2px 8px rgba(0,0,0,0.32)",
    md: "0 8px 24px rgba(0,0,0,0.48)",
    lg: "0 24px 64px rgba(0,0,0,0.64)",
  },
} as const;

export type Tokens = typeof tokens;
