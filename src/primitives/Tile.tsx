import { Box, Typography } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { tokens } from "@/theme/tokens";
import { useFocusContext } from "@/lib/focus";

const HOVER_SCALE = 1.32;
const HOVER_DURATION = 220;

export type TileSize = "sm" | "md" | "lg";
export type TileAspect = "boxart" | "poster";

const TILE_DIMENSIONS: Record<TileAspect, Record<TileSize, { width: number; height: number }>> = {
  boxart: {
    sm: { width: 280, height: 158 },
    md: { width: 340, height: 192 },
    lg: { width: 420, height: 236 },
  },
  poster: {
    sm: { width: 180, height: 270 },
    md: { width: 220, height: 330 },
    lg: { width: 260, height: 390 },
  },
};

/**
 * Badge pairing. `red` is the primary tag (Recently Added / New Season /
 * New Episode); `white` is the optional companion (Watch Now). They sit
 * centered together at the bottom edge of the image with no gap between
 * them — matches the actual Netflix homepage motif.
 */
export type TileBadge = {
  red?: string;
  white?: string;
  black?: string;
};

export type TileExpansion = {
  isNew?: boolean;
  rating?: string;
  duration?: string;
  format?: string;
  moodTags?: string[];
  /** Free-text blurb shown in the hover panel — used by non-title cards (e.g.
   *  the Take Control card) that describe themselves rather than carry metadata. */
  description?: string;
};

/**
 * Content tile.
 *
 * Behavior model:
 *   - The resting card sits in the slot at scale 1 and never moves or scales.
 *   - On hover/focus a separate "hover partial" mounts on top — the full
 *     expanded card view (backdrop image + info panel). It appears immediately
 *     at opacity 1, scale 1 (so it visually replaces the resting card with no
 *     fade), then scales up to 1.32. The resting card stays underneath but
 *     gets covered by the partial.
 *   - On unhover, the partial scales back down AND fades opacity to 0 in
 *     parallel, then unmounts. This is what makes the transition feel like
 *     the card is "growing" without the resting card itself ever moving.
 *   - Keyboard focus pops the partial AND draws a ring around it. The ring
 *     only appears when the last input was a keystroke (keyboard mode).
 */
