import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import CampaignIcon from "@mui/icons-material/Campaign";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ReplayIcon from "@mui/icons-material/Replay";
import MovieIcon from "@mui/icons-material/Movie";
import TvIcon from "@mui/icons-material/Tv";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { tokens } from "@/theme/tokens";
import { NetflixN } from "./NetflixLogo";

/**
 * Card for the TV-style focus row.
 *
 * The 2025 Netflix TV UI replaced the web's hover-bloom popover with a
 * committed-focus layout: exactly one card per row is focused and renders
 * large and landscape (16:9, title-treatment logo, a primary action, and
 * "reason" badges); every other card collapses to a portrait poster (2:3) at
 * the same height. Nothing overlays anything — the row re-flows instead.
 *
 * Both artworks are mounted at once and cross-faded, so promoting a card to
 * focus never shows an empty frame while the landscape backdrop loads.
 */

export type ReasonBadgeKind =
  | "announce"
  | "recommend"
  | "rewatch"
  | "topTen"
  | "movie"
  | "show"
  | "game";

export type ReasonBadgeSpec = { kind: ReasonBadgeKind; text: string };

const BADGE_ICONS: Record<ReasonBadgeKind, ReactNode> = {
  announce: <CampaignIcon sx={{ fontSize: 15 }} />,
  recommend: <ThumbUpAltIcon sx={{ fontSize: 13 }} />,
  rewatch: <ReplayIcon sx={{ fontSize: 14 }} />,
  topTen: <TopTenMark />,
  movie: <MovieIcon sx={{ fontSize: 13 }} />,
  show: <TvIcon sx={{ fontSize: 13 }} />,
  game: <SportsEsportsIcon sx={{ fontSize: 14 }} />,
};

/**
 * The pink "TOP 10" chit Netflix stamps beside ranking badges. Small enough
 * to sit inline inside a reason pill without the pill growing.
 */
function TopTenMark() {
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        width: 15,
        height: 15,
        borderRadius: "2px",
        backgroundColor: "#E50914",
        color: "#fff",
        fontSize: 6,
        fontWeight: tokens.type.weight.bold,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      <Box component="span" sx={{ display: "block" }}>
        TOP
      </Box>
      <Box component="span" sx={{ display: "block" }}>
        10
      </Box>
    </Box>
  );
}

/**
 * Reason badge — the mechanic worth stealing from the TV redesign. Netflix
 * renders the *justification* for a recommendation as chrome ("Recently
 * added", "Spent 19 weeks in the Top 10"), turning ranking signal into
 * something the member can read.
 */
export function ReasonBadge({ spec, scale = 1 }: { spec: ReasonBadgeSpec; scale?: number }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: `${Math.round(5 * scale)}px`,
        paddingInline: `${Math.round(9 * scale)}px`,
        paddingBlock: `${Math.round(5 * scale)}px`,
        borderRadius: `${tokens.radius.sm}px`,
        backgroundColor: "rgba(10,10,10,0.78)",
        backdropFilter: "blur(4px)",
        color: tokens.color.textPrimary,
        fontSize: Math.max(9, Math.round(12 * scale)),
        fontWeight: tokens.type.weight.semibold,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        "& .MuiSvgIcon-root": { color: "#FF3B72" },
      }}
    >
      {BADGE_ICONS[spec.kind]}
      {spec.text}
    </Box>
  );
}

