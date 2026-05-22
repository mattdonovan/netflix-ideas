import { Box, Typography, IconButton } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MicNoneIcon from "@mui/icons-material/MicNone";
import daxMonicaUrl from "@/assets/dax-monica.png";
import upsideDownVideoUrl from "@/assets/upside-down.mp4";
import yourFriendsUrl from "@/assets/your-friends.jpg";
import learnSomethingUrl from "@/assets/learn-something.jpg";
import unityUrl from "@/assets/unity.jpg";
import leoSeasonUrl from "@/assets/leo-season.png";
import { tokens } from "@/theme/tokens";

/**
 * Switch Channels modal — peer of DetailModal but inverts the intent:
 * instead of describing a single title, this modal lets the user replace a
 * row of recommendations with a different curatorial lens. The headline
 * interaction is the prompt input; curated channels below act as shortcuts.
 */

export type SwitchChannelOption = {
  id: string;
  title: string;
  description: string;
  accent: [string, string];
  imageUrl?: string;
  /** Degrees of rotation to apply to the imageUrl (used for upside-down). */
  imageRotate?: number;
  /** Video that fills the card. Frozen on first frame until hover; plays once
   *  on hover; resets when the cursor leaves. Takes precedence over imageUrl. */
  videoUrl?: string;
  /** Pill badge in the corner. Can include a leading emoji. */
  tag?: string;
  /** Scale applied to the image layer on hover. Default 1.08 (ken-burns zoom);
   *  set to 1 to disable scaling (e.g. video cards). */
  imageHoverScale?: number;
  /** transform-origin for the image layer's hover scale. */
  imageHoverOrigin?: string;
  /** ms for the image hover transition. Longer = slower / dreamier. */
  imageHoverDurationMs?: number;
};

const POPULAR_CHANNELS: SwitchChannelOption[] = [
  {
    id: "armchairies",
    title: "Armchairies",
    description:
      "Dax & Monica, mystery science theater style with your favorite armchair anonymous guests.",
    accent: ["#F25862", "#7B2FFF"],
    imageUrl: daxMonicaUrl,
    tag: "\uD83C\uDF52 Armchairies",
    imageHoverDurationMs: 2400,
  },
  {
    id: "upside-down",
    title: "Upside-down",
    description:
      "Your personal shadow-lands. Every episode, the opposite of what you \u201cought\u201d to like. We hope you love it.",
    accent: ["#3D6FFF", "#E83A1A"],
    videoUrl: upsideDownVideoUrl,
    tag: "Upside-down",
    imageHoverScale: 1,
  },
  {
    id: "your-friends",
    title: "Your friends",
    description:
      "Okay, we admit it \u2014 we watch you watch us. You signed the T&C\u2019s, so why not make the most of it? All your best friends\u2019 favorites.",
    accent: ["#2BB673", "#3D6FFF"],
    imageUrl: yourFriendsUrl,
    tag: "Your friends",
  },
  {
    id: "learn-something",
    title: "Learn something",
    description:
      "Select topics and languages as often as you like. Mix documentaries, foreign favorites, and hosts into your personal infotainment soup. Or maybe salad?",
    accent: ["#3D6FFF", "#C2185B"],
    imageUrl: learnSomethingUrl,
    tag: "Learn something",
  },
  {
    id: "unity",
    title: "Unity",
    description:
      "We could all use a little bit more of that, couldn\u2019t we? This is a channel dedicated to where we overlap. Where we unite.",
    accent: ["#E5A23A", "#2BB673"],
    imageUrl: unityUrl,
    tag: "Unity",
  },
  {
    id: "leo-season",
    title: "It\u2019s Leo season!",
    description:
      "Happy summer all you social butterflies. This channel is dedicated to Leos. Every lead, a Leo, and every Leo a lead. (le sigh)",
    accent: ["#FFB300", "#E83A1A"],
    imageUrl: leoSeasonUrl,
    tag: "It\u2019s Leo season!",
  },
];

