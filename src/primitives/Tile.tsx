import { Box, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { tokens } from "@/theme/tokens";
import { useFocusContext } from "@/lib/focus";

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
};

export type TileExpansion = {
  isNew?: boolean;
  rating?: string;
  duration?: string;
  format?: string;
  moodTags?: string[];
};

/**
 * Content tile.
 *
 * Behavior model:
 *   - Slot reserves only the image's footprint in the row's layout.
 *   - The card is absolutely positioned within the slot — when it scales up
 *     and reveals its info panel on hover/focus, neighbors and the row
 *     beneath stay put. Pure overlay, no layout shift.
 *   - Hover is a *visual* preview only: it pops the card and reveals the
 *     panel, but does NOT advance the row's focused index.
 *   - Keyboard focus pops the card AND draws a ring around it. The ring
 *     only appears when the last input was a keystroke (keyboard mode).
 *   - Click on a tile sets focus too, but only via keyboard's setFocus
 *     contract — wired by the caller, not by this component.
 */
export function Tile({
  size = "md",
  aspect = "boxart",
  title,
  color,
  artwork,
  artworkUrl,
  expandedArtworkUrl,
  expandsToLandscape = false,
  badge,
  expansion,
  focused,
  onClick,
  responsive = false,
  fillHeight = false,
}: {
  size?: TileSize;
  aspect?: TileAspect;
  title?: string;
  color?: string;
  artwork?: ReactNode;
  artworkUrl?: string;
  /** Optional alternate artwork shown when the card is expanded (hover/focus).
   *  Used by the Top 10 row, which shows a portrait poster at rest but
   *  morphs into a landscape backdrop on expand. */
  expandedArtworkUrl?: string;
  /** When true, the expanded card switches from `aspect` to 16:9 boxart.
   *  Combined with `expandedArtworkUrl` it lets a Top 10 poster grow into
   *  a landscape preview matching the other rows' layout. */
  expandsToLandscape?: boolean;
  badge?: TileBadge;
  expansion?: TileExpansion;
  focused: boolean;
  onClick?: () => void;
  responsive?: boolean;
  /** When true, the slot's shape is driven by the parent (height: 100%) rather
   *  than aspectRatio. Used by TopTenRow where the slot is height-locked. */
  fillHeight?: boolean;
}) {
  const dims = TILE_DIMENSIONS[aspect][size];
  const hasImage = !artwork && (artworkUrl || expandedArtworkUrl);
  const ctx = useFocusContext();
  const inputMode = ctx.state.inputMode;

  const [hovered, setHovered] = useState(false);
  const expanded = hovered || focused;
  // Focus ring only when keyboard navigation is the active modality —
  // mouse hover gets the card-pop but no ring.
  const showRing = focused && inputMode === "keyboard";

  // Default + expanded aspect. Most tiles use the same for both; Top 10
  // posters morph from 2:3 to 16:9 on expand.
  const restAspect = aspect === "boxart" ? "16 / 9" : "2 / 3";
  const liveAspect = expanded && expandsToLandscape ? "16 / 9" : restAspect;
  const liveArtworkUrl = expanded && expandedArtworkUrl ? expandedArtworkUrl : artworkUrl;

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
        // The card itself is positioned absolutely on top so its expansion
        // + scale doesn't shift sibling tiles or push the next row down.
      }}
    >
      <Box
        sx={{
          // The card fills its slot at rest. When it scales on hover/focus,
          // the transform expands it from center — neighbors stay put.
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: expanded ? 30 : 1,
          transform: expanded ? "scale(1.32)" : "scale(1)",
          // center-center so the card grows in all four directions on hover,
          // not just downward.
          transformOrigin: "center center",
          transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, box-shadow ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
          willChange: "transform",
          display: "flex",
          flexDirection: "column",
          borderRadius: `${tokens.radius.sm}px`,
          // The ring wraps the whole card (image + grey panel) — not the
          // image alone — per the design brief.
          boxShadow: showRing
            ? `0 0 0 2px rgba(245,245,245,0.95), 0 0 0 8px rgba(245,245,245,0.12), 0 22px 48px rgba(0,0,0,0.6)`
            : expanded
              ? `0 22px 48px rgba(0,0,0,0.6)`
              : "none",
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: liveAspect,
            borderRadius: `${tokens.radius.sm}px`,
            // Bottom corners square up when the grey panel is showing, so the
            // image + panel read as one continuous card.
            borderBottomLeftRadius: expanded ? 0 : `${tokens.radius.sm}px`,
            borderBottomRightRadius: expanded ? 0 : `${tokens.radius.sm}px`,
            background: hasImage
              ? `${color ?? tokens.color.surfaceLow} center/cover no-repeat url("${liveArtworkUrl}")`
              : color ?? `linear-gradient(155deg, ${tokens.color.surfaceMid}, ${tokens.color.surfaceLow})`,
            overflow: "hidden",
            flexShrink: 0,
            transition: `aspect-ratio ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
          }}
        >
          {artwork}

          {!hasImage && title && (
            <>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)",
                  pointerEvents: "none",
                }}
              />
              <Typography
                sx={{
                  position: "absolute",
                  left: tokens.space.sm,
                  right: tokens.space.sm,
                  bottom: badge ? tokens.space.xl : tokens.space.sm,
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
            </>
          )}

          {/* Mute affordance — only when expanded (hover/focus). */}
          {expanded && hasImage && (
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

          {/* Bottom-center badge pair. Small red + white pills, no gap. */}
          {badge && (badge.red || badge.white) && (
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
            </Box>
          )}
        </Box>

        {/* Grey info panel — only visible when expanded. Sits below the image
            as part of the card. Image stays full bleed. */}
        {expanded && expansion && (
          <TileInfoPanel expansion={expansion} />
        )}
      </Box>
    </Box>
  );
}

function BadgePill({ text, variant }: { text: string; variant: "red" | "white" }) {
  const red = variant === "red";
  return (
    <Box
      component="span"
      sx={{
        paddingInline: "8px",
        paddingBlock: "2px",
        backgroundColor: red ? tokens.color.brand : tokens.color.textPrimary,
        color: red ? tokens.color.textPrimary : tokens.color.textInverse,
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
        animation: `tile-panel-in ${tokens.motion.duration.entrance}ms ${tokens.motion.easing.entrance}`,
        "@keyframes tile-panel-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
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
