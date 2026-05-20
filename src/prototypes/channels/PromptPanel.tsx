import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { tokens } from "@/theme/tokens";
import { MicState, type MicStatus } from "@/primitives";
import { categorize, claudeAvailable, type ChannelCategory, type ConversationTurn } from "@/lib/claude";

/**
 * The prompt panel — the heart of the Channels feature.
 *
 * Lifecycle:
 *   1. Panel opens with current channel context as the conversation seed.
 *   2. User types (and/or speaks — speech later) what they want.
 *   3. Submit → Claude → category response.
 *   4. User sees a preview of the resulting channel.
 *   5. User accepts (closes panel, channel updates) or refines (continues
 *      the conversation, sending the next message into history).
 */

type Status = "idle" | "listening" | "submitting" | "preview" | "error";

export function PromptPanel({
  open,
  currentTitle,
  onAccept,
  onClose,
}: {
  open: boolean;
  currentTitle: string;
  onAccept: (category: ChannelCategory) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [preview, setPreview] = useState<ChannelCategory | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset state and focus the input when the panel opens.
  useEffect(() => {
    if (open) {
      setStatus("idle");
      setTranscript("");
      setHistory([]);
      setPreview(null);
      setErrorMessage(null);
      // Auto-focus the input on next paint so the user can just type.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function submit() {
    const desc = transcript.trim();
    if (!desc) return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const result = await categorize(desc, history);
      setHistory((h) => [
        ...h,
        { role: "user", content: desc },
        { role: "assistant", content: JSON.stringify(result) },
      ]);
      setPreview(result);
      setStatus("preview");
      setTranscript("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function refine() {
    setStatus("idle");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (!open) return null;

  const micStatus: MicStatus = status === "submitting" ? "transcribing" : status === "preview" ? "complete" : "idle";

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        backgroundColor: "rgba(11, 11, 11, 0.92)",
        backdropFilter: "blur(24px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: `fadeIn ${tokens.motion.duration.page}ms ${tokens.motion.easing.entrance}`,
        "@keyframes fadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      {/* Context — what channel we're editing */}
      <Box sx={{ position: "absolute", top: tokens.space["3xl"], left: 0, right: 0, textAlign: "center" }}>
        <Typography sx={{ fontSize: tokens.type.scale.micro.size, color: tokens.color.textSecondary, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase", fontWeight: tokens.type.weight.semibold, mb: `${tokens.space.xs}px` }}>
          Tell us what this row should be
        </Typography>
        <Typography sx={{ fontSize: tokens.type.scale.h2.size, lineHeight: tokens.type.scale.h2.lineHeight, letterSpacing: tokens.type.scale.h2.letterSpacing, fontWeight: tokens.type.weight.bold, color: tokens.color.textPrimary }}>
          {preview ? preview.title : currentTitle}
        </Typography>
      </Box>

      {/* Mic visualization */}
      <MicState status={micStatus} transcript={transcript || (preview ? "" : "")} />

      {/* Input */}
      {(status === "idle" || status === "error") && (
        <Box sx={{ width: 1200, mt: `${tokens.space.lg}px` }}>
          <Box
            component="input"
            ref={inputRef}
            value={transcript}
            placeholder='e.g. "monster movies with soul", "new nostalgia", "indie films from this year"'
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTranscript(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") submit();
            }}
            sx={{
              width: "100%",
              padding: `${tokens.space.lg}px ${tokens.space.xl}px`,
              fontSize: tokens.type.scale.h3.size,
              fontFamily: tokens.type.family.sans,
              fontWeight: tokens.type.weight.medium,
              backgroundColor: tokens.color.surfaceLow,
              color: tokens.color.textPrimary,
              border: `2px solid ${tokens.color.borderStrong}`,
              borderRadius: `${tokens.radius.md}px`,
              outline: "none",
              transition: `border-color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
              "&:focus": {
                borderColor: tokens.color.textPrimary,
              },
              "&::placeholder": {
                color: tokens.color.textTertiary,
              },
            }}
          />
          {errorMessage && (
            <Typography sx={{ mt: `${tokens.space.sm}px`, color: tokens.color.danger, fontSize: tokens.type.scale.bodySmall.size }}>
              {errorMessage}
            </Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: `${tokens.space.md}px`, color: tokens.color.textTertiary }}>
            <Typography sx={{ fontSize: tokens.type.scale.micro.size, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase" }}>
              Enter to submit · Esc to cancel
            </Typography>
            <Typography sx={{ fontSize: tokens.type.scale.micro.size, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase" }}>
              {claudeAvailable ? "Powered by Claude → Ranker" : "Offline mock — add API key to .env"}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Preview pane */}
      {status === "preview" && preview && (
        <Box sx={{ width: 1200, mt: `${tokens.space.lg}px` }}>
          <Box
            sx={{
              backgroundColor: tokens.color.surfaceLow,
              borderRadius: `${tokens.radius.md}px`,
              padding: `${tokens.space.lg}px`,
              borderLeft: `4px solid ${preview.moodColor}`,
            }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: `${tokens.space.xs}px`, mb: `${tokens.space.md}px` }}>
              {preview.tags.map((tag) => (
                <Chip key={tag} label={tag} />
              ))}
              {preview.tone.map((t) => (
                <Chip key={t} label={t} muted />
              ))}
            </Box>
            <Box component="ul" sx={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${tokens.space.sm}px ${tokens.space.lg}px` }}>
              {preview.exemplars.slice(0, 6).map((ex) => (
                <Box component="li" key={ex.title} sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography sx={{ fontSize: tokens.type.scale.bodySmall.size, fontWeight: tokens.type.weight.semibold, color: tokens.color.textPrimary }}>
                    {ex.title} <Box component="span" sx={{ color: tokens.color.textTertiary, fontWeight: tokens.type.weight.regular }}>· {ex.year}</Box>
                  </Typography>
                  <Typography sx={{ fontSize: tokens.type.scale.micro.size, color: tokens.color.textSecondary, fontStyle: "italic" }}>
                    {ex.oneLine}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: `${tokens.space.lg}px`, alignItems: "center" }}>
            <Box sx={{ display: "flex", gap: `${tokens.space.md}px` }}>
              <ActionButton onClick={() => onAccept(preview)} primary>
                Use this row
              </ActionButton>
              <ActionButton onClick={refine}>Refine</ActionButton>
              <ActionButton onClick={onClose}>Cancel</ActionButton>
            </Box>
            <Typography sx={{ fontSize: tokens.type.scale.micro.size, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase", color: tokens.color.textTertiary }}>
              {history.length / 2} turn{history.length / 2 === 1 ? "" : "s"}
            </Typography>
          </Box>
        </Box>
      )}

      {status === "submitting" && (
        <Box sx={{ mt: `${tokens.space.lg}px` }}>
          <Typography sx={{ fontSize: tokens.type.scale.bodySmall.size, color: tokens.color.textSecondary, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase" }}>
            Asking the Ranker
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function Chip({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <Box
      sx={{
        paddingInline: `${tokens.space.sm}px`,
        paddingBlock: `${tokens.space.xxs}px`,
        borderRadius: `${tokens.radius.pill}px`,
        backgroundColor: muted ? "transparent" : tokens.color.surfaceMid,
        border: muted ? `1px solid ${tokens.color.border}` : "none",
        color: muted ? tokens.color.textSecondary : tokens.color.textPrimary,
        fontSize: tokens.type.scale.micro.size,
        fontWeight: tokens.type.weight.semibold,
        letterSpacing: tokens.type.scale.micro.letterSpacing,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  );
}

function ActionButton({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        paddingInline: `${tokens.space.lg}px`,
        paddingBlock: `${tokens.space.sm}px`,
        fontSize: tokens.type.scale.label.size,
        fontWeight: tokens.type.weight.semibold,
        fontFamily: tokens.type.family.sans,
        backgroundColor: primary ? tokens.color.textPrimary : "transparent",
        color: primary ? tokens.color.textInverse : tokens.color.textPrimary,
        border: primary ? "none" : `2px solid ${tokens.color.borderStrong}`,
        borderRadius: `${tokens.radius.sm}px`,
        cursor: "pointer",
        transition: `all ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        "&:hover": {
          backgroundColor: primary ? tokens.color.textPrimary : tokens.color.surfaceMid,
          borderColor: primary ? "transparent" : tokens.color.textPrimary,
        },
      }}
    >
      {children}
    </Box>
  );
}
