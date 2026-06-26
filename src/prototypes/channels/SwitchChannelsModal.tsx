import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MicNoneIcon from "@mui/icons-material/MicNone";
import CheckIcon from "@mui/icons-material/Check";
import { tokens } from "@/theme/tokens";
import { SamsungWordmark, SAMSUNG_BLUE } from "@/primitives/SamsungWordmark";
import { ControlWordmark } from "@/primitives/ControlWordmark";
import { detectSystem } from "@/lib/system";
import { ChannelBarsIcon } from "./Channels";

/**
 * Tune Channels modal — peer of DetailModal but inverts the intent: instead of
 * describing a single title, this modal retunes a row of recommendations from a
 * free-text prompt. The whole interaction is the AI input; Claude then selects
 * a matching set of real catalog titles to fill the row.
 */


// Quick-pick chips. The chip shows a short label; clicking it fills the input
// with a fuller prompt that asks for a mix of movies, shows, and games in that
// theme. The media checkboxes then decide which of those actually come back.
const PROMPT_SUGGESTIONS: { label: string; prompt: string }[] = [
  {
    label: "Sci-fi",
    prompt:
      "A mix of movies, shows, and games with a sci-fi spirit — futuristic worlds, space, and big speculative ideas.",
  },
  {
    label: "Nostalgia",
    prompt:
      "A mix of movies, shows, and games that feel nostalgic — throwbacks and comfort picks that take me back.",
  },
  {
    label: "Big Emotions",
    prompt:
      "A mix of movies, shows, and games with big emotions — tearjerkers, heart, and real catharsis.",
  },
  {
    label: "Education",
    prompt:
      "A mix of movies, shows, and games that teach me something — documentaries, history, science, and curious deep dives.",
  },
];

// Media-type checkboxes shown in the input. `key` maps to a catalog `kind` so
// the caller can filter the candidate pool to just the checked types.
export type MediaKind = "movie" | "tv" | "game";
type MediaState = Record<MediaKind, boolean>;
const MEDIA_TOGGLES: { key: MediaKind; label: string }[] = [
  { key: "movie", label: "Movies" },
  { key: "tv", label: "Shows" },
  { key: "game", label: "Games" },
];
const ALL_MEDIA: MediaState = { movie: true, tv: true, game: true };

export function SwitchChannelsModal({
  open,
  channelTitle,
  authed,
  onClose,
  onEnable,
  onDisconnect,
  onAbout,
  onSubmitPrompt,
}: {
  open: boolean;
  /** The row being tuned — kept for callers but not shown in the header. */
  channelTitle?: string;
  /** Whether the member has enabled Take Control via Samsung. */
  authed: boolean;
  onClose: () => void;
  onEnable: () => void;
  onDisconnect: () => void;
  onAbout: () => void;
  onSubmitPrompt?: (prompt: string, kinds: MediaKind[]) => void;
}) {
  void channelTitle;

  const [prompt, setPrompt] = useState("");
  const [media, setMedia] = useState<MediaState>(ALL_MEDIA);
  const [phase, setPhase] = useState<"enable" | "checking" | "tune">("enable");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // On open: reset the prompt and jump straight to the tune surface if Samsung
  // is already connected; otherwise start at the enable gate.
  useEffect(() => {
    if (open) {
      setPrompt("");
      setMedia(ALL_MEDIA);
      setPhase(authed ? "tune" : "enable");
    }
  }, [open, authed]);

  if (!open) return null;

  function submit() {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const kinds = MEDIA_TOGGLES.filter((t) => media[t.key]).map((t) => t.key);
    onSubmitPrompt?.(trimmed, kinds);
    onClose();
  }

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Tune Channels"
      sx={{ position: "fixed", inset: 0, zIndex: 1300, backgroundColor: tokens.color.base, overflowY: "auto" }}
    >
      <Box
        sx={{
          position: "relative",
          minHeight: "100dvh",
          width: "100%",
          backgroundColor: tokens.color.surfaceLow,
          color: tokens.color.textPrimary,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
          paddingBlock: { xs: `${tokens.space.xl}px`, md: `${tokens.space["2xl"]}px` },
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: tokens.space.lg,
            right: tokens.space.lg,
            width: 40,
            height: 40,
            backgroundColor: "rgba(20,20,20,0.7)",
            color: tokens.color.textPrimary,
            zIndex: 2,
            "&:hover": { backgroundColor: tokens.color.base },
          }}
        >
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>

        {phase === "enable" && <EnableGate onContinue={() => setPhase("checking")} onAbout={onAbout} />}
        {phase === "checking" && (
          <CompatibilityCheck
            onDone={() => {
              onEnable();
              setPhase("tune");
            }}
          />
        )}
        {phase === "tune" && (
          <TuneView
            prompt={prompt}
            setPrompt={setPrompt}
            media={media}
            setMedia={setMedia}
            inputRef={inputRef}
            onSubmit={submit}
            onDisconnect={() => {
              onDisconnect();
              setPhase("enable");
            }}
          />
        )}
      </Box>
    </Box>
  );
}