export function Tile({
  size = "md",
  aspect = "boxart",
  title,
  color,
  artwork,
  artworkUrl,
  expandedArtworkUrl,
  logoUrl,
  expandsToLandscape = false,
  badge,
  expansion,
  focused,
  onClick,
  responsive = false,
  fillHeight = false,
  edgeAnchor,
}: {
  size?: TileSize;
  aspect?: TileAspect;
  title?: string;
  color?: string;
  artwork?: ReactNode;
  artworkUrl?: string;
  expandedArtworkUrl?: string;
  /**
   * Title-treatment logo (transparent PNG) overlaid on landscape artwork — the
   * Netflix "titled card" look. Clean backdrops carry no text, so without this
   * a boxart tile is unlabeled. Only honored for `aspect: "boxart"`; portrait
   * posters already bake the title into the art.
   */
  logoUrl?: string;
  expandsToLandscape?: boolean;
  badge?: TileBadge;
  expansion?: TileExpansion;
  focused: boolean;
  onClick?: () => void;
  responsive?: boolean;
  fillHeight?: boolean;
  /**
   * Anchor the hover-bloom to one side of the tile instead of scaling from
   * center. Used for the first card in a row ("left", grows up/down/right)
   * and the last card ("right", grows up/down/left) so the bloom never
   * extends past the row's viewport edge.
   */
  edgeAnchor?: "left" | "right";
}) {
  const dims = TILE_DIMENSIONS[aspect][size];
  const hasImage = !artwork && Boolean(artworkUrl || expandedArtworkUrl);
  const ctx = useFocusContext();
  const inputMode = ctx.state.inputMode;

  const [hovered, setHovered] = useState(false);
  const expanded = hovered || focused;
  const showRing = focused && inputMode === "keyboard";

  // Hover-overlay lifecycle. `mounted` controls whether the partial is in the
  // DOM at all; `phase` controls its visual state:
  //   - "idle" (just-mounted): scale 1, opacity 1, transition: none — the
  //     first paint lands here so the partial visually replaces the resting
  //     card without any fade.
  //   - "growing": scale 1.32, opacity 1, transition: transform only — opacity
  //     was already 1 so it doesn't move; only the scale animates.
  //   - "shrinking" (unhover): scale 1, opacity 0, transition: both — scale and
  //     opacity animate together; partial unmounts when the timer fires.
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [phase, setPhase] = useState<"idle" | "growing" | "shrinking">("idle");

  useEffect(() => {
    if (expanded) {
      setOverlayMounted(true);
      setPhase("idle");
      // Two rAFs: paint the idle state first, then flip to growing so the
      // browser sees a real value change with a transition rule that includes
      // transform — that's what triggers the scale animation.
      let id1 = 0;
      let id2 = 0;
      id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setPhase("growing"));
      });
      return () => {
        cancelAnimationFrame(id1);
        cancelAnimationFrame(id2);
      };
    } else {
      if (!overlayMounted) return;
      setPhase("shrinking");
      const t = setTimeout(() => {
        setOverlayMounted(false);
        setPhase("idle");
      }, HOVER_DURATION + 40);
      return () => clearTimeout(t);
    }
    // overlayMounted intentionally omitted: we only react to expanded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const restAspect = aspect === "boxart" ? "16 / 9" : "2 / 3";
  // Landscape (boxart) artwork carries no baked-in title, so overlay the logo
  // (or a text fallback) on it. Portrait posters bake their own title — leave
  // them be.
  const titleArtOnImage = aspect === "boxart";
  const isLandscapeExpansion = !!expandsToLandscape;
  // The hover partial is always landscape backdrop art — boxart's own artwork,
  // or a poster row's expandedArtworkUrl. So it carries the title overlay even
  // when the resting portrait poster (baked-in title) deliberately doesn't.
  const expandedTitleArt = titleArtOnImage || isLandscapeExpansion;
  // The hover partial enters at its final landscape shape immediately (no
  // morph). Aspect-ratio doesn't animate — only opacity (snap on in, fade on
  // out) and scale do.
  const overlayAspect = isLandscapeExpansion ? "16 / 9" : restAspect;
  const overlayArtworkUrl =
    isLandscapeExpansion && expandedArtworkUrl ? expandedArtworkUrl : artworkUrl;

  const easing = tokens.motion.easing.focus;
  const overlayTransition =
    phase === "growing"
      ? `transform ${HOVER_DURATION}ms ${easing}`
      : phase === "shrinking"
        ? `transform ${HOVER_DURATION}ms ${easing}, opacity ${HOVER_DURATION}ms ${easing}`
        : "none";
  const baseScale = phase === "growing" ? `scale(${HOVER_SCALE})` : "scale(1)";
  // Landscape (Top 10) overlay defaults to anchoring via `left: 50%` + a
  // pre-multiplied `translateX(-50%)` to center horizontally. When an
  // edgeAnchor is set, the overlay instead pins to that side directly so
  // the bloom grows inward toward the row's center.
  const overlayTransform = isLandscapeExpansion && !edgeAnchor
    ? `translate3d(-50%, 0, 0) ${baseScale}`
    : baseScale;
  const overlayOpacity = phase === "shrinking" ? 0 : 1;
  // Bloom origin. Edge cards in a row grow inward — no leftward bleed past
  // the row's left chevron / viewport edge for the leading card, no rightward
  // bleed past the right edge for the trailing card.
  const overlayOrigin =
    edgeAnchor === "left"
      ? "left center"
      : edgeAnchor === "right"
        ? "right center"
        : "center center";

  return (
    <Box
      data-focusable-tile
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        ...(fillHeight
          ? { width: "100%", height: "100%" }
          : responsive
            ? { aspectRatio: restAspect }
            : { width: dims.width, aspectRatio: restAspect, minHeight: dims.height }),
        flexShrink: 0,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {/* Resting card. Always rendered; never scales. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          borderRadius: `${tokens.radius.sm}px`,
          overflow: "hidden",
        }}
      >
        <CardImageArea
          aspect={restAspect}
          artwork={artwork}
          artworkUrl={artworkUrl}
          hasImage={hasImage}
          color={color}
          title={title}
          logoUrl={logoUrl}
          allowImageTitleArt={titleArtOnImage}
          badge={badge}
          showMute={false}
        />
      </Box>

      {/* Hover partial. Mounts when expanded, scales/opacity per `phase`. */}
      {overlayMounted && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            zIndex: 30,
            opacity: overlayOpacity,
            transform: overlayTransform,
            transformOrigin: overlayOrigin,
            transition: overlayTransition,
            willChange: "transform, opacity",
            display: "flex",
            flexDirection: "column",
            borderRadius: `${tokens.radius.sm}px`,
            boxShadow: showRing
              ? `0 0 0 2px rgba(245,245,245,0.95), 0 0 0 8px rgba(245,245,245,0.12), 0 22px 48px rgba(0,0,0,0.6)`
              : `0 22px 48px rgba(0,0,0,0.6)`,
            overflow: "visible",
            // Landscape expansion (Top 10): break out of the portrait poster's
            // width. The overlay is sized to ~180% of the poster wrapper's
            // width — the poster occupies ~55.6% of its slot (slot is 6:5,
            // poster inside is 2:3 at full slot height), so 180% of poster
            // width ≈ the full slot width, which equals the boxart card
            // width in adjacent rows. Image area inside fills this width at
            // 16:9, yielding a partial that matches the landscape card
            // partials used by Row.tsx.
            ...(isLandscapeExpansion
              ? {
                  width: "180%",
                  ...(edgeAnchor === "left"
                    ? { left: 0 }
                    : edgeAnchor === "right"
                      ? { right: 0 }
                      : { left: "50%" }),
                }
              : { left: 0, right: 0 }),
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: isLandscapeExpansion ? "16 / 9" : overlayAspect,
              borderTopLeftRadius: `${tokens.radius.sm}px`,
              borderTopRightRadius: `${tokens.radius.sm}px`,
              background: hasImage
                ? `${color ?? tokens.color.surfaceLow} center/cover no-repeat url("${overlayArtworkUrl}")`
                : color ?? `linear-gradient(155deg, ${tokens.color.surfaceMid}, ${tokens.color.surfaceLow})`,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {artwork}

            {hasImage && (
              <Box
                sx={{
                  position: "absolute",
                  top: tokens.space.sm,
                  right: tokens.space.sm,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: `1px solid rgba(245,245,245,0.7)`,
                  display: "grid",
                  placeItems: "center",
                  color: tokens.color.textPrimary,
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
                }}
              >
                <VolumeOffIcon sx={{ fontSize: 14 }} />
              </Box>
            )}

            {hasImage && expandedTitleArt ? (
              <TileTitleArt logoUrl={logoUrl} title={title} badge={badge} />
            ) : (
              !hasImage && title && <TileTitleArt title={title} badge={badge} />
            )}

            {badge && (badge.red || badge.white || badge.black) && (
              <Box
                sx={{
                  position: "absolute",
                  left: "50%",
                  bottom: 0,
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "stretch",
                  pointerEvents: "none",
                }}
              >
                {badge.red && <BadgePill text={badge.red} variant="red" />}
                {badge.white && <BadgePill text={badge.white} variant="white" />}
                {badge.black && <BadgePill text={badge.black} variant="black" />}
              </Box>
            )}
          </Box>

          {expansion && <TileInfoPanel expansion={expansion} />}
        </Box>
      )}
    </Box>
  );
}