// Short quick-pick chips — each phrase is ≤3 words so the row stays light.
const PROMPT_SUGGESTIONS = [
  "Slow-burn sci-fi",
  "Cozy rewatch",
  "Make me cry",
  "Critic favorites",
];

export function SwitchChannelsModal({
  open,
  channelTitle,
  onClose,
  onSubmitPrompt,
  onPickChannel,
}: {
  open: boolean;
  /** The row being replaced — kept for callers but not shown in the header. */
  channelTitle?: string;
  onClose: () => void;
  onSubmitPrompt?: (prompt: string) => void;
  onPickChannel?: (option: SwitchChannelOption) => void;
}) {
  void channelTitle;

  const [prompt, setPrompt] = useState("");
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

  useEffect(() => {
    if (!open) setPrompt("");
  }, [open]);

  if (!open) return null;

  function submit() {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onSubmitPrompt?.(trimmed);
    onClose();
  }

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Switch this channel"
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        backgroundColor: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
        paddingBlock: { xs: 0, md: `${tokens.space.xl}px` },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 850,
          backgroundColor: tokens.color.surfaceLow,
          borderRadius: { xs: 0, md: `${tokens.radius.md}px` },
          overflow: "hidden",
          color: tokens.color.textPrimary,
          boxShadow: tokens.shadow.lg,
        }}
      >
        <PromptHero
          prompt={prompt}
          setPrompt={setPrompt}
          inputRef={inputRef}
          onSubmit={submit}
          onClose={onClose}
        />

        <PopularChannels
          onPick={(option) => {
            onPickChannel?.(option);
            onClose();
          }}
        />
      </Box>
    </Box>
  );
}

