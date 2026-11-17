import { Box, Typography } from "@mui/material";
import type { FocusRowItem } from "@/primitives";
import { DiscoverMark } from "./DiscoverMark";

/**
 * The Discovery explainer as a focus-row card: the Discover mark spinning in
 * over the same plum glow the demo video uses, ringed by the kaleidoscope
 * border the theme cards open with. Collapsed it's a poster (mark + name);
 * focused it's landscape with the line under it.
 */
const GLOW = "radial-gradient(ellipse at 50% 62%, #5a0f2a 0%, #1a0b1f 55%, #07050a 100%)";

function Artwork() {
  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit" }}>
      {/* The kaleidoscope ring (global .discovery-ring, from Discovery.tsx), fitted to the card. */}
      <Box className="discovery-ring" sx={{ inset: 0, borderRadius: "inherit !important", padding: "2px !important", animationDuration: "8s !important" }} />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(10px, 1.4vw, 18px)",
          // Sits high: the focused card's bottom scrim starts at 45% and would grey the name.
          padding: "6% 10% 22%",
          containerType: "size",
        }}
      >
        <Box sx={{ width: "clamp(44px, 34cqmin, 120px)", aspectRatio: "100 / 104", display: "grid", "& > span": { width: "100% !important", height: "100% !important" }, "& svg": { width: "100%", height: "100%" } }}>
          <DiscoverMark size={120} animate="intro" glow />
        </Box>
        <Typography
          sx={{
            fontSize: "clamp(16px, 11cqmin, 40px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: "#FFFFFF",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          Discovery
        </Typography>
      </Box>
    </Box>
  );
}

export function discoveryFocusItem(onOpen: () => void): FocusRowItem {
  return {
    key: "discovery-card",
    title: "Discovery",
    color: GLOW,
    artwork: <Artwork />,
    badges: [{ kind: "announce", text: "New feature" }],
    metaParts: ["Prototype", "5,400 titles on Netflix", "1:34 demo"],
    synopsis: "Pick a theme, then change any word in its description and the picks re-rank as you go. Watch the demo to see it in motion.",
    actionLabel: "Watch Demo",
    onOpen,
  };
}