/**
 * Pre-auth gate. Frames Take Control as a Samsung-sponsored perk and explains
 * the device-vs-browser entitlement before the member signs in with Samsung.
 */
function EnableGate({ onContinue, onAbout }: { onContinue: () => void; onAbout: () => void }) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 520,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: `${tokens.space.md}px`,
      }}
    >
      <Box sx={{ color: tokens.color.textPrimary, filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.45))" }}>
        <ChannelBarsIcon size={56} />
      </Box>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: "8px", color: tokens.color.textSecondary, fontSize: 12 }}>
        Presented by <SamsungWordmark height={12} color={tokens.color.textPrimary} />
      </Box>
      <Typography sx={{ fontSize: { xs: 34, sm: 44, md: 52 }, lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Tune Channels
      </Typography>
      <Typography sx={{ fontSize: { xs: 15, md: 18 }, color: tokens.color.accent, fontWeight: tokens.type.weight.semibold }}>
        Included with your Samsung TV.
      </Typography>
      <Typography sx={{ fontSize: { xs: 14, md: 15 }, color: tokens.color.textSecondary, lineHeight: 1.6, maxWidth: "42ch" }}>
        Describe what you want to watch and your row retunes to a real mix of movies, shows, and games — chosen for you in the moment.
      </Typography>
      <Typography sx={{ fontSize: 13, color: tokens.color.textTertiary, lineHeight: 1.6, maxWidth: "42ch" }}>
        On your Samsung TV this is built in. In your browser, sign in with Samsung to enable it.
      </Typography>
      <Box
        component="button"
        type="button"
        onClick={onContinue}
        sx={{
          marginTop: `${tokens.space.sm}px`,
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          height: 48,
          paddingInline: "24px",
          backgroundColor: SAMSUNG_BLUE,
          color: "#FFFFFF",
          border: 0,
          borderRadius: `${tokens.radius.sm}px`,
          fontFamily: "inherit",
          fontSize: 15,
          fontWeight: tokens.type.weight.bold,
          cursor: "pointer",
          transition: `filter ${tokens.motion.duration.focus}ms`,
          "&:hover": { filter: "brightness(1.1)" },
        }}
      >
        Continue with <SamsungWordmark height={13} color="#FFFFFF" />
      </Box>
      <Box
        component="button"
        type="button"
        onClick={onAbout}
        sx={{
          background: "none",
          border: 0,
          color: tokens.color.textSecondary,
          fontFamily: "inherit",
          fontSize: 13,
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          "&:hover": { color: tokens.color.textPrimary },
        }}
      >
        About this prototype
      </Box>
    </Box>
  );
}

/**
 * Device compatibility check — the member-facing echo of partner device
 * certification. Resolves a checklist of real browser signals one-by-one to
 * confirm this machine can run the AI, then hands off to the tune surface.
 */