export type TvCardProps = {
  variant: "focused" | "collapsed";
  title: string;
  /** Landscape art — shown when focused. */
  backdropUrl?: string;
  /** Portrait art — shown when collapsed. Falls back to the backdrop. */
  posterUrl?: string;
  /** Title-treatment logo, overlaid on the focused landscape art. */
  logoUrl?: string;
  /** Fallback background when the entry has no artwork at all. */
  color?: string;
  /** Custom artwork layer (used by the Control card, which isn't a title). */
  artwork?: ReactNode;
  badges?: ReasonBadgeSpec[];
  /** Primary action rendered inside the focused card, bottom-left. */
  actionLabel?: string;
  /**
   * Interactive controls for the focused card, bottom-left. Takes the place of
   * `actionLabel` when both are supplied. Unlike the label, this receives
   * pointer events, so anything in here must stop propagation if it shouldn't
   * also trigger the card's own click.
   */
  actions?: ReactNode;
  /**
   * Persistent top-right overlay — the household face pile. Unlike `actions`
   * it isn't hover-gated: who else is on a title is information you scan a row
   * for, so it has to be there before you point at anything.
   */
  topRight?: ReactNode;
  /** 0–1 watch progress; draws the Continue Watching bar at the card's foot. */
  progress?: number;
  onClick?: () => void;
  /** Scales badge/logo/action sizing down on small viewports. */
  scale?: number;
};

