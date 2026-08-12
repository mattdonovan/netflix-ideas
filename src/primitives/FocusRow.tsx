import { Box, Typography, IconButton } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ClosedCaptionIcon from "@mui/icons-material/ClosedCaption";
import { tokens } from "@/theme/tokens";
import { TvCard, type ReasonBadgeSpec } from "./TvCard";

/**
 * Focus-committed carousel — the structural idea behind the 2025 Netflix TV
 * redesign, ported to the browser.
 *
 * Web Netflix answers "what is this?" with an overlay: hovering a card pops a
 * larger card on top of its neighbors, carrying metadata with it. That overlay
 * occludes the row, tracks the pointer, and vanishes the moment you leave.
 * TV Netflix answers the same question by re-flowing the row instead: one card
 * is focused and renders large and landscape, the rest collapse to portrait
 * posters at the same height, and the metadata lands in fixed real estate
 * *below* the reel where it can't cover anything.
 *
 * Focus never moves on hover. A D-pad press, an Apple TV swipe, and a Roku
 * arrow are all deliberate discrete inputs; a pointer sweeping across a row is
 * not, and treating it as one makes the layout lurch under a cursor that was
 * only passing through. The pointer equivalent of pressing right is a click,
 * so that is the only thing that moves focus: click a card to focus it, click
 * the focused card to open it — the same select-then-OK rhythm the remote has.
 * Arrow keys and the edge chevrons step one card at a time for the people who
 * want the literal D-pad.
 *
 * Hover still has a job, just not that one: it lights the card you are about
 * to commit to, so the click has a target.
 *
 * Geometry: the focused card is pinned at the row's left inset and the reel
 * slides underneath it, exactly as on TV. Card heights are shared, so the
 * focused card's 16:9 and the collapsed 2:3 posters line up on both edges.
 */

export type FocusRowItem = {
  key: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  logoUrl?: string;
  color?: string;
  badges?: ReasonBadgeSpec[];
  /** Metadata line under the reel: e.g. "Thriller · 2025 · Limited Series". */
  metaParts?: string[];
  rating?: string;
  hasCaptions?: boolean;
  synopsis?: string;
  actionLabel?: string;
  /** Interactive controls for the focused card; takes the place of actionLabel. */
  actions?: ReactNode;
  /** Persistent top-right overlay, shown whether or not the card is focused. */
  topRight?: ReactNode;
  progress?: number;
  /** Custom artwork layer — used by non-title cards such as the Control card. */
  artwork?: ReactNode;
  onOpen?: () => void;
};

const GAP = 12;

/**
 * Share of the reel width the focused card occupies. Narrow viewports give it
 * proportionally more so the landscape card stays legible; at TV width the
 * article's "about four items on screen" falls out of 0.46.
 */
function focusedFraction(width: number): number {
  if (width < 600) return 0.76;
  if (width < 900) return 0.62;
  if (width < 1200) return 0.54;
  return 0.46;
}

/** Mirrors TvFrame's paddingInline so the focused card aligns with row titles. */
function pickInset(width: number): number {
  if (width >= 1200) return tokens.space.xl;
  if (width >= 900) return tokens.space.lg;
  return tokens.space.md;
}

