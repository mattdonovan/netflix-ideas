import { Box, Typography } from "@mui/material";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { tokens } from "@/theme/tokens";
import { useFocusContext, useSection } from "@/lib/focus";

/**
 * Top 10 row — Figma 106-9360.
 *
 * The defining Netflix idiom: a giant outlined numeral sits behind each
 * portrait card. The card is offset to the right of its number so the digit
 * is fully visible on the left side of each "slot."
 *
 * Children should be portrait-aspect tiles (Tile aspect="poster"). The
 * numeral is rendered by this component, not by the tile — so the tile stays
 * generic and reusable.
 */
export function TopTenRow({
  sectionId,
  title,
  titleSlot,
  itemCount,
  itemsPerView,
  gap = tokens.grouping.cardGap,
  children,
}: {
  sectionId: string;
  title?: string;
  titleSlot?: ReactNode;
  itemCount: number;
  itemsPerView?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  children: ReactNode;
}) {
  const cappedCount = Math.min(itemCount, 10);
  const { activeIndex, isActive, focusItem } = useSection(sectionId, cappedCount);
  const ctx = useFocusContext();
  const reelRef = useRef<HTMLDivElement | null>(null);
  const [chevrons, setChevrons] = useState({ left: false, right: false });

  const perView = {
    xs: itemsPerView?.xs ?? 1.4,
    sm: itemsPerView?.sm ?? 2.2,
    md: itemsPerView?.md ?? 3.2,
    lg: itemsPerView?.lg ?? 4.2,
    xl: itemsPerView?.xl ?? 5.2,
  };

  // The slot's height is locked so the numeral and the poster end up the
  // exact same height by construction. The poster cell inside the slot is
  // height: 100% with aspectRatio 2/3 (so its width auto-derives), and the
  // numeral's fontSize is tied to this height so the digit visually fills it.
  const slotHeight = { xs: 130, sm: 170, md: 210, lg: 240, xl: 270 };

  useEffect(() => {
    if (!isActive) return;
    const reel = reelRef.current;
    if (!reel) return;
    const child = reel.children[activeIndex] as HTMLElement | undefined;
    if (!child) return;
    // Scroll only the reel horizontally — don't let scrollIntoView bubble
    // to the page and yank the hero off-screen on mount.
    const target = child.offsetLeft + child.offsetWidth / 2 - reel.clientWidth / 2;
    reel.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeIndex, isActive]);

  useEffect(() => {
    const reel = reelRef.current;
    if (!reel) return;
    function update() {
      if (!reel) return;
      const atStart = reel.scrollLeft <= 4;
      const atEnd = reel.scrollLeft + reel.clientWidth >= reel.scrollWidth - 4;
      setChevrons({ left: !atStart, right: !atEnd });
    }
    update();
    reel.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(reel);
    return () => {
      reel.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  function nudge(direction: -1 | 1) {
    ctx.setInputMode("keyboard");
    const next = Math.max(0, Math.min(cappedCount - 1, activeIndex + direction));
    focusItem(next);
  }

  // We only render the first 10 children — this is a Top 10 row by definition.
  const items = Array.from({ length: Math.min(itemCount, 10) });
  const childArray: ReactNode[] = Array.isArray(children) ? children : [children];

  return (
    <Box>
      <Box
        sx={{
          mb: `${tokens.space.sm}px`,
          display: "flex",
          alignItems: "center",
          gap: `${tokens.space.sm}px`,
          opacity: isActive ? 1 : 0.85,
          transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        }}
      >
        {title && (
          <Typography
            sx={{
              fontSize: { xs: 18, md: 22, lg: 26 },
              lineHeight: 1.2,
              fontWeight: tokens.type.weight.semibold,
              color: tokens.color.textPrimary,
              letterSpacing: "-0.005em",
            }}
          >
            {title}
          </Typography>
        )}
        {titleSlot}
      </Box>
      <Box sx={{ position: "relative", "&:hover .row-chevron": { opacity: 1 } }}>
        {chevrons.left && (
          <IconButton
            data-row-nav
            className="row-chevron"
            aria-label="Scroll left"
            onClick={() => nudge(-1)}
            sx={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 3,
              backgroundColor: "rgba(20,20,20,0.7)",
              color: tokens.color.textPrimary,
              width: 40,
              height: 64,
              borderRadius: 0,
              opacity: 0,
              transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
              "&:hover": { backgroundColor: "rgba(20,20,20,0.9)" },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 32 }} />
          </IconButton>
        )}
        {chevrons.right && (
          <IconButton
            data-row-nav
            className="row-chevron"
            aria-label="Scroll right"
            onClick={() => nudge(1)}
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 3,
              backgroundColor: "rgba(20,20,20,0.7)",
              color: tokens.color.textPrimary,
              width: 40,
              height: 64,
              borderRadius: 0,
              opacity: 0,
              transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
              "&:hover": { backgroundColor: "rgba(20,20,20,0.9)" },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 32 }} />
          </IconButton>
        )}
        <Box
          ref={reelRef}
          sx={{
            display: "flex",
            gap: `${gap}px`,
            overflowX: "auto",
            overflowY: "visible",
            scrollSnapType: "x mandatory",
            scrollPaddingInline: `${gap}px`,
            paddingBlock: `${tokens.grouping.rowReelPadding}px`,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            "& > .top-ten-slot": {
              scrollSnapAlign: "start",
              flexShrink: 0,
              width: {
                xs: `calc((100% - ${(perView.xs - 1) * gap}px) / ${perView.xs})`,
                sm: `calc((100% - ${(perView.sm - 1) * gap}px) / ${perView.sm})`,
                md: `calc((100% - ${(perView.md - 1) * gap}px) / ${perView.md})`,
                lg: `calc((100% - ${(perView.lg - 1) * gap}px) / ${perView.lg})`,
                xl: `calc((100% - ${(perView.xl - 1) * gap}px) / ${perView.xl})`,
              },
            },
          }}
        >
          {items.map((_, i) => (
            <Box
              key={i}
              className="top-ten-slot"
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                height: slotHeight,
                // Numeral overflow can spill beyond the slot left edge — keep
                // it visible so the digit reads as a giant outline behind
                // the poster.
                overflow: "visible",
              }}
            >
              <TopTenNumeral rank={i + 1} />
              {/* Poster wrapper: locks to slot height with 2:3 portrait
                  aspect, so width auto-derives. Do NOT set z-index here —
                  it would create a stacking context and trap the tile's
                  expanded card-pop inside it. */}
              <Box
                sx={{
                  position: "relative",
                  height: "100%",
                  aspectRatio: "2 / 3",
                  flexShrink: 0,
                }}
              >
                {childArray[i]}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Giant outlined numeral — Netflix uses a heavy slab serif with a thin white
 * stroke and a dark fill that matches the page background.
 *
 * Sized so its visible glyph height matches the slot height (the poster
 * lives next to it at the same height). The numeral overflows its column
 * leftward, sitting behind the previous poster's right side — that overlap
 * is the signature Top 10 look. The number "10" is narrower to keep two
 * digits roughly within the same visual footprint.
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
        alignItems: "flex-end",
        // Right-anchor: the digit sits against the poster's left edge.
        justifyContent: "flex-end",
        overflow: "visible",
      }}
    >
      <Box
        component="span"
        sx={{
          fontFamily: `'Bebas Neue', 'Oswald', 'Inter Variable', sans-serif`,
          fontWeight: 900,
          // Tied to slotHeight (xs:130 sm:170 md:210 lg:240 xl:270) divided by
          // Bebas Neue's cap-height ratio (~0.72) so the rendered glyph fills
          // the slot height. "10" uses ~88% of that to keep two digits readable.
          fontSize: twoDigit
            ? { xs: 160, sm: 210, md: 255, lg: 295, xl: 330 }
            : { xs: 180, sm: 240, md: 290, lg: 335, xl: 375 },
          lineHeight: 0.78,
          letterSpacing: "-0.06em",
          color: tokens.color.base,
          // The Figma's signature look: black fill, thin off-white stroke.
          WebkitTextStroke: `2px ${tokens.color.textSecondary}`,
          // Bleed the digit slightly below the slot baseline so it visually
          // settles flush with the poster bottom.
          transform: "translateY(8%)",
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