export function TvCard({
  variant,
  title,
  backdropUrl,
  posterUrl,
  logoUrl,
  color,
  artwork,
  badges,
  actionLabel,
  actions,
  topRight,
  progress,
  onClick,
  scale = 1,
}: TvCardProps) {
  const focused = variant === "focused";
  const landscape = backdropUrl ?? posterUrl;
  const portrait = posterUrl ?? backdropUrl;
  const hasArt = Boolean(landscape || portrait || artwork);
  const fallback = color ?? `linear-gradient(155deg, ${tokens.color.surfaceMid}, ${tokens.color.surfaceLow})`;

  return (
    <Box
      data-focusable-tile
      data-focused={focused ? "true" : undefined}
      onClick={onClick}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: `${tokens.radius.md}px`,
        // Deliberately NOT clipped: the Jump fan opens rightward out of the
        // card. Artwork is clipped by its own wrapper below instead, so the
        // rounded corners survive.
        overflow: "visible",
        // Lift the focused card so an escaping fan paints over its neighbours.
        zIndex: focused ? 3 : 1,
        cursor: onClick ? "pointer" : "default",
        background: fallback,
        boxShadow: focused ? `0 18px 44px rgba(0,0,0,0.55)` : "none",
        transition: `box-shadow ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, filter ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        // The ring lives on ::after, not on the root's box-shadow: an inset
        // shadow paints beneath child content, and the artwork <img> covers
        // the card edge to edge. ::after paints last, so the ring survives.
        //
        // It's a pointer signal, not a state one. The focused card already
        // announces itself by being the wide landscape one; ringing it at rest
        // adds a second, louder answer to a question the layout has already
        // answered. The ring is reserved for "a click would land here".
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          boxShadow: "inset 0 0 0 2px rgba(245,245,245,0)",
          transition: `box-shadow ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        },
        // Hover no longer moves focus — clicking does. Hover's only job is to
        // mark the card a click would land on: a dimmer ring on collapsed
        // cards, and on the focused card a lift alone, since clicking that one
        // opens it rather than re-focusing it.
        // Controls are chrome on top of artwork; showing them only while the
        // pointer is on the card keeps the resting row a wall of art, which is
        // what the TV layout is for.
        "&:hover .card-actions, &:focus-within .card-actions": {
          opacity: 1,
          pointerEvents: "auto",
        },
        ...(onClick && {
          "&:hover": { filter: "brightness(1.1)" },
          "&:hover::after, &:focus-within::after": {
            boxShadow: focused
              ? "inset 0 0 0 2px rgba(245,245,245,0.92)"
              : "inset 0 0 0 2px rgba(245,245,245,0.6)",
          },
        }),
      }}
    >
      {/* Everything that must respect the rounded corners lives in here. The
          root is unclipped so overlays (the Jump fan) can leave the card. */}
      <Box sx={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden" }}>
        {/* Portrait layer — visible while collapsed. */}
        {portrait && (
          <Box
            component="img"
            src={portrait}
            alt=""
            loading="lazy"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: focused ? 0 : 1,
              transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
            }}
          />
        )}

        {/* Landscape layer — visible while focused. */}
        {landscape && (
          <Box
            component="img"
            src={landscape}
            alt=""
            loading="lazy"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: focused ? 1 : 0,
              transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
            }}
          />
        )}

        {artwork}

        {/* Bottom scrim — only under the focused card, where text sits. */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)",
            opacity: focused ? 1 : 0,
            transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
            pointerEvents: "none",
          }}
        />

        {/* Netflix N on collapsed posters, mirroring the TV rows. */}
        {!focused && hasArt && (
          <Box
            sx={{
              position: "absolute",
              top: `${Math.round(8 * scale)}px`,
              left: `${Math.round(8 * scale)}px`,
              opacity: 0.95,
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
              pointerEvents: "none",
            }}
          >
            <NetflixN size={Math.max(12, Math.round(20 * scale))} />
          </Box>
        )}
      </Box>

      {topRight && (
        <Box
          sx={{
            position: "absolute",
            top: `${Math.round(10 * scale)}px`,
            right: `${Math.round(10 * scale)}px`,
            // Sized from the card so a phone doesn't get TV-scale avatars.
            transform: `scale(${scale})`,
            transformOrigin: "top right",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.65))",
            pointerEvents: "none",
          }}
        >
          {topRight}
        </Box>
      )}

      {/* Focused card contents: logo bottom-left, action under it, badges right. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: `${Math.round(18 * scale)}px`,
          gap: `${Math.round(12 * scale)}px`,
          opacity: focused ? 1 : 0,
          transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
          pointerEvents: "none",
        }}
      >
        {logoUrl ? (
          <Box
            component="img"
            src={logoUrl}
            alt={title}
            loading="lazy"
            sx={{
              maxWidth: "52%",
              maxHeight: "30%",
              objectFit: "contain",
              objectPosition: "left bottom",
              filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.7))",
              alignSelf: "flex-start",
            }}
          />
        ) : artwork ? (
          // A custom artwork layer carries its own title treatment — don't
          // stack a text fallback on top of it.
          null
        ) : (
          <Typography
            sx={{
              fontSize: Math.max(15, Math.round(30 * scale)),
              fontWeight: tokens.type.weight.bold,
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              color: tokens.color.textPrimary,
              textShadow: "0 2px 14px rgba(0,0,0,0.65)",
              maxWidth: "60%",
            }}
          >
            {title}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: `${Math.round(12 * scale)}px`,
          }}
        >
          {actions ? (
            // Live controls need pointer events back; the content layer above
            // sets `none` so the card underneath stays clickable.
            <Box
              className="card-actions"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                opacity: 0,
                pointerEvents: "none",
                transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
              }}
            >
              {actions}
            </Box>
          ) : actionLabel ? (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: `${Math.round(6 * scale)}px`,
                paddingInline: `${Math.round(16 * scale)}px`,
                paddingBlock: `${Math.round(8 * scale)}px`,
                borderRadius: `${tokens.radius.pill}px`,
                backgroundColor: tokens.color.textPrimary,
                color: tokens.color.textInverse,
                fontSize: Math.max(11, Math.round(14 * scale)),
                fontWeight: tokens.type.weight.bold,
                whiteSpace: "nowrap",
              }}
            >
              <PlayArrowIcon sx={{ fontSize: Math.max(14, Math.round(19 * scale)) }} />
              {actionLabel}
            </Box>
          ) : (
            <Box />
          )}

          {badges && badges.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: `${Math.round(6 * scale)}px`,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {badges.map((b) => (
                <ReasonBadge key={b.kind + b.text} spec={b} scale={scale} />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Continue Watching progress, pinned to the card's bottom edge. */}
      {progress !== undefined && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: focused ? 5 : 4,
            backgroundColor: "rgba(255,255,255,0.35)",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              height: "100%",
              backgroundColor: tokens.color.brand,
            }}
          />
        </Box>
      )}
    </Box>
  );
}