export function FocusRow({
  title,
  leadingIcon,
  hoverHint,
  onTitleClick,
  items,
  ranked = false,
  loading = false,
  loadingCount = 8,
}: {
  title?: ReactNode;
  leadingIcon?: ReactNode;
  hoverHint?: ReactNode;
  onTitleClick?: () => void;
  items: FocusRowItem[];
  /** Draws the outlined Top 10 numerals behind each card. */
  ranked?: boolean;
  loading?: boolean;
  loadingCount?: number;
}) {
  const reelRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [focused, setFocused] = useState(0);

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

  // Re-tuning a row swaps its contents out from under the focus index.
  const count = loading ? loadingCount : items.length;
  useEffect(() => {
    setFocused((f) => (f > count - 1 ? 0 : f));
  }, [count]);

  const leftInset = pickInset(width);
  const reelW = Math.max(0, width - leftInset);
  const focusedW = reelW > 0 ? Math.round(reelW * focusedFraction(width)) : 0;
  const rowH = Math.round((focusedW * 9) / 16);
  const collapsedW = Math.round((rowH * 2) / 3);
  // Badge/logo/action sizing tracks the card so a phone doesn't get TV-sized
  // chrome on a 280px card.
  const scale = focusedW > 0 ? Math.max(0.62, Math.min(1, focusedW / 880)) : 1;
  // Ranked rows reserve a gutter to the left of every card for its numeral.
  const rankGutter = ranked ? Math.round(rowH * 0.34) : 0;

  function widthOf(i: number) {
    return (i === focused ? focusedW : collapsedW) + rankGutter;
  }

  let contentW = 0;
  const offsets: number[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push(contentW);
    contentW += widthOf(i) + GAP;
  }
  contentW = Math.max(0, contentW - GAP);

  const maxTranslate = Math.max(0, leftInset + contentW - width);
  const translate = Math.min(offsets[focused] ?? 0, maxTranslate);

  function commit(i: number) {
    setFocused(Math.max(0, Math.min(count - 1, i)));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      commit(focused + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      commit(focused - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      items[focused]?.onOpen?.();
    }
  }

  const current = loading ? undefined : items[focused];

  return (
    <Box
      sx={{
        position: "relative",
        // No z-index games needed any more: nothing escapes the row's
        // footprint, because nothing overlays.
        "&:hover .row-chevron": { opacity: 1 },
        "&:hover .row-title-bar": { opacity: 1 },
      }}
    >
      <RowTitleBar
        title={title}
        leadingIcon={leadingIcon}
        hoverHint={hoverHint}
        onTitleClick={onTitleClick}
        count={count}
        focused={focused}
      />

      <Box
        ref={reelRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={typeof title === "string" ? title : undefined}
        sx={{
          position: "relative",
          marginInline: {
            xs: `-${tokens.space.md}px`,
            md: `-${tokens.space.lg}px`,
            lg: `-${tokens.space.xl}px`,
          },
          overflow: "hidden",
          outline: "none",
          "&:focus-visible": {
            boxShadow: `inset 0 0 0 2px ${tokens.color.focusRing}`,
            borderRadius: `${tokens.radius.md}px`,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: `${GAP}px`,
            paddingLeft: `${leftInset}px`,
            paddingBlock: "10px",
            transform: `translate3d(${-translate}px, 0, 0)`,
            transition: `transform 320ms ${tokens.motion.easing.focus}`,
            willChange: "transform",
          }}
        >
          {Array.from({ length: count }, (_, i) => {
            const item = loading ? undefined : items[i];
            const isFocused = i === focused;
            return (
              <Box
                key={item?.key ?? `slot-${i}`}
                sx={{
                  position: "relative",
                  flexShrink: 0,
                  width: `${widthOf(i)}px`,
                  height: `${rowH}px`,
                  paddingLeft: rankGutter ? `${rankGutter}px` : 0,
                  transition: `width 320ms ${tokens.motion.easing.focus}`,
                }}
              >
                {ranked && <RankNumeral rank={i + 1} gutter={rankGutter} height={rowH} />}
                <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                  {loading || !item ? (
                    <SkeletonCard />
                  ) : (
                    <TvCard
                      variant={isFocused ? "focused" : "collapsed"}
                      title={item.title}
                      backdropUrl={item.backdropUrl}
                      posterUrl={item.posterUrl}
                      logoUrl={item.logoUrl}
                      color={item.color}
                      artwork={item.artwork}
                      badges={item.badges}
                      actionLabel={isFocused ? item.actionLabel : undefined}
                      actions={isFocused ? item.actions : undefined}
                      topRight={item.topRight}
                      progress={item.progress}
                      scale={scale}
                      onClick={() => {
                        if (isFocused) item.onOpen?.();
                        else commit(i);
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {focused > 0 && <StepButton side="left" onClick={() => commit(focused - 1)} />}
        {focused < count - 1 && <StepButton side="right" onClick={() => commit(focused + 1)} />}
      </Box>

      <RowMeta item={current} loading={loading} />
    </Box>
  );
}

/**
 * Metadata for the focused item, in fixed real estate below the reel. Height
 * is reserved for the worst case so promoting a different card never shifts
 * the rows underneath — the whole point of moving this out of a popover.
 */
function RowMeta({ item, loading }: { item?: FocusRowItem; loading?: boolean }) {
  return (
    <Box
      sx={{
        minHeight: { xs: 58, md: 76 },
        paddingTop: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      {loading ? (
        <>
          <SkeletonBar width="220px" height={13} />
          <SkeletonBar width="min(560px, 70%)" height={12} />
        </>
      ) : (
        item && (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                fontSize: { xs: 12, md: 14 },
                color: tokens.color.textPrimary,
                fontWeight: tokens.type.weight.semibold,
              }}
            >
              {(item.metaParts ?? []).map((part, i) => (
                <Box key={part + i} sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {i > 0 && <Box component="span" sx={{ color: tokens.color.textTertiary }}>·</Box>}
                  <Box component="span">{part}</Box>
                </Box>
              ))}
              {item.rating && (
                <>
                  <Box component="span" sx={{ color: tokens.color.textTertiary }}>·</Box>
                  <Box
                    component="span"
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      minWidth: 20,
                      height: 20,
                      paddingInline: "4px",
                      borderRadius: "50%",
                      border: `1px solid ${tokens.color.textSecondary}`,
                      fontSize: 10,
                      fontWeight: tokens.type.weight.bold,
                      color: tokens.color.textSecondary,
                    }}
                  >
                    {item.rating}
                  </Box>
                </>
              )}
              {item.hasCaptions && (
                <ClosedCaptionIcon sx={{ fontSize: 18, color: tokens.color.textSecondary }} />
              )}
            </Box>

            {item.synopsis && (
              <Typography
                sx={{
                  fontSize: { xs: 12, md: 15 },
                  lineHeight: 1.45,
                  color: tokens.color.textPrimary,
                  maxWidth: "78ch",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.synopsis}
              </Typography>
            )}
          </>
        )
      )}
    </Box>
  );
}

/**
 * Row title bar. Same channel-glyph + label + hover-hint trigger as the web
 * rows (clicking it opens the tuning prompt), with the page dashes replaced by
 * one dash per item so the row reports where focus sits.
 */
function RowTitleBar({
  title,
  leadingIcon,
  hoverHint,
  onTitleClick,
  count,
  focused,
}: {
  title?: ReactNode;
  leadingIcon?: ReactNode;
  hoverHint?: ReactNode;
  onTitleClick?: () => void;
  count: number;
  focused: number;
}) {
  if (!leadingIcon && !title && !hoverHint) return null;
  return (
    <Box
      className="row-title-bar"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${tokens.space.sm}px`,
        opacity: 0.85,
        transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
      }}
    >
      <Box
        component={onTitleClick ? "button" : "div"}
        type={onTitleClick ? "button" : undefined}
        onClick={onTitleClick}
        className="row-title-trigger"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "16px",
          marginLeft: "-22px",
          marginRight: "-16px",
          marginBlock: "-16px",
          background: "transparent",
          border: 0,
          font: "inherit",
          textAlign: "left",
          color: "inherit",
          cursor: onTitleClick ? "pointer" : "default",
          // Individual animation-* properties (NOT the shorthand) so the
          // per-path animation-delay inside ChannelBarsIcon survives.
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
              fontSize: { xs: 17, md: 20, lg: 22 },
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
      <Box sx={{ flex: 1 }} />
      {/* One dash per card, active dash = focus. Dropped on phones, where the
          dashes would squeeze the title into two lines. */}
      <Box sx={{ display: { xs: "none", sm: "flex" }, gap: "2px", alignItems: "center", flexShrink: 0 }}>
        {Array.from({ length: count }, (_, i) => (
          <Box
            key={i}
            sx={{
              width: 12,
              height: 2,
              backgroundColor:
                i === focused ? tokens.color.textSecondary : "rgba(245,245,245,0.18)",
              transition: `background-color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

/**
 * Step affordance. TV has no chevrons — the D-pad is the chevron — but a
 * mouse needs a visible way to move focus one card at a time without relying
 * on dwell.
 */
function StepButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <IconButton
      className="row-chevron"
      aria-label={side === "left" ? "Focus previous" : "Focus next"}
      onClick={onClick}
      sx={{
        position: "absolute",
        [side]: 0,
        top: 0,
        bottom: 0,
        height: "auto",
        width: 48,
        borderRadius: 0,
        zIndex: 5,
        backgroundColor: "rgba(10,10,10,0.45)",
        color: tokens.color.textPrimary,
        opacity: 0,
        transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, background-color 150ms`,
        "& .MuiSvgIcon-root": {
          transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        },
        "&:hover": { backgroundColor: "rgba(10,10,10,0.75)" },
        "&:hover .MuiSvgIcon-root": { transform: "scale(1.35)" },
      }}
    >
      {side === "left" ? (
        <ChevronLeftIcon sx={{ fontSize: 32 }} />
      ) : (
        <ChevronRightIcon sx={{ fontSize: 32 }} />
      )}
    </IconButton>
  );
}

/**
 * Outlined Top 10 numeral, drawn in the gutter reserved to the left of each
 * card. The card overlaps its own numeral by a few pixels — the signature
 * Netflix overlap — and the first numeral is allowed to clip at the viewport
 * edge, exactly as it does on the TV.
 */
function RankNumeral({ rank, gutter, height }: { rank: number; gutter: number; height: number }) {
  const twoDigit = rank >= 10;
  return (
    <Box
      sx={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: gutter + 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <Box
        component="span"
        sx={{
          fontFamily: `'Bebas Neue', 'Oswald', 'Inter Variable', sans-serif`,
          fontWeight: 900,
          fontSize: `${Math.round(height * (twoDigit ? 0.46 : 0.58))}px`,
          lineHeight: 0.78,
          letterSpacing: "-0.06em",
          color: tokens.color.base,
          WebkitTextStroke: `2px ${tokens.color.textSecondary}`,
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {rank}
      </Box>
    </Box>
  );
}

function SkeletonCard() {
  return (
    <Box
      aria-hidden
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: `${tokens.radius.md}px`,
        backgroundColor: tokens.color.surfaceMid,
        position: "relative",
        overflow: "hidden",
        "@keyframes focusRowShimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
          animation: "focusRowShimmer 1.2s linear infinite",
        },
      }}
    />
  );
}

function SkeletonBar({ width, height }: { width: string; height: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width,
        height,
        borderRadius: "2px",
        backgroundColor: "rgba(255,255,255,0.12)",
        "@keyframes focusRowPulse": { "0%,100%": { opacity: 0.45 }, "50%": { opacity: 0.9 } },
        animation: "focusRowPulse 1.4s ease-in-out infinite",
      }}
    />
  );
}
