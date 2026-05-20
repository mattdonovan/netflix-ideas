import { Box, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { tokens } from "@/theme/tokens";

/**
 * The mic state visualization.
 *
 * Four states: idle, listening, transcribing, complete.
 * On TV, the only feedback channel is what moves — so each state moves
 * differently. Idle is still; listening pulses with breath; transcribing
 * ripples; complete settles to a steady glow.
 */

export type MicStatus = "idle" | "listening" | "transcribing" | "complete";

const breathe = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
`;

const ripple = keyframes`
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(1.6); opacity: 0; }
`;

export function MicState({
  status,
  transcript,
}: {
  status: MicStatus;
  transcript?: string;
}) {
  const accent = tokens.color.accent;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: `${tokens.space.lg}px`,
        py: `${tokens.space.xl}px`,
      }}
    >
      <Box sx={{ position: "relative", width: 200, height: 200, display: "grid", placeItems: "center" }}>
        {/* Ambient rings for listening state */}
        {status === "listening" && (
          <>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `2px solid ${accent}`,
                animation: `${ripple} 1800ms ${tokens.motion.easing.focus} infinite`,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `2px solid ${accent}`,
                animation: `${ripple} 1800ms ${tokens.motion.easing.focus} infinite 600ms`,
              }}
            />
          </>
        )}
        {/* Core mic disc */}
        <Box
          sx={{
            width: 144,
            height: 144,
            borderRadius: "50%",
            background:
              status === "listening" || status === "transcribing"
                ? `radial-gradient(circle, ${tokens.color.accentHover}, ${accent})`
                : status === "complete"
                  ? tokens.color.surfaceHigh
                  : tokens.color.surfaceMid,
            display: "grid",
            placeItems: "center",
            animation:
              status === "listening" ? `${breathe} 2200ms ${tokens.motion.easing.focus} infinite` : "none",
            transition: `background ${tokens.motion.duration.page}ms ${tokens.motion.easing.entrance}`,
          }}
        >
          <MicGlyph color={status === "idle" ? tokens.color.textSecondary : tokens.color.textPrimary} />
        </Box>
      </Box>

      <Box sx={{ minHeight: 96, textAlign: "center", maxWidth: 920 }}>
        <Typography
          sx={{
            fontSize: tokens.type.scale.micro.size,
            color: tokens.color.textSecondary,
            letterSpacing: tokens.type.scale.micro.letterSpacing,
            textTransform: "uppercase",
            fontWeight: tokens.type.weight.semibold,
            mb: `${tokens.space.sm}px`,
          }}
        >
          {labelForStatus(status)}
        </Typography>
        <Typography
          sx={{
            fontSize: tokens.type.scale.h3.size,
            lineHeight: tokens.type.scale.h3.lineHeight,
            letterSpacing: tokens.type.scale.h3.letterSpacing,
            fontWeight: tokens.type.weight.semibold,
            color: tokens.color.textPrimary,
            minHeight: tokens.type.scale.h3.size * tokens.type.scale.h3.lineHeight,
          }}
        >
          {transcript || (status === "idle" ? "What do you want to watch?" : "")}
        </Typography>
      </Box>
    </Box>
  );
}

function labelForStatus(status: MicStatus): string {
  switch (status) {
    case "idle":
      return "Tap T or press Enter to speak";
    case "listening":
      return "Listening";
    case "transcribing":
      return "Heard you";
    case "complete":
      return "Got it";
  }
}

function MicGlyph({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
