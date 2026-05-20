import { Box, Typography } from "@mui/material";
import { tokens } from "@/theme/tokens";

/**
 * D-pad cue strip.
 *
 * Persistent footer that tells the viewer which remote controls are wired
 * to which actions in the current context. On a real TV this would be the
 * thing the user glances at once before forgetting it exists. In the
 * prototype, it doubles as documentation for the demo viewer.
 */

export type CueKey = "↑" | "↓" | "←" | "→" | "OK" | "T" | "BACK";

export function RemoteCue({ cues }: { cues: Array<{ key: CueKey | string; label: string }> }) {
  return (
    <Box
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        gap: `${tokens.space.lg}px`,
        padding: `${tokens.space.md}px ${tokens.space.lg}px`,
      }}
    >
      {cues.map((cue) => (
        <Box
          key={cue.key + cue.label}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.space.xs}px`,
          }}
        >
          <Box
            sx={{
              minWidth: 48,
              height: 48,
              paddingInline: `${tokens.space.sm}px`,
              borderRadius: `${tokens.radius.sm}px`,
              border: `2px solid ${tokens.color.borderStrong}`,
              backgroundColor: tokens.color.surfaceLow,
              color: tokens.color.textPrimary,
              display: "grid",
              placeItems: "center",
              fontSize: tokens.type.scale.label.size,
              fontWeight: tokens.type.weight.semibold,
            }}
          >
            {cue.key}
          </Box>
          <Typography
            sx={{
              color: tokens.color.textSecondary,
              fontSize: tokens.type.scale.bodySmall.size,
              fontWeight: tokens.type.weight.medium,
            }}
          >
            {cue.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