function CompatibilityCheck({ onDone }: { onDone: () => void }) {
  const checks = useMemo(() => detectSystem(), []);
  const [revealed, setRevealed] = useState(0);
  const complete = revealed >= checks.length;

  useEffect(() => {
    if (complete) {
      const t = setTimeout(onDone, 850);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealed((r) => r + 1), revealed === 0 ? 450 : 500);
    return () => clearTimeout(t);
  }, [revealed, complete, onDone, checks.length]);

  const shown = checks.slice(0, Math.min(revealed + 1, checks.length));

  return (
    <Box sx={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: `${tokens.space.md}px` }}>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: "8px", color: tokens.color.textSecondary, fontSize: 12 }}>
        Presented by <SamsungWordmark height={12} color={tokens.color.textPrimary} />
      </Box>
      <Typography sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 800, letterSpacing: "-0.015em", textAlign: "center" }}>
        Setting up Tune Channels
      </Typography>
      <Typography sx={{ fontSize: 14, color: tokens.color.textSecondary, textAlign: "center" }}>
        Making sure this device can run it.
      </Typography>

      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: `${tokens.space.xs}px`, marginTop: `${tokens.space.sm}px` }}>
        {shown.map((c, i) => {
          const done = i < revealed;
          return (
            <Box
              key={c.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: `${tokens.space.sm}px`,
                paddingBlock: "9px",
                paddingInline: `${tokens.space.sm}px`,
                borderRadius: `${tokens.radius.sm}px`,
                backgroundColor: tokens.color.surfaceMid,
              }}
            >
              <Box sx={{ width: 20, height: 20, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {done ? (
                  <CheckIcon sx={{ fontSize: 18, color: "#46D369" }} />
                ) : (
                  <CircularProgress size={14} sx={{ color: tokens.color.textSecondary }} />
                )}
              </Box>
              <Typography sx={{ flex: 1, fontSize: 14, color: tokens.color.textPrimary }}>{c.label}</Typography>
              <Typography sx={{ fontSize: 13, color: done ? tokens.color.textSecondary : tokens.color.textTertiary }}>
                {done ? c.value : "Checking…"}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {complete && (
        <Typography sx={{ marginTop: `${tokens.space.sm}px`, fontSize: 15, fontWeight: tokens.type.weight.semibold, color: "#46D369", textAlign: "center" }}>
          This device can run Tune Channels
        </Typography>
      )}
    </Box>
  );
}

/**
 * The enabled tune surface — the original AI input, now living behind the
 * Samsung gate with a quiet "Enabled by Samsung · Disconnect" footer.
 */
function TuneView({
  prompt,
  setPrompt,
  media,
  setMedia,
  inputRef,
  onSubmit,
  onDisconnect,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  media: MediaState;
  setMedia: React.Dispatch<React.SetStateAction<MediaState>>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onSubmit: () => void;
  onDisconnect: () => void;
}) {
  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: `${tokens.space.lg}px` }}>
      <Box sx={{ color: tokens.color.textPrimary, filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.45))" }}>
        <ChannelBarsIcon size={56} />
      </Box>

      <Typography sx={{ fontSize: { xs: 30, sm: 36, md: 42 }, lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.015em", textAlign: "center" }}>
        Tune Channels
      </Typography>

      <Box sx={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: `${tokens.space.sm}px` }}>
        <PromptInput value={prompt} onChange={setPrompt} media={media} setMedia={setMedia} inputRef={inputRef} onSubmit={onSubmit} />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: `${tokens.space.xs}px`, justifyContent: "center" }}>
          {PROMPT_SUGGESTIONS.map((s) => (
            <Box
              key={s.label}
              component="button"
              type="button"
              onClick={() => {
                setPrompt(s.prompt);
                inputRef.current?.focus();
              }}
              sx={{
                fontSize: 13,
                fontFamily: "inherit",
                fontWeight: tokens.type.weight.medium,
                color: tokens.color.textPrimary,
                opacity: 0.85,
                backgroundColor: tokens.color.surfaceMid,
                border: `1px solid ${tokens.color.borderStrong}`,
                paddingInline: "16px",
                paddingBlock: "8px",
                borderRadius: `${tokens.radius.pill}px`,
                cursor: "pointer",
                transition: `opacity ${tokens.motion.duration.focus}ms, background-color ${tokens.motion.duration.focus}ms, border-color ${tokens.motion.duration.focus}ms`,
                "&:hover": {
                  opacity: 1,
                  backgroundColor: tokens.color.surfaceHigh,
                  borderColor: tokens.color.textSecondary,
                },
              }}
            >
              {s.label}
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "7px" }}>
        <ControlWordmark height={15} color={tokens.color.textPrimary} />
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: "8px", color: tokens.color.textSecondary, fontSize: 12 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            Enabled by <SamsungWordmark height={11} color={tokens.color.textPrimary} />
          </Box>
          <Box component="span" sx={{ color: tokens.color.textTertiary }}>·</Box>
          <Box
            component="button"
            type="button"
            onClick={onDisconnect}
            sx={{
              background: "none",
              border: 0,
              color: tokens.color.textSecondary,
              fontFamily: "inherit",
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              "&:hover": { color: tokens.color.textPrimary },
            }}
          >
            Disconnect
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function PromptInput({
  value,
  onChange,
  media,
  setMedia,
  inputRef,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  media: MediaState;
  setMedia: React.Dispatch<React.SetStateAction<MediaState>>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onSubmit: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const expanded = focused || value.length > 0;

  // Toggle a media type, but never let the user uncheck the last one — an empty
  // set would have nothing to tune from.
  function toggleMedia(key: MediaKind) {
    setMedia((m) => {
      const next = { ...m, [key]: !m[key] };
      if (!next.movie && !next.tv && !next.game) return m;
      return next;
    });
  }

  const restHeight = 52;
  const expandedHeight = 108;
  const ease = tokens.motion.easing.focus;
  const dur = tokens.motion.duration.focus;

  return (
    <Box
      onClick={() => inputRef.current?.focus()}
      sx={{
        position: "relative",
        width: "100%",
        height: `${expanded ? expandedHeight : restHeight}px`,
        backgroundColor: tokens.color.surfaceMid,
        border: `2px solid ${expanded ? tokens.color.textSecondary : tokens.color.borderStrong}`,
        borderRadius: expanded ? `${tokens.radius.md}px` : `${restHeight / 2}px`,
        cursor: "text",
        overflow: "hidden",
        transition: `height ${dur}ms ${ease}, border-radius ${dur}ms ${ease}, border-color ${dur}ms ${ease}, background-color ${dur}ms ${ease}`,
        "&:focus-within": {
          backgroundColor: tokens.color.surfaceHigh,
          borderColor: tokens.color.textPrimary,
        },
      }}
    >
      <Box
        component="textarea"
        ref={inputRef}
        rows={1}
        wrap="off"
        value={value}
        onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Describe what you want to watch…"
        sx={{
          position: "absolute",
          inset: 0,
          paddingTop: expanded ? "14px" : `${(restHeight - 22) / 2}px`,
          paddingBottom: expanded ? "48px" : `${(restHeight - 22) / 2}px`,
          paddingLeft: `${tokens.space.md}px`,
          paddingRight: "88px",
          backgroundColor: "transparent",
          border: 0,
          outline: "none",
          resize: "none",
          color: tokens.color.textPrimary,
          fontFamily: tokens.type.family.sans,
          fontSize: 16,
          lineHeight: 1.4,
          transition: `padding ${dur}ms ${ease}`,
          // On mobile the pill is narrow enough that the placeholder
          // wraps to a second line that the 52px-tall pill then clips.
          // Force a single line + ellipsis at xs; let sm+ behave normally.
          whiteSpace: { xs: "nowrap", sm: "normal" },
          textOverflow: "ellipsis",
          // Hide the textarea's scrollbar in both states — the pill should
          // read as a clean input, not a multi-line editor with chrome.
          overflow: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none", width: 0, height: 0 },
          "&::placeholder": {
            color: tokens.color.textSecondary,
            opacity: 0.95,
            whiteSpace: { xs: "nowrap", sm: "normal" },
            textOverflow: "ellipsis",
            overflow: "hidden",
          },
        }}
      />

      {/* Media checkboxes — bottom-left, only while expanded. mouseDown is
          prevented so toggling doesn't blur the textarea (which would collapse
          the input when it's empty). */}
      <Box
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "absolute",
          left: `${tokens.space.md}px`,
          bottom: 12,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? "auto" : "none",
          transition: `opacity ${dur}ms ${ease}`,
        }}
      >
        {MEDIA_TOGGLES.map((t) => {
          const checked = media[t.key];
          return (
            <Box
              key={t.key}
              component="button"
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggleMedia(t.key)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                height: 26,
                paddingInline: "8px",
                borderRadius: `${tokens.radius.pill}px`,
                border: `1px solid ${checked ? tokens.color.accent : tokens.color.borderStrong}`,
                backgroundColor: checked ? "rgba(228,64,76,0.16)" : "transparent",
                color: checked ? tokens.color.textPrimary : tokens.color.textSecondary,
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: tokens.type.weight.medium,
                cursor: "pointer",
                transition: `background-color ${dur}ms ${ease}, border-color ${dur}ms ${ease}, color ${dur}ms ${ease}`,
                "&:hover": { borderColor: checked ? tokens.color.accent : tokens.color.textSecondary },
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "3px",
                  display: "grid",
                  placeItems: "center",
                  border: `1.5px solid ${checked ? tokens.color.accent : tokens.color.textSecondary}`,
                  backgroundColor: checked ? tokens.color.accent : "transparent",
                  color: tokens.color.textPrimary,
                  flexShrink: 0,
                }}
              >
                {checked && <CheckIcon sx={{ fontSize: 11 }} />}
              </Box>
              {t.label}
            </Box>
          );
        })}
      </Box>

      <IconButton
        aria-label="Dictate"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.focus();
        }}
        sx={{
          position: "absolute",
          top: expanded ? "auto" : "50%",
          bottom: expanded ? 10 : "auto",
          right: expanded ? 56 : 10,
          transform: expanded ? "none" : "translateY(-50%)",
          width: 36,
          height: 36,
          color: tokens.color.textSecondary,
          transition: `right ${dur}ms ${ease}, top ${dur}ms ${ease}, bottom ${dur}ms ${ease}, color ${dur}ms ${ease}`,
          "&:hover": {
            color: tokens.color.textPrimary,
            backgroundColor: "rgba(245,245,245,0.08)",
          },
        }}
      >
        <MicNoneIcon sx={{ fontSize: 20 }} />
      </IconButton>

      <IconButton
        aria-label="Submit prompt"
        onClick={(e) => {
          e.stopPropagation();
          onSubmit();
        }}
        disabled={value.trim().length === 0}
        sx={{
          position: "absolute",
          bottom: 10,
          right: 10,
          width: 36,
          height: 36,
          backgroundColor: tokens.color.textPrimary,
          color: tokens.color.textInverse,
          opacity: expanded ? 1 : 0,
          transform: expanded ? "scale(1)" : "scale(0.4)",
          pointerEvents: expanded ? "auto" : "none",
          transition: `opacity ${dur}ms ${ease}, transform ${dur}ms ${ease}, background-color ${dur}ms ${ease}`,
          "&:hover": { backgroundColor: "rgba(245,245,245,0.85)" },
          "&.Mui-disabled": {
            backgroundColor: tokens.color.surfaceHigh,
            color: tokens.color.textTertiary,
          },
        }}
      >
        <ArrowUpwardIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
}