/**
 * The resting card's image surface. Reused as the partial's image surface
 * too, except the partial overrides the aspect/artwork choice for the
 * expanded view.
 */
function CardImageArea({
  aspect,
  artwork,
  artworkUrl,
  hasImage,
  color,
  title,
  logoUrl,
  allowImageTitleArt,
  badge,
  showMute,
}: {
  aspect: string;
  artwork?: ReactNode;
  artworkUrl?: string;
  hasImage: boolean;
  color?: string;
  title?: string;
  logoUrl?: string;
  allowImageTitleArt?: boolean;
  badge?: TileBadge;
  showMute: boolean;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: aspect,
        borderRadius: `${tokens.radius.sm}px`,
        background: hasImage
          ? `${color ?? tokens.color.surfaceLow} center/cover no-repeat url("${artworkUrl}")`
          : color ?? `linear-gradient(155deg, ${tokens.color.surfaceMid}, ${tokens.color.surfaceLow})`,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {artwork}

      {hasImage && allowImageTitleArt ? (
        <TileTitleArt logoUrl={logoUrl} title={title} badge={badge} />
      ) : (
        !hasImage && title && <TileTitleArt title={title} badge={badge} />
      )}

      {showMute && hasImage && (
        <Box
          sx={{
            position: "absolute",
            top: tokens.space.sm,
            right: tokens.space.sm,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: `1px solid rgba(245,245,245,0.7)`,
            display: "grid",
            placeItems: "center",
            color: tokens.color.textPrimary,
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
          }}
        >
          <VolumeOffIcon sx={{ fontSize: 14 }} />
        </Box>
      )}

      {badge && (badge.red || badge.white || badge.black) && (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            bottom: 6,
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "stretch",
            pointerEvents: "none",
          }}
        >
          {badge.red && <BadgePill text={badge.red} variant="red" />}
          {badge.white && <BadgePill text={badge.white} variant="white" />}
          {badge.black && <BadgePill text={badge.black} variant="black" />}
        </Box>
      )}
    </Box>
  );
}

/**
 * Title overlay for landscape artwork: a bottom scrim plus either the
 * title-treatment logo (preferred — matches the baked-in look of portrait
 * posters) or, when no logo exists, a bold text title. Pinned bottom-left like
 * the Netflix homepage. Lifts above the badge row when a badge is present.
 */
