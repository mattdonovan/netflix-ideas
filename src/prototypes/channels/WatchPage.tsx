import { Box, IconButton, Typography } from "@mui/material";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OutlinedFlagIcon from "@mui/icons-material/OutlinedFlag";
import { tokens } from "@/theme/tokens";

/**
 * The Loom walkthrough, played on a dedicated full-screen page styled after
 * Netflix's web "Active Player Page" (Figma: Netflix Design System 2024,
 * node 1-5567). The Loom embed is the real player — it carries playback and
 * its own controls. The Netflix chrome (back / flag / scrubber / title) is
 * faithful set dressing layered around it so the surface reads as Netflix.
 */

export const LOOM_VIDEO_ID = "7f790ed025b94629ab89666cbc1dbe42";

// Strip Loom's own framing (top bar, owner, share, title) so the embed reads
// as a clean video surface inside the Netflix chrome. We deliberately do NOT
// autoplay: browsers block unmuted autoplay, and a blocked Loom embed renders
// solid black — so we show the poster and let the viewer press play, which is
// the natural Netflix gesture anyway.
const LOOM_WATCH_SRC =
  `https://www.loom.com/embed/${LOOM_VIDEO_ID}` +
  `?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`;

// Exact player palette from the Netflix reference (Secondary/Red-300,
// Grey-25, Grey-200). Held local to this surface — this is a literal Netflix
// quotation, not the adjacent Hawkins accent.
const PLAYER_RED = "#F50723";
const PLAYER_BUFFERED = "#D2D2D2";
const PLAYER_TRACK = "#808080";

export function WatchPage() {
  const navigate = useNavigate();

  // Lock page scroll while the player owns the viewport, and let Escape /
  // Backspace exit back to Discovery — matching the back arrow.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/discovery");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [navigate]);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        fontFamily: tokens.type.family.sans,
      }}
    >
      {/* Top chrome — floats over the video on a soft gradient. */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 96,
          paddingInline: `${tokens.space.lg}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <IconButton
          aria-label="Back"
          onClick={() => navigate("/discovery")}
          sx={{
            width: 44,
            height: 44,
            color: "#fff",
            pointerEvents: "auto",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 30 }} />
        </IconButton>
        <OutlinedFlagIcon sx={{ fontSize: 30, color: "#fff", opacity: 0.95 }} />
      </Box>

      {/* Video stage — the Loom player sits centered and letterboxed on black,
          the way a Netflix player frames content that doesn't fill the screen.
          The width is capped because Loom anchors its content top-left and
          renders the surplus black inside an oversized iframe; a 4:3 box it can
          fill keeps the poster and playback edge-to-edge. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        <Box
          component="iframe"
          src={LOOM_WATCH_SRC}
          title="Control overview"
          allow="fullscreen"
          allowFullScreen
          sx={{
            // Cap width by 1100px AND by a height-derived term so the 4:3 box
            // always fits the stage vertically. We avoid `maxHeight` here: with
            // a fixed width it would clamp height and break the ratio, which
            // makes the Loom embed letterbox itself to solid black.
            width: "min(100%, 1100px, calc((100vh - 140px) * 4 / 3))",
            aspectRatio: "4 / 3",
            height: "auto",
            border: 0,
            display: "block",
            backgroundColor: "#000",
          }}
        />
      </Box>

      {/* Bottom chrome — Netflix scrubber + title. */}
      <Box
        sx={{
          flexShrink: 0,
          paddingTop: `${tokens.space.md}px`,
          paddingBottom: `${tokens.space.md}px`,
          background: "linear-gradient(0deg, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0) 100%)",
        }}
      >
        {/* Progress indicator */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.space.sm}px`,
            paddingInline: `${tokens.space.md}px`,
          }}
        >
          <Box sx={{ position: "relative", flex: 1, height: 16, display: "flex", alignItems: "center" }}>
            {/* Track */}
            <Box sx={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: PLAYER_TRACK }} />
            {/* Buffered ahead of playhead */}
            <Box sx={{ position: "absolute", left: "72%", width: "5%", height: 4, borderRadius: 2, backgroundColor: PLAYER_BUFFERED }} />
            {/* Played */}
            <Box sx={{ position: "absolute", left: 0, width: "71%", height: 4, borderRadius: 2, backgroundColor: PLAYER_RED }} />
            {/* Scrubber handle */}
            <Box
              sx={{
                position: "absolute",
                left: "71%",
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: PLAYER_RED,
                transform: "translateX(-50%)",
                boxShadow: "0 0 8px rgba(0,0,0,0.6)",
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 16, color: "#fff", width: 70, textAlign: "right", flexShrink: 0 }}>
            1:00:41
          </Typography>
        </Box>

        {/* Title */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: `${tokens.space.xs}px`,
            paddingTop: `${tokens.space.md}px`,
            fontSize: 20,
            lineHeight: "30px",
          }}
        >
          <Typography component="span" sx={{ fontSize: 20, fontWeight: tokens.type.weight.medium, color: "#fff" }}>
            Control
          </Typography>
          <Typography component="span" sx={{ fontSize: 20, fontWeight: tokens.type.weight.regular, color: "#fff" }}>
            Overview
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
