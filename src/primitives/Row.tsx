import { Box, Typography, IconButton } from "@mui/material";
import { createContext, useContext, type ReactNode, useEffect, useRef, useState, useMemo } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { tokens } from "@/theme/tokens";
import { useSection } from "@/lib/focus";

/**
 * Broadcasts the row's current responsive `perView` (cards visible per page)
 * down to its tile children. Tiles use this with their own index to decide
 * whether they sit at a page edge (leftmost or rightmost on the current
 * page) so their hover bloom can grow inward and not overlap the row's
 * chevron buttons.
 */
export const RowSizingContext = createContext<{ perView: number; itemCount: number }>({
  perView: 0,
  itemCount: 0,
});

export function useRowSizing() {
  return useContext(RowSizingContext);
}

/**
 * Horizontal scroll row.
 *
 * Transform-based paging (NOT native overflow-x scroll). Two reasons this
 * matters:
 *   1. `overflow-x: auto` would force `overflow-y` to `auto` too, which clips
 *      a tile's hover/focus card-pop on the top and bottom and produces a
 *      vertical scrollbar inside the row. We need overflow-y truly visible
 *      so the popped card escapes the row's footprint. Pairing
 *      `overflow-x: clip` with `overflow-y: visible` is the only way to clip
 *      one axis without converting the other to auto.
 *   2. Chevrons advance by a full *page* of cards (not by 1), and the row
 *      snaps cleanly to that page. Native scroll would let users drift
 *      between pages.
 *
 * Layout: cards run edge-to-edge across the viewport. The leading edge of the
 * first card is at x=0 of the reel; the (perView+1)th card peeks 56px from
 * the right edge, sitting under the right chevron. On page > 0 the row backs
 * off by one chevron-width so the previous page's last card peeks on the
 * left, sitting under the left chevron. Chevrons therefore always cover the
 * partial cards — clicking the chevron doesn't accidentally hover the edge
 * card.
 */

const CHEVRON_WIDTH = 56;

export type PerView = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

function pickPerView(width: number, pv: PerView = {}): number {
  if (width >= 1536) return pv.xl ?? 6;
  if (width >= 1200) return pv.lg ?? 5;
  if (width >= 900) return pv.md ?? 4;
  if (width >= 600) return pv.sm ?? 3;
  return pv.xs ?? 2;
}

// Mirrors TvFrame's paddingInline. The reel runs full-bleed via negative
// margin, then re-applies this inset as padding-left so the leading card on
// page 0 aligns with row titles, hero CTAs, and the wordmark.
function pickInset(width: number): number {
  if (width >= 1200) return tokens.space.xl;
  if (width >= 900) return tokens.space.lg;
  return tokens.space.md;
}