function PromptHero({
  prompt,
  setPrompt,
  inputRef,
  onSubmit,
  onClose,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        backgroundColor: tokens.color.surfaceLow,
        paddingTop: { xs: `${tokens.space.xl}px`, md: `${tokens.space["2xl"]}px` },
        paddingBottom: `${tokens.space.lg}px`,
        paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: `${tokens.space.lg}px`,
      }}
    >
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{
          position: "absolute",
          top: tokens.space.md,
          right: tokens.space.md,
          width: 36,
          height: 36,
          backgroundColor: "rgba(20,20,20,0.7)",
          color: tokens.color.textPrimary,
          zIndex: 2,
          "&:hover": { backgroundColor: tokens.color.base },
        }}
      >
        <CloseIcon sx={{ fontSize: 22 }} />
      </IconButton>

      <ChannelsWave />

      <Typography
        sx={{
          fontSize: { xs: 30, sm: 36, md: 42 },
          lineHeight: 1.05,
          fontWeight: 800,
          color: tokens.color.textPrimary,
          letterSpacing: "-0.015em",
          textAlign: "center",
        }}
      >
        Change this channel
      </Typography>

      <Box sx={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: `${tokens.space.sm}px` }}>
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          inputRef={inputRef}
          onSubmit={onSubmit}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: `${tokens.space.xs}px`, justifyContent: "center" }}>
          {PROMPT_SUGGESTIONS.map((s) => (
            <Box
              key={s}
              component="button"
              type="button"
              onClick={() => {
                setPrompt(s);
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
              {s}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Channels Wave — 7-slat 3D wave (per design bundle Channels Animation.html).
 * Each slat is a thin slab; at 90° only the 3px edge faces the camera so the
 * row reads as seven slender vertical lines that swell into colored panels
 * as the wave passes through. Anchored at the midpoint of [75°, 105°].
 */
function ChannelsWave({
  slatWidth = 38,
  slatHeight = 88,
  slatThickness = 3,
  spacing = 14,
  durationS = 2.4,
  staggerS = 0.22,
  minAngle = 75,
  maxAngle = 105,
}: {
  slatWidth?: number;
  slatHeight?: number;
  slatThickness?: number;
  spacing?: number;
  durationS?: number;
  staggerS?: number;
  minAngle?: number;
  maxAngle?: number;
}) {
  const N = 7;
  const anchor = (minAngle + maxAngle) / 2;
  const baseStep = (anchor - minAngle) / (N - 1);
  const maxTilt = maxAngle - anchor;
  const stageW = spacing * (N - 1) + slatWidth;
  const colors = ["#FF8C00", "#E83A1A", "#FF2D82", "#C2185B", "#7B2FFF", "#3D6FFF", "#3D6FFF"];

  return (
    <Box
      aria-hidden
      sx={{
        width: `${stageW}px`,
        height: `${slatHeight}px`,
        perspective: "1400px",
        perspectiveOrigin: "50% 50%",
        position: "relative",
        "@keyframes channelsWaveTilt": {
          from: { transform: "rotateY(0deg)" },
          to: { transform: `rotateY(${maxTilt}deg)` },
        },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d" }}>
        {Array.from({ length: N }).map((_, i) => {
          const stepsFromZero = N - 1 - i;
          const base = anchor - stepsFromZero * baseStep;
          const delay = stepsFromZero * staggerS;
          const color = colors[i];
          return (
            <Box
              key={i}
              sx={{
                position: "absolute",
                top: 0,
                left: `${i * spacing}px`,
                width: `${slatWidth}px`,
                height: `${slatHeight}px`,
                transformOrigin: "100% 50%",
                transformStyle: "preserve-3d",
                transform: `rotateY(${base}deg)`,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  transformOrigin: "100% 50%",
                  transformStyle: "preserve-3d",
                  animation: `channelsWaveTilt ${durationS}s cubic-bezier(.5, 0, .5, 1) infinite alternate`,
                  animationDelay: `${delay}s`,
                  willChange: "transform",
                }}
              >
                <Box sx={{ position: "absolute", inset: 0, background: color, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)", backfaceVisibility: "hidden", transform: `translateZ(${slatThickness / 2}px)` }} />
                <Box sx={{ position: "absolute", inset: 0, background: color, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)", backfaceVisibility: "hidden", transform: `translateZ(${-slatThickness / 2}px) rotateY(180deg)` }} />
                <Box sx={{ position: "absolute", top: 0, bottom: 0, left: `${-slatThickness / 2}px`, width: `${slatThickness}px`, background: color, transform: "rotateY(-90deg)", transformOrigin: "50% 50%", backfaceVisibility: "hidden" }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function PromptInput({
  value,
  onChange,
  inputRef,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onSubmit: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const expanded = focused || value.length > 0;

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
          // Hide the textarea's scrollbar in both states — the pill should
          // read as a clean input, not a multi-line editor with chrome.
          overflow: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none", width: 0, height: 0 },
          "&::placeholder": {
            color: tokens.color.textSecondary,
            opacity: 0.95,
          },
        }}
      />

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

function PopularChannels({ onPick }: { onPick: (option: SwitchChannelOption) => void }) {
  return (
    <Box
      sx={{
        paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
        paddingBlock: `${tokens.space.lg}px`,
      }}
    >
      <Typography
        sx={{
          fontSize: 22,
          fontWeight: tokens.type.weight.semibold,
          color: tokens.color.textPrimary,
          letterSpacing: "-0.005em",
          textAlign: "center",
          marginBottom: `${tokens.space.md}px`,
        }}
      >
        Or try some of these:
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
          gap: `${tokens.space.sm}px`,
        }}
      >
        {POPULAR_CHANNELS.map((option) => (
          <ChannelOptionCard key={option.id} option={option} onPick={onPick} />
        ))}
      </Box>
    </Box>
  );
}

/**
 * Channel option card.
 *
 * Geometry is fixed — every card is aspectRatio 4/5 regardless of content.
 *
 *   At rest  → only the image + the corner badge are visible. No text, no
 *              bottom gradient. The card reads as a clean tile.
 *   On hover → image ken-burns zooms; a subtle bottom gradient fades in;
 *              the description dissolves up from the bottom edge.
 */
function ChannelOptionCard({
  option,
  onPick,
}: {
  option: SwitchChannelOption;
  onPick: (option: SwitchChannelOption) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const dur = tokens.motion.duration.focus;
  const ease = tokens.motion.easing.focus;

  const hoverScale = option.imageHoverScale ?? 1.08;
  const hoverOrigin = option.imageHoverOrigin ?? "center";
  const imageDurMs = option.imageHoverDurationMs ?? 360;

  function handleEnter() {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }

  function handleLeave() {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onPick(option)}
      onMouseEnter={option.videoUrl ? handleEnter : undefined}
      onMouseLeave={option.videoUrl ? handleLeave : undefined}
      className="channel-card"
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "4 / 5",
        // Solid base color — visible around the shrunken image on hover, and
        // becomes the content panel's bg when the panel goes opaque.
        backgroundColor: tokens.color.surfaceMid,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius.sm}px`,
        overflow: "hidden",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        padding: 0,
        textAlign: "left",
        transition: `border-color ${dur}ms ${ease}`,
        "&:hover": { borderColor: tokens.color.borderStrong },
        "&:hover .card-image-layer": {
          transform: `scale(${hoverScale})`,
        },
        "&:hover .card-content-panel": {
          opacity: 1,
        },
        "&:hover .card-extra": {
          opacity: 1,
          transform: "translateY(0)",
        },
      }}
    >
      {/* Layer 1 — image / gradient. Scales toward the top on hover. */}
      <Box
        className="card-image-layer"
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${option.accent[0]} 0%, ${option.accent[1]} 100%)`,
          transformOrigin: hoverOrigin,
          transform: "scale(1)",
          transition: `transform ${imageDurMs}ms ${ease}`,
        }}
      >
        {option.videoUrl ? (
          <Box
            component="video"
            ref={videoRef}
            src={option.videoUrl}
            // muted + playsInline are required for programmatic play() to
            // succeed across browsers (esp. Safari/iOS) without a user
            // gesture on the video element itself.
            muted
            playsInline
            preload="auto"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : option.imageUrl ? (
          <Box
            component="img"
            src={option.imageUrl}
            alt=""
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              transform: option.imageRotate ? `rotate(${option.imageRotate}deg)` : "none",
            }}
          />
        ) : null}
      </Box>

      {/* Tag — sits above the image layer at the card root so it stays a
          consistent size when the image shrinks on hover. */}
      {option.tag && (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 2,
            fontSize: 13,
            fontWeight: tokens.type.weight.semibold,
            letterSpacing: "-0.005em",
            paddingInline: "10px",
            paddingBlock: "5px",
            borderRadius: `${tokens.radius.pill}px`,
            backgroundColor: "rgba(20,20,20,0.78)",
            color: tokens.color.textPrimary,
            backdropFilter: "blur(8px)",
            whiteSpace: "nowrap",
          }}
        >
          {option.tag}
        </Box>
      )}

      {/* Layer 2 — subtle bottom gradient + description, both fade in on hover.
          No title at any state: the badge identifies the channel. */}
      <Box
        className="card-content-panel"
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          top: "55%",
          opacity: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.88) 100%)",
          transition: `opacity ${dur}ms ${ease}`,
        }}
      />

      <Box
        className="card-extra"
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingInline: `${tokens.space.sm}px`,
          paddingBottom: `${tokens.space.sm}px`,
          paddingTop: `${tokens.space.sm}px`,
          opacity: 0,
          transform: "translateY(6px)",
          transition: `opacity ${dur}ms ${ease} 60ms, transform ${dur}ms ${ease} 60ms`,
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            color: tokens.color.textPrimary,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 5,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {option.description}
        </Typography>
      </Box>
    </Box>
  );
}
