import { Box, Typography, IconButton } from "@mui/material";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { tokens } from "@/theme/tokens";
import { useSection } from "@/lib/focus";
import { RowSizingContext } from "./Row";

/**
 * Top 10 row — Figma 106-9360.
 *
 * The defining Netflix idiom: a giant outlined numeral sits behind each
 * portrait card. The card is offset to the right of its number so the digit
 * is fully visible on the left side of each "slot."
 *
 * Layout + paging logic matches the standard Row: transform-based, edge-to-edge,
 * page advances by `perView` slots, chevrons sit on top of the partial slot
 * peeking past the viewport edges. See Row.tsx for the full rationale.
 */

const CHEVRON_WIDTH = 56;

type PerView = { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };

function pickPerView(width: number, pv: PerView = {}): number {
  if (width >= 1536) return pv.xl ?? 5;
  if (width >= 1200) return pv.lg ?? 4;
  if (width >= 900) return pv.md ?? 3;
  if (width >= 600) return pv.sm ?? 2;
  return pv.xs ?? 2;
}

function pickInset(width: number): number {
  if (width >= 1200) return tokens.space.xl;
  if (width >= 900) return tokens.space.lg;
  return tokens.space.md;
}

export function TopTenRow({
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
  leadingIcon?: ReactNode;
  hoverHint?: ReactNode;
  onTitleClick?: () => void;
  titleSlot?: ReactNode;
  itemCount: number;
  itemsPerView?: PerView;
  gap?: number;
  children: ReactNode;
}) {
  const cappedCount = Math.min(itemCount, 10);
  const { activeIndex, isActive } = useSection(sectionId, cappedCount);

  // Measure the reel (full-bleed) rather than the padded outer container so
  // card sizing accounts for the actual horizontal paint area. See Row.tsx.
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

  const slotW =
    width > 0
      ? Math.max(120, (width - leftInset - CHEVRON_WIDTH - (perView - 1) * gap) / perView)
      : 0;
  const pageDistance = perView * (slotW + gap);
  const totalPages = Math.max(1, Math.ceil(cappedCount / perView));
  const maxTranslate = Math.max(
    0,
    leftInset + cappedCount * (slotW + gap) - gap - width + CHEVRON_WIDTH,
  );

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  useEffect(() => {
    if (!isActive) return;
    const targetPage = Math.floor(activeIndex / perView);
    if (targetPage !== page) setPage(targetPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isActive, perView]);

  const desired = page * pageDistance;
  const translate = Math.min(desired, Math.max(0, maxTranslate));

  function nudge(dir: -1 | 1) {
    setPage((p) => Math.max(0, Math.min(totalPages - 1, p + dir)));
  }


  // Slot dimensions: width is locked by the same perView logic as Row.tsx so
  // columns align with the boxart rows. Slot height derives from slot width
  // via aspectRatio (6/5), which yields a portrait poster (height 100% of
  // slot, aspect 2/3) that occupies ~56% of the slot's width — matching the
  // Netflix layout where the numeral takes the left half and the poster
  // takes the right half of each column.
  const childArray: ReactNode[] = Array.isArray(children) ? children : [children];
  const items = Array.from({ length: cappedCount });

  const sizingValue = useMemo(
    () => ({ perView, itemCount: cappedCount }),
    [perView, cappedCount],
  );

  return (
    <RowSizingContext.Provider value={sizingValue}>
    <Box
      sx={{
        position: "relative",
        zIndex: 1,
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
              gap: "6px",
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
          marginInline: {
            xs: `-${tokens.space.md}px`,
            md: `-${tokens.space.lg}px`,
            lg: `-${tokens.space.xl}px`,
          },
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
          }}
        >
          {items.map((_, i) => (
            <Box
              key={i}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                aspectRatio: "6 / 5",
                flexShrink: 0,
                width: slotW > 0 ? `${slotW}px` : "auto",
                // Poster cell carries a small negative marginLeft so it
                // overlaps its own numeral by just a few pixels — keep
                // overflow visible so the digit isn't clipped.
                overflow: "visible",
              }}
            >
              <TopTenNumeral rank={i + 1} />
              <Box
                sx={{
                  position: "relative",
                  height: "100%",
                  aspectRatio: "2 / 3",
                  flexShrink: 0,
                  marginLeft: { xs: "-4px", sm: "-5px", md: "-6px", lg: "-7px", xl: "-8px" },
                  // Intentionally no zIndex here. The poster already paints
                  // over the numeral via document order, and a z-index on
                  // this wrapper would create a stacking context that traps
                  // the Tile's hover-bloom (zIndex 30) inside this slot —
                  // letting the next slot paint above the first card's
                  // expanded partial.
                }}
              >
                {childArray[i]}
              </Box>
            </Box>
          ))}
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
        // Hit-area stays at the full slab; the glyph inside scales on hover so
        // the affordance feels active without the target growing.
        "& .MuiSvgIcon-root": {
          transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        },
        "&:hover .MuiSvgIcon-root": { transform: "scale(1.4)" },
        borderRadius: 0,
        zIndex: 40,
        backgroundColor: "rgba(20,20,20,0.5)",
        color: tokens.color.textPrimary,
        opacity: 0,
        transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, background-color 150ms`,
        "&:hover": { backgroundColor: "rgba(20,20,20,0.8)" },
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

/**
 * Giant outlined numeral — heavy display face with a thin off-white stroke
 * and a dark fill that matches the page background.
 *
 * The digit is vertically centered in its cell and flush-right against the
 * poster's leading edge; the poster then carries a small negative marginLeft
 * so it overlaps the digit by just a few pixels — the signature Top 10
 * overlap. Two-digit "10" is sized slightly smaller so its width footprint
 * roughly matches the single-digit cells.
 */
function TopTenNumeral({ rank }: { rank: number }) {
  const twoDigit = rank >= 10;
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        overflow: "visible",
      }}
    >
      <Box
        component="span"
        sx={{
          fontFamily: `'Bebas Neue', 'Oswald', 'Inter Variable', sans-serif`,
          fontWeight: 900,
          fontSize: twoDigit
            ? { xs: 105, sm: 140, md: 170, lg: 185, xl: 200 }
            : { xs: 130, sm: 175, md: 210, lg: 225, xl: 245 },
          lineHeight: 0.78,
          letterSpacing: "-0.06em",
          color: tokens.color.base,
          WebkitTextStroke: `2px ${tokens.color.textSecondary}`,
          userSelect: "none",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        {rank}
      </Box>
    </Box>
  );
}
