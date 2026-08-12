import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { tokens } from "@/theme/tokens";

/**
 * The inset billboard.
 *
 * Where the web hero is a full-bleed band that the first row's title crawls up
 * into, the TV hero is a discrete object: an inset rounded rectangle with a
 * visible edge, taking most of the screen, with the next row's title peeking
 * below it. That edge is doing real work — it says the hero is one focusable
 * thing rather than a background the rows sit on top of.
 *
 * Everything variable is a slot: `backdrop` paints edge to edge under the
 * scrim, `overlay` sits above the scrim (oversized glyphs, decorations),
 * `children` is the bottom-left content column, and `badges` pins to the
 * bottom right — the position the redesign uses for its reason chips.
 */
export function Billboard({
  backdrop,
  overlay,
  badges,
  children,
  onMouseMove,
  onMouseLeave,
}: {
  backdrop?: ReactNode;
  overlay?: ReactNode;
  badges?: ReactNode;
  children?: ReactNode;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: () => void;
}) {
  return (
    <Box
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      sx={{
        position: "relative",
        // Sized so the first row's card tops clear the fold — the hero should
        // read as the lead item, not as the whole screen.
        height: "clamp(260px, 54vh, 620px)",
        borderRadius: `${tokens.radius.lg}px`,
        border: `1px solid rgba(245,245,245,0.16)`,
        overflow: "hidden",
        backgroundColor: tokens.color.surfaceLow,
      }}
    >
      {backdrop}

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(90deg, rgba(8,8,10,0.82) 0%, rgba(8,8,10,0.42) 42%, rgba(8,8,10,0) 72%),
            linear-gradient(0deg, rgba(8,8,10,0.78) 0%, rgba(8,8,10,0) 46%)
          `,
          pointerEvents: "none",
        }}
      />

      {overlay}

      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "clamp(24px, 3.4vw, 56px)",
          maxWidth: { xs: "100%", md: "64%", lg: "56%" },
        }}
      >
        {children}
      </Box>

      {badges && (
        <Box
          sx={{
            position: "absolute",
            right: "clamp(24px, 3.4vw, 56px)",
            bottom: "clamp(24px, 3.4vw, 56px)",
            // Below sm the billboard is too narrow for badges and CTAs to
            // share a baseline — the CTAs win.
            display: { xs: "none", sm: "flex" },
            gap: "8px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            maxWidth: "40%",
          }}
        >
          {badges}
        </Box>
      )}
    </Box>
  );
}

/** Full-bleed artwork for the billboard's `backdrop` slot. */
export function BillboardArt({ src }: { src: string }) {
  return (
    <Box
      component="img"
      src={src}
      alt=""
      sx={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center 20%",
        pointerEvents: "none",
      }}
    />
  );
}

/** Shimmering placeholder for the billboard's `backdrop` slot. */
export function BillboardSkeleton() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundColor: tokens.color.surfaceLow,
        overflow: "hidden",
        "@keyframes heroShimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
          animation: "heroShimmer 1.5s linear infinite",
        },
      }}
    />
  );
}

export function HeroSkeletonBar({ width, height }: { width: string; height: number }) {
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: `${tokens.radius.sm}px`,
        backgroundColor: "rgba(255,255,255,0.13)",
        "@keyframes heroPulse": { "0%,100%": { opacity: 0.45 }, "50%": { opacity: 0.9 } },
        animation: "heroPulse 1.4s ease-in-out infinite",
      }}
    />
  );
}
