import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { tokens } from "@/theme/tokens";

/**
 * Remote cue.
 *
 * Netflix-on-TV does not surface key-cap glyphs in boxes. The interaction is
 * meant to be discovered through focus state — the cue should be a soft
 * whisper at the bottom of the screen, not a keyboard tester.
 *
 * Idle-fade behavior: after `tokens.tv.idleDelayMs` of no keyboard input the
 * cue drops to a lower opacity, signalling "you've got this" — and reappears
 * at the next keypress. The MDS pass-1 finding: a persistently-visible cue
 * is training wheels; the right move is to teach once and then get out of
 * the way.
 */

export type CueKey = "↑" | "↓" | "←" | "→" | "OK" | "T" | "BACK";

export function RemoteCue({ cues }: { cues: Array<{ key: CueKey | string; label: string }> }) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      if (timer) clearTimeout(timer);
      setIdle(false);
      timer = setTimeout(() => setIdle(true), tokens.tv.idleDelayMs);
    }
    schedule();
    window.addEventListener("keydown", schedule);
    window.addEventListener("pointermove", schedule);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("keydown", schedule);
      window.removeEventListener("pointermove", schedule);
    };
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: `${tokens.space.lg}px`,
        opacity: idle ? 0.25 : 0.7,
        transition: `opacity ${tokens.motion.duration.page}ms ${tokens.motion.easing.focus}`,
      }}
    >
      {cues.map((cue, i) => (
        <Box
          key={cue.key + cue.label}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.space.sm}px`,
          }}
        >
          {i > 0 && (
            <Box
              sx={{
                width: 1,
                height: 16,
                backgroundColor: tokens.color.textTertiary,
                opacity: 0.4,
                mr: `${tokens.space.lg - tokens.space.sm}px`,
              }}
            />
          )}
          <Typography
            sx={{
              color: tokens.color.textSecondary,
              fontSize: tokens.type.scale.label.size,
              fontWeight: tokens.type.weight.semibold,
              fontFeatureSettings: `'ss01'`,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {cue.key}
          </Typography>
          <Typography
            sx={{
              color: tokens.color.textTertiary,
              fontSize: tokens.type.scale.micro.size,
              fontWeight: tokens.type.weight.semibold,
              letterSpacing: tokens.type.scale.micro.letterSpacing,
              textTransform: "uppercase",
            }}
          >
            {cue.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