export function Row({
  sectionId,
  title,
  leadingIcon,
  hoverHint,
  onTitleClick,
  titleSlot,
  itemCount,
  itemsPerView,
  gap = tokens.grouping.cardGap,
  children,
}: {
  sectionId: string;
  title?: string;
  /** Glyph rendered to the left of the title; brightens to white on title-bar hover. */
  leadingIcon?: ReactNode;
  /** Small element (text or icon) that animates in to the right of the title on hover. */
  hoverHint?: ReactNode;
  /** Fires when the icon+label+hint cluster is clicked. */
  onTitleClick?: () => void;
  titleSlot?: ReactNode;
  itemCount: number;
  /**
   * Target number of fully-visible tiles per page at each breakpoint.
   * Floored to an integer for the page advance step.
   */
  itemsPerView?: PerView;
  gap?: number;
  children: ReactNode;
}) {
  const { activeIndex, isActive } = useSection(sectionId, itemCount);
  // We measure the reel itself (the full-bleed div), not the outer container —
  // the reel escapes the TvFrame's safe-zone padding via negative margin, so
  // its actual paint width is the full viewport width. Sizing cards off the
  // container would leave them ~120px short of the right edge.
  const reelRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setWidth(cr.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const perView = Math.max(1, Math.floor(pickPerView(width, itemsPerView)));
  const leftInset = pickInset(width);

  // Card width: leading card sits at safe-zone (leftInset), perView cards +
  // gaps fill out to (width - CHEVRON_WIDTH). The (perView+1)th card lands at
  // the chevron, providing the right peek. On page > 0 the reel slides exactly
  // perView card-widths, leaving the previous card's tail (leftInset - gap) px
  // visible behind the left chevron — the left peek.
  const cardW =
    width > 0
      ? Math.max(40, (width - leftInset - CHEVRON_WIDTH - (perView - 1) * gap) / perView)
      : 0;
  const pageDistance = perView * (cardW + gap);
  const totalPages = Math.max(1, Math.ceil(itemCount / perView));
  const maxTranslate = Math.max(
    0,
    leftInset + itemCount * (cardW + gap) - gap - width + CHEVRON_WIDTH,
  );

  // Clamp page after itemCount/perView changes so the row never lands on an empty page.
  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  // Keyboard nav: keep the focused tile on a visible page.
  useEffect(() => {
    if (!isActive) return;
    const targetPage = Math.floor(activeIndex / perView);
    if (targetPage !== page) setPage(targetPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isActive, perView]);

  // Translate by exactly one page-width per step. Because the reel carries a
  // padding-left of `leftInset`, page 0 lands the leading card at safe-zone L;
  // each subsequent page slides the row exactly perView cards, so the tail of
  // the previous page peeks (leftInset - gap)px behind the left chevron.
  const desired = page * pageDistance;
  const translate = Math.min(desired, Math.max(0, maxTranslate));

  function nudge(dir: -1 | 1) {
    setPage((p) => Math.max(0, Math.min(totalPages - 1, p + dir)));
  }

  const sizingValue = useMemo(
    () => ({ perView, itemCount }),
    [perView, itemCount],
  );

  return (
    <RowSizingContext.Provider value={sizingValue}>
    <Box
      sx={{
        position: "relative",
        zIndex: 1,
        // Row hover lifts the stacking context so the scaled hover partial
        // isn't clipped by the next row, brightens the title, and reveals the
        // row's row-level affordances (magic trigger, etc).
        "&:hover, &:has([data-focusable-tile]:hover)": {
          zIndex: 50,
          "& .row-title-bar": { opacity: 1 },
        },
      }}
    >
      <Box
        className="row-title-bar"
        sx={{
          mb: 0,
          paddingInline: 0,
          display: "flex",
          alignItems: "center",
          gap: `${tokens.space.sm}px`,
          opacity: 0.85,
          transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        }}
      >
        {(leadingIcon || title || hoverHint) && (
          <Box
            component={onTitleClick ? "button" : "div"}
            type={onTitleClick ? "button" : undefined}
            onClick={onTitleClick}
            className="row-title-trigger"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              // Tight gap between the channel glyph and its label.
              gap: "6px",
              // Ghost-button hit area: 20px around the icon+label cluster,
              // with no background change. Negative margins collapse the
              // padding's effect on layout, and the leading -26px pulls the
              // cluster 6px past the row's logical left edge so the channel
              // icon hangs into the safe-zone gutter (a deliberate departure
              // from Netflix's metrics — this is a channel-experiment row).
              padding: "20px",
              marginLeft: "-26px",
              marginRight: "-20px",
              marginBlock: "-20px",
              background: "transparent",
              border: 0,
              font: "inherit",
              textAlign: "left",
              color: "inherit",
              cursor: onTitleClick ? "pointer" : "default",
              // Individual animation-* properties (NOT the shorthand) so the
              // per-path `animation-delay` set inside ChannelBarsIcon survives.
              // The `animation` shorthand would reset animation-delay to 0 and
              // collapse all bars onto the same color.
              "&:hover .row-title-icon path": {
                animationName: "channelBarCycle",
                animationDuration: "1.4s",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
              },
              "&:hover .row-title-label": { color: "#fff" },
              "&:hover .row-title-hint": { opacity: 1, transform: "translateX(0)" },
            }}
          >
            {leadingIcon && (
              <Box
                className="row-title-icon"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: tokens.color.textSecondary,
                  transition: `color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
                }}
              >
                {leadingIcon}
              </Box>
            )}
            {title && (
              <Typography
                className="row-title-label"
                sx={{
                  fontSize: { xs: 16, md: 18, lg: 20 },
                  lineHeight: 1.2,
                  fontWeight: tokens.type.weight.semibold,
                  color: tokens.color.textPrimary,
                  letterSpacing: "-0.005em",
                  transition: `color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
                }}
              >
                {title}
              </Typography>
            )}
            {hoverHint && (
              <Box
                className="row-title-hint"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: tokens.color.textSecondary,
                  // Extra leading whitespace so the hint feels separated
                  // from the bolder title rather than crowding it.
                  marginLeft: "10px",
                  opacity: 0,
                  transform: "translateX(-6px)",
                  transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
                }}
              >
                {hoverHint}
              </Box>
            )}
          </Box>
        )}
        {titleSlot}
        <Box sx={{ flex: 1 }} />
        {totalPages > 1 && <PageProgress pages={totalPages} current={page} />}
      </Box>

      <Box
        ref={reelRef}
        sx={{
          position: "relative",
          // Full-bleed: escape the TvFrame's safe-zone padding so the reel runs
          // to the viewport edges. The chevrons then sit on top of the partial
          // cards at those edges, and the cards extend uninterrupted across.
          marginInline: {
            xs: `-${tokens.space.md}px`,
            md: `-${tokens.space.lg}px`,
            lg: `-${tokens.space.xl}px`,
          },
          // `overflow-x: clip` clips horizontally without forcing overflow-y to
          // auto (which `hidden` would do). This lets card-pop on hover/focus
          // grow vertically past the row's footprint.
          overflowX: "clip",
          overflowY: "visible",
          "&:hover .row-chevron": { opacity: 1 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: `${gap}px`,
            paddingTop: "10px",
            paddingBottom: `${tokens.grouping.rowReelPadding}px`,
            paddingLeft: leftInset > 0 ? `${leftInset}px` : undefined,
            transform: `translate3d(${-translate}px, 0, 0)`,
            transition: `transform 600ms ${tokens.motion.easing.focus}`,
            willChange: "transform",
            "& > *": {
              flexShrink: 0,
              width: cardW > 0 ? `${cardW}px` : "auto",
            },
          }}
        >
          {children}
        </Box>

        {page > 0 && <ChevronButton side="left" onClick={() => nudge(-1)} />}
        {page < totalPages - 1 && <ChevronButton side="right" onClick={() => nudge(1)} />}
      </Box>
    </Box>
    </RowSizingContext.Provider>
  );
}

function ChevronButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <IconButton
      data-row-nav
      className="row-chevron"
      aria-label={side === "left" ? "Previous page" : "Next page"}
      onClick={onClick}
      sx={{
        position: "absolute",
        [side]: 0,
        top: 0,
        bottom: 0,
        height: "auto",
        width: CHEVRON_WIDTH,
        borderRadius: 0,
        zIndex: 40,
        backgroundColor: "rgba(20,20,20,0.5)",
        color: tokens.color.textPrimary,
        opacity: 0,
        transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, background-color 150ms`,
        // Hit-area stays at the full CHEVRON_WIDTH × row-height slab; only the
        // glyph inside scales up on hover so the affordance feels alive
        // without making the click target oversized.
        "& .MuiSvgIcon-root": {
          transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        },
        "&:hover": { backgroundColor: "rgba(20,20,20,0.8)" },
        "&:hover .MuiSvgIcon-root": { transform: "scale(1.4)" },
      }}
    >
      {side === "left" ? (
        <ChevronLeftIcon sx={{ fontSize: 36 }} />
      ) : (
        <ChevronRightIcon sx={{ fontSize: 36 }} />
      )}
    </IconButton>
  );
}

/**
 * Subtle segment indicator at the top-right of each row, mimicking the real
 * Netflix home page's per-row progress dashes. Each page gets a thin pill;
 * the active one is brighter.
 */
function PageProgress({ pages, current }: { pages: number; current: number }) {
  return (
    <Box sx={{ display: "flex", gap: "2px", alignItems: "center" }}>
      {Array.from({ length: pages }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: 12,
            height: 2,
            backgroundColor:
              i === current ? tokens.color.textSecondary : "rgba(245,245,245,0.18)",
            transition: `background-color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
          }}
        />
      ))}
    </Box>
  );
}