function TileTitleArt({
  logoUrl,
  title,
  badge,
}: {
  logoUrl?: string;
  title?: string;
  badge?: TileBadge;
}) {
  if (!logoUrl && !title) return null;
  const bottom = badge ? tokens.space.xl : tokens.space.sm;
  return (
    <>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt={title ?? ""}
          loading="lazy"
          sx={{
            position: "absolute",
            left: tokens.space.sm,
            bottom,
            maxWidth: "58%",
            maxHeight: "40%",
            objectFit: "contain",
            objectPosition: "left bottom",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))",
            pointerEvents: "none",
          }}
        />
      ) : (
        <Typography
          sx={{
            position: "absolute",
            left: tokens.space.sm,
            right: tokens.space.sm,
            bottom,
            fontSize: tokens.type.scale.h4.size,
            fontWeight: tokens.type.weight.bold,
            color: tokens.color.textPrimary,
            lineHeight: 1.05,
            letterSpacing: "-0.005em",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {title}
        </Typography>
      )}
    </>
  );
}

function BadgePill({ text, variant }: { text: string; variant: "red" | "white" | "black" }) {
  const palette = {
    red: { bg: tokens.color.brand, fg: tokens.color.textPrimary },
    white: { bg: tokens.color.textPrimary, fg: tokens.color.textInverse },
    black: { bg: "#0A0A0A", fg: tokens.color.textPrimary },
  } as const;
  const { bg, fg } = palette[variant];
  return (
    <Box
      component="span"
      sx={{
        paddingInline: "8px",
        paddingBlock: "2px",
        backgroundColor: bg,
        color: fg,
        fontSize: 10,
        fontWeight: tokens.type.weight.bold,
        letterSpacing: "0.02em",
        lineHeight: 1.4,
        textTransform: "none",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {text}
    </Box>
  );
}

/**
 * Grey info panel below the image. Houses the control circles, meta line,
 * and mood tags — the same content as before, just now living *inside* the
 * card (continuous with the image above it) rather than dangling beneath.
 */
function TileInfoPanel({ expansion }: { expansion: TileExpansion }) {
  return (
    <Box
      sx={{
        backgroundColor: tokens.color.surfaceMid,
        padding: `${tokens.space.sm}px ${tokens.space.sm}px ${tokens.space.md}px`,
        borderBottomLeftRadius: `${tokens.radius.sm}px`,
        borderBottomRightRadius: `${tokens.radius.sm}px`,
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.space.xs}px`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.xs}px` }}>
        <ControlCircle icon={<PlayArrowIcon sx={{ fontSize: 16 }} />} filled />
        <ControlCircle icon={<AddIcon sx={{ fontSize: 14 }} />} />
        <ControlCircle icon={<ThumbUpOffAltIcon sx={{ fontSize: 13 }} />} />
        <Box sx={{ flex: 1 }} />
        <ControlCircle icon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />} />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexWrap: "wrap",
          fontSize: 11,
          color: tokens.color.textPrimary,
        }}
      >
        {expansion.isNew && (
          <Typography
            component="span"
            sx={{
              color: "#46D369",
              fontWeight: tokens.type.weight.bold,
              fontSize: 11,
            }}
          >
            New
          </Typography>
        )}
        {expansion.rating && <MetaChip>{expansion.rating}</MetaChip>}
        {expansion.duration && (
          <Typography component="span" sx={{ fontSize: 11, color: tokens.color.textPrimary }}>
            {expansion.duration}
          </Typography>
        )}
        {expansion.format && <MetaChip>{expansion.format}</MetaChip>}
      </Box>

      {expansion.description && (
        <Typography sx={{ fontSize: 12, color: tokens.color.textPrimary, lineHeight: 1.45 }}>
          {expansion.description}
        </Typography>
      )}

      {expansion.moodTags && expansion.moodTags.length > 0 && (
        <Typography sx={{ fontSize: 11, color: tokens.color.textPrimary, lineHeight: 1.4 }}>
          {expansion.moodTags.map((tag, i) => (
            <span key={tag}>
              {i > 0 && (
                <span style={{ color: tokens.color.textTertiary, margin: "0 6px" }}>•</span>
              )}
              {tag}
            </span>
          ))}
        </Typography>
      )}
    </Box>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        fontSize: 9,
        fontWeight: tokens.type.weight.semibold,
        color: tokens.color.textSecondary,
        letterSpacing: "0.04em",
        paddingInline: "4px",
        paddingBlock: "1px",
        border: `1px solid ${tokens.color.borderStrong}`,
        borderRadius: "2px",
        lineHeight: 1.3,
      }}
    >
      {children}
    </Box>
  );
}

function ControlCircle({ icon, filled }: { icon: ReactNode; filled?: boolean }) {
  return (
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        backgroundColor: filled ? tokens.color.textPrimary : "transparent",
        border: filled ? "none" : `1.5px solid rgba(245,245,245,0.7)`,
        color: filled ? tokens.color.textInverse : tokens.color.textPrimary,
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      {icon}
    </Box>
  );
}
