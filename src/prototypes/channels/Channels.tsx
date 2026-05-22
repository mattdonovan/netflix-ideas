import { Box, Typography, IconButton, Button, Tooltip } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import GitHubIcon from "@mui/icons-material/GitHub";
import ScienceIcon from "@mui/icons-material/Science";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import mattAvatarUrl from "@/assets/matt-avatar.png";
import channelSurfingVideoUrl from "@/assets/channel-surfing.mp4";
import thisIsTheEndUrl from "@/assets/this-is-the-end.jpg";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "@/theme/tokens";
import { TvFrame, Row, TopTenRow, Tile, NetflixWordmark } from "@/primitives";
import { useRowSizing } from "@/primitives/Row";
import type { TileBadge } from "@/primitives/Tile";
import { FocusProvider } from "@/lib/focus";
import { DetailModal, type DetailModalContent, type DetailModalSuggestion } from "./DetailModal";
import { SwitchChannelsModal, type SwitchChannelOption } from "./SwitchChannelsModal";
import { seedChannels, type Channel } from "./seedData";
import { findInCatalog, catalog, type CatalogEntry } from "@/lib/catalog";
import { summarizePromptToTitle } from "@/lib/claude";

/**
 * Top-level Channels screen.
 *
 * Web-first interaction model: mouse hover focuses tiles, click also
 * focuses (Netflix's actual web behavior); keyboard / TV remote are a
 * supported backup. The PromptPanel modal opens only from the row-level
 * AI magic icon or the 'T' shortcut — never from a tile.
 */

export function Channels() {
  return (
    <FocusProvider>
      <TvFrame>
        <ChannelsContent />
      </TvFrame>
    </FocusProvider>
  );
}

/**
 * Per-row override applied after a user picks a new channel from the
 * SwitchChannels modal.
 *
 * Two sources, two timings:
 * - `curated` — picked from the modal's grid. Title is set instantly. The
 *   row sits in `loading` for ~3s, then flips to `ended` (End-of-prototype
 *   card in slot 0).
 * - `prompt`  — typed into the AI input. While Claude reformats the prompt
 *   into a 3-5 word title, the row's title cycles through fun "thinking"
 *   messages via a scramble animation. When Claude returns, the title
 *   scrambles to the real result and the row flips to `ended` 800ms later.
 *
 * Either way, clicking any skeleton or the End card resets the row.
 */
type RowOverride = {
  phase: "loading" | "ended";
  option: SwitchChannelOption;
  source: "curated" | "prompt";
};

const LOADING_TO_ENDED_MS = 3000;
// Time between the AI-returned title landing and the End-of-prototype card
// surfacing. The pause lets the user actually read the title before the row
// terminates.
const PROMPT_TITLE_HOLD_MS = 800;
// Cadence at which the prompt-flow cycles through loading messages while
// Claude is in flight. One message lifetime = scramble-in (~600ms) +
// hold (~500ms).
const PROMPT_CYCLE_MS = 1100;
// Minimum time the cycling-messages phase runs before the AI title is
// revealed. The scramble animation is the *point* of this flow — it
// communicates that AI is doing work. Haiku usually returns in 1–2s, which
// is too fast to see the animation breathe. We deliberately hold the
// thinking phase so the user sees several messages cycle through before the
// real title lands. Total loading ≈ MIN_THINKING_MS + PROMPT_TITLE_HOLD_MS.
const MIN_THINKING_MS = 6500;

/**
 * Loading messages cycled through the row title while the AI call is in
 * flight. Kept varied so repeat submissions don't feel rote — each prompt
 * picks 3-4 of these at random with no repeats inside a single cycle.
 */
const LOADING_MESSAGES = [
  "Mind-melding",
  "Synthesizing",
  "Popping popcorn",
  "Tuning antennas",
  "Reading the room",
  "Sniffing out vibes",
  "Polishing lenses",
  "Cross-referencing",
  "Asking the algorithm",
  "Decoding intent",
  "Consulting the void",
  "Triangulating taste",
  "Reticulating splines",
  "Untangling threads",
  "Brewing the row",
  "Channel surfing",
  "Calibrating mood",
  "Whispering to ranker",
  "Cueing the projector",
  "Pacing the lobby",
];

function pickLoadingMessages(): string[] {
  // 5 or 6 messages — at PROMPT_CYCLE_MS=1100 and MIN_THINKING_MS=6500 the
  // user sees ~6 cycles, so we want enough variety to (mostly) avoid repeats
  // inside a single submission while still feeling spontaneous across runs.
  const count = 5 + Math.floor(Math.random() * 2);
  const pool = [...LOADING_MESSAGES];
  const out: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

function ChannelsContent() {
  const [channels] = useState<Channel[]>(seedChannels);
  const [detail, setDetail] = useState<DetailModalContent | null>(null);
  const [switchTarget, setSwitchTarget] = useState<Channel | null>(null);
  const [rowOverrides, setRowOverrides] = useState<Record<string, RowOverride>>({});
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  // Per-row loading→ended timers. Tracked so we can cancel if the row is
  // reset (skeleton clicked) before the timer fires, or replaced by a new
  // switch before the previous one resolves.
  const phaseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Per-row prompt-cycle intervals. Tracked separately so prompt submits
  // can stop cycling messages without disturbing the phase timer.
  const cycleTimersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    return () => {
      Object.values(phaseTimersRef.current).forEach(clearTimeout);
      Object.values(cycleTimersRef.current).forEach(clearInterval);
      phaseTimersRef.current = {};
      cycleTimersRef.current = {};
    };
  }, []);

  function clearRowTimers(channelId: string) {
    const t = phaseTimersRef.current[channelId];
    if (t) {
      clearTimeout(t);
      delete phaseTimersRef.current[channelId];
    }
    const c = cycleTimersRef.current[channelId];
    if (c) {
      clearInterval(c);
      delete cycleTimersRef.current[channelId];
    }
  }

  function scheduleEndPhase(channelId: string, optionId: string, delayMs: number) {
    const existing = phaseTimersRef.current[channelId];
    if (existing) clearTimeout(existing);
    phaseTimersRef.current[channelId] = setTimeout(() => {
      delete phaseTimersRef.current[channelId];
      setRowOverrides((prev) => {
        const current = prev[channelId];
        // Only promote if the override still exists and still belongs to the
        // same option that scheduled this timer.
        if (!current || current.option.id !== optionId) return prev;
        if (current.phase === "ended") return prev;
        return { ...prev, [channelId]: { ...current, phase: "ended" } };
      });
    }, delayMs);
  }

  function handlePickChannel(option: SwitchChannelOption) {
    if (!switchTarget) return;
    const channelId = switchTarget.id;
    clearRowTimers(channelId);
    setRowOverrides((prev) => ({
      ...prev,
      [channelId]: { phase: "loading", option, source: "curated" },
    }));
    scheduleEndPhase(channelId, option.id, LOADING_TO_ENDED_MS);
  }

  // Free-text prompts from the modal's AI input run a different flow than
  // curated picks: the title cycles through fun "thinking" messages while
  // Claude reformats the prompt into a 3-5 word title; once that lands the
  // row holds for PROMPT_TITLE_HOLD_MS before flipping to `ended`.
  function handleSubmitPrompt(prompt: string) {
    if (!switchTarget) return;
    const channelId = switchTarget.id;
    const optionId = `prompt-${Date.now()}`;
    const messageQueue = pickLoadingMessages();

    clearRowTimers(channelId);

    const option: SwitchChannelOption = {
      id: optionId,
      title: messageQueue[0],
      description: prompt,
      accent: ["#FF8C00", "#7B2FFF"],
    };

    setRowOverrides((prev) => ({
      ...prev,
      [channelId]: { phase: "loading", option, source: "prompt" },
    }));

    // Cycle through the message queue while the AI call is in flight.
    let messageIndex = 0;
    cycleTimersRef.current[channelId] = setInterval(() => {
      messageIndex = (messageIndex + 1) % messageQueue.length;
      setRowOverrides((prev) => {
        const current = prev[channelId];
        if (!current || current.option.id !== optionId) return prev;
        if (current.phase !== "loading") return prev;
        return {
          ...prev,
          [channelId]: {
            ...current,
            option: { ...current.option, title: messageQueue[messageIndex] },
          },
        };
      });
    }, PROMPT_CYCLE_MS);

    // Kick off the AI rename in parallel with a minimum-thinking timer. The
    // scramble animation only reads as "AI working" if it gets to breathe —
    // Haiku usually returns in 1–2s, so we floor the cycling phase to
    // MIN_THINKING_MS. On both resolution + min-elapsed, stop the cycle,
    // swap to the final title, and schedule the end-phase flip.
    const aiPromise = summarizePromptToTitle(prompt);
    const minDelay = new Promise<void>((resolve) =>
      setTimeout(resolve, MIN_THINKING_MS),
    );
    Promise.all([aiPromise, minDelay]).then(([finalTitle]) => {
      const interval = cycleTimersRef.current[channelId];
      if (interval) {
        clearInterval(interval);
        delete cycleTimersRef.current[channelId];
      }
      setRowOverrides((prev) => {
        const current = prev[channelId];
        if (!current || current.option.id !== optionId) return prev;
        return {
          ...prev,
          [channelId]: {
            ...current,
            option: { ...current.option, title: finalTitle },
          },
        };
      });
      scheduleEndPhase(channelId, optionId, PROMPT_TITLE_HOLD_MS);
    });
  }

  function handleSkeletonClick(channelId: string) {
    setEndModalOpen(true);
    clearRowTimers(channelId);
    setRowOverrides((prev) => {
      if (!prev[channelId]) return prev;
      const { [channelId]: _, ...rest } = prev;
      return rest;
    });
  }

  return (
    <>
      <Hero onAboutClick={() => setAboutOpen(true)} />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          // Inter-row gap creates the grouping asymmetry: each row title is
          // ~24px from its own carousel (title.mb=8 + reel paddingBlock=16),
          // and ~32px from the *previous* row's image (paddingBlock=16 +
          // gap=16). Label-to-row is one spacing step closer than row-to-row,
          // signalling that each title belongs to the row beneath it.
          gap: `${tokens.space.sm}px`,
          // Pull the row stack up so the first row's title sits over the
          // bottom of the hero backdrop — matches Netflix's layered handoff
          // where the title row appears to belong to the hero band.
          marginTop: { xs: `-${tokens.space.xl}px`, md: `-${tokens.space["2xl"]}px` },
          position: "relative",
          zIndex: 1,
        }}
      >
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            override={rowOverrides[channel.id]}
            onTileSelect={(content) => setDetail(content)}
            onRequestSwitch={() => setSwitchTarget(channel)}
            onSkeletonClick={() => handleSkeletonClick(channel.id)}
          />
        ))}
      </Box>

      <Footer />

      <DetailModal open={!!detail} content={detail} onClose={() => setDetail(null)} />
      <SwitchChannelsModal
        open={!!switchTarget}
        channelTitle={switchTarget?.category.title}
        onClose={() => setSwitchTarget(null)}
        onPickChannel={handlePickChannel}
        onSubmitPrompt={handleSubmitPrompt}
      />
      <EndOfPrototypeModal open={endModalOpen} onClose={() => setEndModalOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}

/**
 * Header — Figma 94-3312. Wordmark + nav + (search · bell · avatar).
 * Nav collapses on narrow viewports per Netflix's responsive behavior.
 */
function Header() {
  const navItems = [
    { label: "Home", active: true },
    { label: "Shows" },
    { label: "Movies" },
    { label: "Games" },
    { label: "New & Popular" },
    { label: "My List" },
    { label: "Browse by Languages" },
  ];
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        // Wordmark + nav items are left-aligned; the utilities cluster
        // (search · bell · avatar) is pushed to the viewport's right edge
        // via the left group's `flex: 1` below.
        justifyContent: "space-between",
        minHeight: 70,
        gap: `${tokens.space.lg}px`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.sm + 20}px`, minWidth: 0, flex: 1 }}>
        <Tooltip title="Go Home" placement="bottom" arrow>
          <Box
            component={RouterLink}
            to="/"
            aria-label="Go Home"
            sx={{ display: "inline-flex", alignItems: "center", color: "inherit", textDecoration: "none" }}
          >
            <NetflixWordmark height={28} />
          </Box>
        </Tooltip>
        <Box
          component="nav"
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: { md: `${tokens.space.sm}px`, lg: `${tokens.space.md}px` },
            flexWrap: "nowrap",
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {navItems.map((item) => (
            <Typography
              key={item.label}
              sx={{
                fontSize: { md: 12, lg: 14, xl: 16 },
                // All links are white; the active link is differentiated by
                // weight only (semibold vs regular).
                fontWeight: item.active ? tokens.type.weight.semibold : tokens.type.weight.regular,
                color: tokens.color.textPrimary,
                letterSpacing: 0,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
        <IconButton
          aria-label="Search"
          sx={{
            color: tokens.color.textPrimary,
            "&:hover": { backgroundColor: tokens.color.surfaceMid },
          }}
        >
          <SearchIcon sx={{ fontSize: 22 }} />
        </IconButton>
        <Box sx={{ position: "relative" }}>
          <IconButton
            aria-label="Notifications"
            sx={{
              color: tokens.color.textPrimary,
              "&:hover": { backgroundColor: tokens.color.surfaceMid },
            }}
          >
            <NotificationsNoneIcon sx={{ fontSize: 22 }} />
          </IconButton>
          <Box
            sx={{
              position: "absolute",
              top: 6,
              right: 4,
              minWidth: 16,
              height: 16,
              paddingInline: "4px",
              borderRadius: "8px",
              backgroundColor: tokens.color.brand,
              color: tokens.color.textPrimary,
              fontSize: 10,
              fontWeight: tokens.type.weight.bold,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
            }}
          >
            7
          </Box>
        </Box>
        <ProfileMenu />
      </Box>
    </Box>
  );
}

/**
 * Avatar + profile dropdown. Quotes the Netflix avatar-menu position (top-right
 * of the header) but the card itself is a "made by" credit for this prototype:
 * a portrait, role, short bio, and links out to the author's site, repo, and
 * the experiments landing page.
 */
export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on click-outside and on Escape so the menu behaves like a real popover.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <Box ref={wrapperRef} sx={{ position: "relative", marginLeft: `${tokens.space.sm}px` }}>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: 0,
          border: 0,
          background: "transparent",
          cursor: "pointer",
          color: tokens.color.textPrimary,
          "&:hover .avatar-chevron, &[aria-expanded='true'] .avatar-chevron": {
            transform: "rotate(180deg)",
          },
        }}
      >
        <Box
          component="img"
          src={mattAvatarUrl}
          alt="Matt Donovan"
          sx={{
            width: 32,
            height: 32,
            borderRadius: `${tokens.radius.sm}px`,
            objectFit: "cover",
            display: "block",
          }}
        />
        <ArrowDropDownIcon
          className="avatar-chevron"
          sx={{
            color: tokens.color.textPrimary,
            transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
          }}
        />
      </Box>

      {open && <ProfileCard onClose={() => setOpen(false)} />}
    </Box>
  );
}

export function ProfileCard({ onClose, align = "right" }: { onClose: () => void; align?: "right" | "center" }) {
  const links: Array<{
    href?: string;
    to?: string;
    label: string;
    sub: string;
    icon: ReactNode;
    external?: boolean;
  }> = [
    {
      href: "https://mattdonovan.me",
      label: "mattdonovan.me",
      sub: "Portfolio & contact",
      icon: <OpenInNewIcon sx={{ fontSize: 16 }} />,
      external: true,
    },
    {
      href: "https://github.com/mattdonovan/netflix-ideas",
      label: "GitHub repo",
      sub: "Source for this prototype",
      icon: <GitHubIcon sx={{ fontSize: 16 }} />,
      external: true,
    },
    {
      to: "/",
      label: "More experiments",
      sub: "Back to the landing page",
      icon: <ScienceIcon sx={{ fontSize: 16 }} />,
    },
  ];

  const isCenter = align === "center";
  return (
    <Box
      role="menu"
      sx={{
        position: "absolute",
        top: "calc(100% + 14px)",
        right: isCenter ? "auto" : 0,
        left: isCenter ? "50%" : "auto",
        transform: isCenter ? "translateX(-50%)" : "none",
        width: 300,
        backgroundColor: tokens.color.surfaceMid,
        border: `1px solid ${tokens.color.borderStrong}`,
        borderRadius: `${tokens.radius.md}px`,
        boxShadow: tokens.shadow.lg,
        padding: `${tokens.space.sm}px`,
        zIndex: 1000,
        // Small caret pointing back up at the avatar.
        "&::before": {
          content: '""',
          position: "absolute",
          top: -7,
          right: isCenter ? "auto" : 12,
          left: isCenter ? "50%" : "auto",
          width: 12,
          height: 12,
          backgroundColor: tokens.color.surfaceMid,
          borderTop: `1px solid ${tokens.color.borderStrong}`,
          borderLeft: `1px solid ${tokens.color.borderStrong}`,
          transform: isCenter ? "translateX(-50%) rotate(45deg)" : "rotate(45deg)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.sm}px`, padding: `${tokens.space.xs}px` }}>
        <Box
          component="img"
          src={mattAvatarUrl}
          alt="Matt Donovan"
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: tokens.type.weight.semibold, color: tokens.color.textPrimary, lineHeight: 1.2 }}>
            Matt Donovan
          </Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary, lineHeight: 1.3, mt: "2px" }}>
            Product Designer · Expert design help for startups and small teams
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: 1, backgroundColor: tokens.color.border, marginBlock: `${tokens.space.xs}px` }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {links.map((link) => {
          const inner = (
            <Box
              role="menuitem"
              onClick={onClose}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: `${tokens.space.sm}px`,
                paddingInline: `${tokens.space.xs}px`,
                paddingBlock: "10px",
                borderRadius: `${tokens.radius.sm}px`,
                cursor: "pointer",
                color: tokens.color.textPrimary,
                textDecoration: "none",
                transition: `background-color ${tokens.motion.duration.press}ms ${tokens.motion.easing.press}`,
                "&:hover": { backgroundColor: tokens.color.surfaceHigh },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", color: tokens.color.textSecondary }}>{link.icon}</Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: tokens.type.weight.semibold, lineHeight: 1.2 }}>
                  {link.label}
                </Typography>
                <Typography sx={{ fontSize: 11, color: tokens.color.textTertiary, lineHeight: 1.3, mt: "1px" }}>
                  {link.sub}
                </Typography>
              </Box>
            </Box>
          );
          if (link.external && link.href) {
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {inner}
              </a>
            );
          }
          if (link.to) {
            return (
              <RouterLink
                key={link.label}
                to={link.to}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {inner}
              </RouterLink>
            );
          }
          return null;
        })}
      </Box>
    </Box>
  );
}

/**
 * Billboard hero. The Netflix backdrop is replaced with the channel-surfing
 * promo video: it sits idle on the first frame until the cursor lands inside
 * the hero, then plays through (muted, looped, no controls) and keeps
 * playing after the mouse leaves. The `hasPlayed` flag guards against
 * re-triggering on every re-enter, so the playback feels continuous.
 */
function Hero({ onAboutClick }: { onAboutClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasPlayedRef = useRef(false);

  function handleEnter() {
    if (hasPlayedRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    const result = v.play();
    if (result && typeof result.then === "function") {
      result.then(() => { hasPlayedRef.current = true; }).catch(() => {});
    } else {
      hasPlayedRef.current = true;
    }
  }

  // Click anywhere on the hero toggles playback. The More Info button stops
  // propagation so its own click doesn't also pause the video.
  function toggleVideo() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => { hasPlayedRef.current = true; }).catch(() => {});
    } else {
      v.pause();
    }
  }

  return (
    <Box
      onMouseEnter={handleEnter}
      onClick={toggleVideo}
      sx={{
        position: "relative",
        height: "clamp(240px, calc(56vw - 120px), 600px)",
        // Hero is full-bleed: escape the TvFrame's horizontal padding so the
        // backdrop runs to the viewport edges. The rows below also run full
        // bleed and layer up over the hero's bottom band. The negative
        // marginTop pulls the hero up under the TvFrame's top padding so the
        // floating header overlay can sit flush against the viewport edge
        // and the backdrop image extends behind it.
        marginInline: {
          xs: `-${tokens.space.md}px`,
          md: `-${tokens.space.lg}px`,
          lg: `-${tokens.space.xl}px`,
        },
        marginTop: {
          xs: `-${tokens.space.md}px`,
          md: `-${tokens.space.lg}px`,
        },
        backgroundColor: tokens.color.surfaceLow,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        src={channelSurfingVideoUrl}
        muted
        loop
        playsInline
        preload="metadata"
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 30%",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 18%),
            linear-gradient(90deg, rgba(11,11,11,0.85) 0%, rgba(11,11,11,0.5) 35%, rgba(11,11,11,0) 70%),
            linear-gradient(0deg, ${tokens.color.base} 0%, rgba(11,11,11,0.2) 30%, rgba(11,11,11,0) 60%)
          `,
        }}
      />

      {/* Floating header overlay — transparent background, padded to match
          TvFrame's safe-zone so the wordmark + nav line up with row titles
          and CTAs below. zIndex above the gradient so the avatar/bell
          remain readable over dark backdrops. */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingInline: {
            xs: `${tokens.space.md}px`,
            md: `${tokens.space.lg}px`,
            lg: `${tokens.space.xl}px`,
          },
        }}
      >
        <Header />
      </Box>

      {/*
        Hero contents — all fluid via clamp() so the title, label, CTAs and
        side badge grow/shrink continuously with viewport width instead of
        jumping at MUI breakpoints. Each clamp uses the same vw-multiplier
        family (~roughly 1.6vw → 4.4vw) so the elements stay in proportion.
      */}
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingInline: "clamp(24px, 3.2vw, 48px)",
          paddingTop: "clamp(24px, 3.2vw, 48px)",
          paddingBottom: "clamp(56px, 6.5vw, 96px)",
          maxWidth: { xs: "100%", md: "60%", lg: "50%" },
        }}
      >
        {/*
          Mobile collapses the icon-above-title stack into a single inline
          row: ~1/3-size icon next to a ~half-size title. From sm up, the
          original Netflix-billboard treatment returns (full-size icon
          stacked above the h1).
        */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", sm: "column" },
            alignItems: { xs: "center", sm: "flex-start" },
            gap: { xs: "8px", sm: 0 },
            mb: "clamp(20px, 2.2vw, 32px)",
          }}
        >
          <Box
            sx={{
              color: tokens.color.textPrimary,
              mb: { xs: 0, sm: "clamp(8px, 1vw, 14px)" },
              filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.55))",
              display: { xs: "inline-flex", sm: "none" },
            }}
          >
            <ChannelBarsIcon size={21} />
          </Box>
          <Box
            sx={{
              color: tokens.color.textPrimary,
              mb: { xs: 0, sm: "clamp(8px, 1vw, 14px)" },
              filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.55))",
              display: { xs: "none", sm: "inline-flex" },
            }}
          >
            <ChannelBarsIcon size={64} />
          </Box>

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 20, sm: "clamp(40px, 6.4vw, 88px)" },
              lineHeight: 1,
              color: tokens.color.textPrimary,
              fontWeight: tokens.type.weight.bold,
              letterSpacing: "-0.02em",
              textShadow: "0 4px 24px rgba(0,0,0,0.55)",
            }}
          >
            Switch Channels
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "clamp(8px, 1vw, 16px)" }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAboutClick();
            }}
            startIcon={<InfoOutlinedIcon sx={{ fontSize: "clamp(16px, 1.8vw, 22px)" }} />}
            sx={{
              backgroundColor: "rgba(109, 109, 110, 0.7)",
              color: tokens.color.textPrimary,
              fontSize: "clamp(12px, 1.2vw, 15px)",
              fontWeight: tokens.type.weight.bold,
              paddingInline: "clamp(14px, 2vw, 26px)",
              paddingBlock: 0,
              minHeight: "clamp(28px, 3vw, 38px)",
              borderRadius: `${tokens.radius.sm}px`,
              "&:hover": { backgroundColor: "rgba(109, 109, 110, 0.85)" },
            }}
          >
            Prototype Info
          </Button>
        </Box>
      </Box>

      {/*
        TV-NERD rating. Pinned to the viewport's right edge (right: 0) so
        the badge butts right up against the screen, in the spirit of the
        Netflix maturity-rating chip but tipping a wink that this surface
        is for design-curious viewers, not a general audience.
      */}
      <Box
        sx={{
          position: "absolute",
          right: 0,
          bottom: "clamp(56px, 6.5vw, 96px)",
          paddingInline: "clamp(10px, 1.2vw, 16px)",
          paddingBlock: "clamp(2px, 0.3vw, 5px)",
          borderLeft: `4px solid ${tokens.color.textPrimary}`,
          backgroundColor: "rgba(51,51,51,0.6)",
          color: tokens.color.textPrimary,
          fontSize: "clamp(10px, 1.05vw, 14px)",
          fontWeight: tokens.type.weight.semibold,
          letterSpacing: "0.04em",
          pointerEvents: "none",
        }}
      >
        TV-NERD
      </Box>
    </Box>
  );
}

/**
 * Page footer — quotes Netflix's actual home footer: a row of four social
 * icons, four columns of muted links, and the copyright line. Sits at the
 * bottom of the page on the same dark surface as the rest of Channels.
 */
function Footer() {
  const columns: string[][] = [
    ["Audio Description", "Investor Relations", "Privacy", "Contact Us"],
    ["Help Center", "Jobs", "Legal Notices", "Do Not Sell or Share My Personal Information"],
    ["Gift Cards", "Netflix Shop", "Cookie Preferences", "Ad Choices"],
    ["Media Center", "Terms of Use", "Corporate Information"],
  ];
  const socials = [
    { Icon: FacebookIcon, label: "Facebook" },
    { Icon: InstagramIcon, label: "Instagram" },
    { Icon: TwitterIcon, label: "Twitter" },
    { Icon: YouTubeIcon, label: "YouTube" },
  ];
  return (
    <Box
      component="footer"
      sx={{
        // Footer sits below the rows on the same page surface; add generous
        // top padding so it doesn't crowd the last row's hover bloom.
        marginTop: `${tokens.space["2xl"]}px`,
        paddingBottom: `${tokens.space.xl}px`,
        color: tokens.color.textSecondary,
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${tokens.space.md}px`,
          mb: `${tokens.space.md}px`,
        }}
      >
        {socials.map(({ Icon, label }) => (
          <IconButton
            key={label}
            aria-label={label}
            sx={{
              padding: 0,
              color: tokens.color.textPrimary,
              "&:hover": { color: tokens.color.textSecondary, backgroundColor: "transparent" },
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </IconButton>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          columnGap: `${tokens.space.md}px`,
          rowGap: `${tokens.space.xs}px`,
          mb: `${tokens.space.md}px`,
        }}
      >
        {columns.map((col, ci) => (
          <Box key={ci} sx={{ display: "flex", flexDirection: "column", gap: `${tokens.space.xs}px` }}>
            {col.map((link) => (
              <Typography
                key={link}
                component="a"
                href="#"
                sx={{
                  fontSize: 13,
                  color: tokens.color.textSecondary,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  textDecorationColor: "rgba(168,168,168,0.4)",
                  cursor: "pointer",
                  "&:hover": { color: tokens.color.textPrimary },
                }}
              >
                {link}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>

      <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary }}>
        © 1997-{new Date().getFullYear()} Netflix, Inc.
      </Typography>
    </Box>
  );
}

/**
 * Target tiles per row. Non-Top-10 rows pad up to this count by cycling
 * through the channel's exemplars — gives the carousel something to actually
 * page through. Top 10 is fixed at 10 by definition.
 */
const TARGET_TILE_COUNT = 12;

const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&";

/**
 * Per-character scramble-in animation. Each character resolves to its final
 * value at a staggered threshold so the title reveals left-to-right while the
 * unresolved tail flickers through random glyphs. Used to dress the title
 * swaps during the prompt-driven switch flow: each new "thinking" message and
 * the final AI-returned title scramble in instead of cutting.
 */
function ScrambleText({
  target,
  durationMs = 600,
}: {
  target: string;
  durationMs?: number;
}) {
  const [displayed, setDisplayed] = useState(target);
  const displayedRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    displayedRef.current = displayed;
  }, [displayed]);

  useEffect(() => {
    const to = target;
    if (displayedRef.current === to) return;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      const len = to.length;
      const out: string[] = [];
      for (let i = 0; i < len; i++) {
        const ch = to[i];
        const threshold = (i + 1) / (len + 1);
        if (ch === " " || t >= threshold) {
          out.push(ch);
        } else {
          out.push(SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]);
        }
      }
      setDisplayed(out.join(""));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(to);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return <>{displayed}</>;
}

function ChannelRow({
  channel,
  override,
  onTileSelect,
  onRequestSwitch,
  onSkeletonClick,
}: {
  channel: Channel;
  override?: RowOverride;
  onTileSelect: (content: DetailModalContent) => void;
  onRequestSwitch: () => void;
  onSkeletonClick: () => void;
}) {
  const sectionId = `channel-${channel.id}`;
  const isTopTen = channel.id === "top-10-tv-us";
  const sourceTiles = channel.category.exemplars;
  const tiles = isTopTen
    ? sourceTiles.slice(0, 10)
    : Array.from({ length: TARGET_TILE_COUNT }, (_, i) => sourceTiles[i % sourceTiles.length]);

  function selectTile(exemplar: { title: string; year?: number }, i: number) {
    const entry = findInCatalog(exemplar.title, exemplar.year);
    onTileSelect(buildDetailContent({ entry, fallbackTitle: exemplar.title, channel, rank: isTopTen ? i + 1 : undefined }));
  }

  // When the row has been switched, replace its label/icon/contents with the
  // override option's identity. The channel-bar icon spins only during the
  // loading phase; once the End card surfaces, it stops to signal arrival.
  const displayTitle = override ? override.option.title : channel.category.title;
  const leadingIcon = <ChannelBarsIcon spinning={override?.phase === "loading"} />;
  // Prompt-driven switches scramble each title change (cycling "thinking"
  // messages and the final AI-returned title). Curated picks change the
  // title exactly once and don't need the animation.
  const titleNode: ReactNode =
    override?.source === "prompt" ? <ScrambleText target={displayTitle} /> : displayTitle;

  if (override) {
    // After a row is switched, drop its original layout (Top 10 numerals etc.).
    // During loading the whole row is skeletons; after ~3s the first slot
    // resolves to the End-of-prototype card. Clicking either surfaces the
    // modal and resets the row.
    const slotCount = TARGET_TILE_COUNT;
    const isEnded = override.phase === "ended";
    return (
      <Row
        sectionId={sectionId}
        itemCount={slotCount}
        title={titleNode}
        leadingIcon={leadingIcon}
        onTitleClick={onRequestSwitch}
        itemsPerView={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
      >
        {Array.from({ length: slotCount }).map((_, i) =>
          isEnded && i === 0 ? (
            <EndOfPrototypeTile key="end" onClick={onSkeletonClick} />
          ) : (
            <SkeletonTile key={i} aspect="boxart" onClick={onSkeletonClick} />
          ),
        )}
      </Row>
    );
  }

  if (isTopTen) {
    return (
      <TopTenRow
        sectionId={sectionId}
        itemCount={tiles.length}
        title={displayTitle}
        leadingIcon={leadingIcon}
        hoverHint={<ShuffleIcon sx={{ fontSize: 16 }} />}
        onTitleClick={onRequestSwitch}
        // Match Row.tsx's perView so Top 10 columns line up vertically with
        // the boxart cards in adjacent rows — the Netflix homepage rule.
        itemsPerView={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
      >
        {tiles.map((ex, i) => {
          const catalogEntry = findInCatalog(ex.title, ex.year);
          return (
            <ChannelTile
              key={ex.title + i}
              index={i}
              title={ex.title}
              color={channel.tilePalette[i % channel.tilePalette.length]}
              artworkUrl={catalogEntry?.posterUrl ?? undefined}
              expandedArtworkUrl={catalogEntry?.backdropUrl ?? undefined}
              expandsToLandscape
              fillHeight
              badge={undefined}
              moodTags={channel.category.tone.slice(0, 3)}
              aspect="poster"
              onSelect={() => selectTile(ex, i)}
            />
          );
        })}
      </TopTenRow>
    );
  }

  return (
    <Row
      sectionId={sectionId}
      itemCount={tiles.length}
      title={displayTitle}
      leadingIcon={leadingIcon}
      hoverHint={<ShuffleIcon sx={{ fontSize: 16 }} />}
      onTitleClick={onRequestSwitch}
      itemsPerView={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
    >
      {tiles.map((ex, i) => (
        <ChannelTile
          key={ex.title + i}
          index={i}
          title={ex.title}
          color={channel.tilePalette[i % channel.tilePalette.length]}
          artworkUrl={findInCatalog(ex.title, ex.year)?.backdropUrl ?? undefined}
          badge={badgeForChannel(channel.id, i, tiles.length)}
          moodTags={channel.category.tone.slice(0, 3)}
          aspect="boxart"
          onSelect={() => selectTile(ex, i)}
        />
      ))}
    </Row>
  );
}

/**
 * Placeholder card shown after a row is switched-out. Mirrors the resting
 * tile geometry so the row's height doesn't jump. A shimmer animation
 * conveys activity. Clicking any skeleton ends the prototype — there's
 * nothing real to load beyond this point.
 */
function SkeletonTile({
  aspect,
  onClick,
}: {
  aspect: "boxart" | "poster";
  onClick: () => void;
}) {
  const restAspect = aspect === "boxart" ? "16 / 9" : "2 / 3";
  // Width comes from Row's `& > *` rule (cardW). We only set the aspect ratio,
  // matching how the responsive Tile primitive sizes itself in the same row.
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label="End of prototype"
      sx={{
        aspectRatio: restAspect,
        flexShrink: 0,
        borderRadius: `${tokens.radius.sm}px`,
        backgroundColor: tokens.color.surfaceMid,
        position: "relative",
        overflow: "hidden",
        padding: 0,
        border: 0,
        cursor: "pointer",
        color: "inherit",
        font: "inherit",
        "@keyframes channelSkeletonShimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
          animation: "channelSkeletonShimmer 1.2s linear infinite",
        },
      }}
    />
  );
}

/**
 * End-of-prototype card. Drops into the first slot of a switched row once the
 * 3s skeleton loading window elapses. Matches the boxart aspect of the
 * surrounding skeletons so the row height stays put, and carries a small
 * white badge so the user can read it as a deliberate card and not another
 * placeholder. Clicking it fires the same handler as the skeletons: open the
 * end-of-prototype modal and reset the row.
 */
function EndOfPrototypeTile({ onClick }: { onClick: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label="End of prototype"
      sx={{
        aspectRatio: "16 / 9",
        flexShrink: 0,
        borderRadius: `${tokens.radius.sm}px`,
        position: "relative",
        overflow: "hidden",
        padding: 0,
        border: 0,
        cursor: "pointer",
        color: "inherit",
        font: "inherit",
        backgroundColor: tokens.color.surfaceMid,
        backgroundImage: `url(${thisIsTheEndUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "block",
        transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        "&:hover, &:focus-visible": {
          outline: "none",
          transform: "scale(1.02)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 10,
          bottom: 10,
          paddingInline: "8px",
          paddingBlock: "3px",
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.92)",
          color: tokens.color.base,
          fontSize: 10,
          fontWeight: tokens.type.weight.bold,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          zIndex: 1,
        }}
      >
        End of Prototype
      </Box>
    </Box>
  );
}

/**
 * Final-state modal: tells the user the prototype ends here, with an Esc
 * affordance and a close button. Centered overlay matching the surrounding
 * modal language.
 */
function EndOfPrototypeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="End of prototype"
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        backgroundColor: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingInline: `${tokens.space.lg}px`,
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          backgroundColor: tokens.color.surfaceLow,
          borderRadius: `${tokens.radius.md}px`,
          color: tokens.color.textPrimary,
          boxShadow: tokens.shadow.lg,
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: tokens.space.sm,
            right: tokens.space.sm,
            width: 32,
            height: 32,
            backgroundColor: "rgba(20,20,20,0.7)",
            color: tokens.color.textPrimary,
            zIndex: 2,
            "&:hover": { backgroundColor: tokens.color.base },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Box
          component="img"
          src={thisIsTheEndUrl}
          alt=""
          sx={{
            width: "100%",
            aspectRatio: "16 / 9",
            objectFit: "cover",
            display: "block",
          }}
        />
        <Box
          sx={{
            paddingInline: `${tokens.space.xl}px`,
            paddingTop: `${tokens.space.lg}px`,
            paddingBottom: `${tokens.space.lg}px`,
          }}
        >
          <Typography
            sx={{
              fontSize: 26,
              fontWeight: tokens.type.weight.bold,
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
              marginBottom: `${tokens.space.sm}px`,
            }}
          >
            This is the end of the prototype…
          </Typography>
          <Typography
            sx={{ fontSize: 14, color: tokens.color.textSecondary, lineHeight: 1.5 }}
          >
            …for now.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * About-this-project modal. Fires from the hero's "More Info" button. Same
 * centered-overlay language as DetailModal / SwitchChannelsModal / IdeaHopperModal.
 */
function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="About this project"
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        backgroundColor: "rgba(0,0,0,0.78)",
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
          maxWidth: 620,
          backgroundColor: tokens.color.surfaceLow,
          borderRadius: { xs: 0, md: `${tokens.radius.md}px` },
          color: tokens.color.textPrimary,
          boxShadow: tokens.shadow.lg,
          paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
          paddingTop: { xs: `${tokens.space.xl}px`, md: `${tokens.space["2xl"]}px` },
          paddingBottom: `${tokens.space.xl}px`,
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
            "&:hover": { backgroundColor: tokens.color.base },
          }}
        >
          <CloseIcon sx={{ fontSize: 22 }} />
        </IconButton>

        <Typography
          sx={{
            fontSize: tokens.type.scale.micro.size,
            color: tokens.color.accent,
            letterSpacing: tokens.type.scale.micro.letterSpacing,
            textTransform: "uppercase",
            fontWeight: tokens.type.weight.semibold,
            marginBottom: "8px",
          }}
        >
          Prototype info
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: 28, md: 34 },
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            fontWeight: tokens.type.weight.bold,
            marginBottom: `${tokens.space.md}px`,
          }}
        >
          Three nights and a Figma MCP server.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: `${tokens.space.sm}px` }}>
          <AboutSectionLabel>How it started</AboutSectionLabel>
          <AboutParagraph>
            This started as an excuse to play with Figma's MCP server. I pulled in Ivanna Jeraskina's Netflix design system from the Figma community, pointed Claude at it, and was moving in an hour. From there I just kept going.
          </AboutParagraph>
          <AboutParagraph>
            The next three nights became a small obsession. Match the hero. Match the row scroll. Match the card pop. Match the badges. The point wasn't to ship a clone. It was to see how close I could get to the real surface using my own pile of tools.
          </AboutParagraph>
          <AboutParagraph>
            It turned out to be the perfect overlap of what I do and what I'm interested in right now. Design systems. AI as a building partner. Real surfaces that respond. I'd be lying if I said it wasn't fun.
          </AboutParagraph>

          <AboutSectionLabel>How to use it</AboutSectionLabel>
          <AboutParagraph>
            Click any row title to switch the channel. The modal that opens lets you type a custom prompt or pick a curated channel. Either way, the row reshapes itself around that new identity. Skeleton tiles load in. Clicking any one of them takes you to the end of the prototype.
          </AboutParagraph>

          <AboutSectionLabel>What's mimicry, what's the actual design</AboutSectionLabel>
          <AboutParagraph>
            Most of what you see is mimicry. The hero. The rows. The card pop. The badges. The footer. The avatar menu. The typography. All set dressing, there to make the surface feel real enough that the new behavior reads as a design choice and not a CSS demo.
          </AboutParagraph>
          <AboutParagraph>
            The actual feature design lives in one place: the act of switching a row. Typing what you want, watching the row reshape, and asking whether the third iteration would land any better than the first. That loop is the prototype. Everything else is the room around it.
          </AboutParagraph>
          <AboutParagraph>
            If you have your own idea, clone the repo and try it.
          </AboutParagraph>
        </Box>
      </Box>
    </Box>
  );
}

function AboutParagraph({ children }: { children: ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: { xs: 14, md: 15 },
        lineHeight: 1.6,
        color: tokens.color.textSecondary,
      }}
    >
      {children}
    </Typography>
  );
}

function AboutSectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: tokens.type.scale.micro.size,
        color: tokens.color.textPrimary,
        letterSpacing: tokens.type.scale.micro.letterSpacing,
        textTransform: "uppercase",
        fontWeight: tokens.type.weight.semibold,
        marginTop: `${tokens.space.md}px`,
        "&:first-of-type": { marginTop: 0 },
      }}
    >
      {children}
    </Typography>
  );
}

/**
 * Channel bars glyph — the layered vertical-bar mark that prefixes every row
 * title in the Channels prototype. Rendered in `currentColor` so the parent
 * controls fill (muted gray at rest, white on title-bar hover).
 *
 * Hover triggers the `channelBarCycle` keyframe (defined here, fired by the
 * ghost button in Row.tsx / TopTenRow.tsx). The keyframe walks through all
 * six channel hues in order; each bar runs the same animation but offset by
 * one color step via a negative delay, so the result is a continuous wave
 * of color sweeping across the glyph.
 */
const CHANNEL_BAR_PATHS = [
  "M19.425 2.74036L24 0V23.8314L19.425 21.0488V2.74036Z",
  "M15.0258 2.86684L18.892 0V23.8735L15.0258 21.0067V2.86684Z",
  "M11.0675 3.24628L14.3894 0V23.8735L11.0675 20.6272V3.24628Z",
  "M7.6535 4.93266L10.2951 0V23.8735L7.6535 18.9409V4.93266Z",
  "M4.50082 5.38262L6.37133 0V24L4.50082 18.6174V5.38262Z",
  "M1.65994 7.46222L2.71403 0V23.8735L1.65994 16.4113V7.46222Z",
];
// Seven-color palette: six channel hues + white. At rest the bars all render
// muted gray (via `currentColor`); on ghost-button hover the keyframe takes
// over and rotates the palette through them with smooth color dissolves.
const CHANNEL_BAR_COLORS = [
  "#FF8C00",
  "#E83A1A",
  "#FF2D82",
  "#C2185B",
  "#7B2FFF",
  "#3D6FFF",
  "#FFFFFF",
];
export const CHANNEL_BAR_CYCLE_DURATION_S = 1.4;
const STEP_S = CHANNEL_BAR_CYCLE_DURATION_S / CHANNEL_BAR_COLORS.length;

export function ChannelBarsIcon({
  size = 22,
  spinning = false,
}: {
  size?: number;
  /** When true, run the color-cycle animation continuously (no hover needed). */
  spinning?: boolean;
}) {
  // Each bar runs the same keyframe but with a one-step negative delay per
  // index — so at any moment the bars sit at six adjacent points in the cycle
  // and the colors continuously slide forward. NB: the hover rule in Row.tsx
  // / TopTenRow.tsx uses individual animation-* properties (NOT the shorthand)
  // so it doesn't overwrite these per-path delays.
  const perPathStyles = Object.fromEntries(
    CHANNEL_BAR_PATHS.map((_, i) => [
      `& path:nth-of-type(${i + 1})`,
      {
        animationDelay: `-${(i * STEP_S).toFixed(3)}s`,
        ...(spinning && {
          animationName: "channelBarCycle",
          animationDuration: `${CHANNEL_BAR_CYCLE_DURATION_S}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
        }),
      },
    ]),
  );
  // No per-stop `step-end`: the keyframe linearly interpolates between
  // adjacent palette colors, producing a smooth dissolve between hues.
  const cycleKeyframe = Object.fromEntries([
    ...CHANNEL_BAR_COLORS.map((color, i) => [
      `${((i * 100) / CHANNEL_BAR_COLORS.length).toFixed(4)}%`,
      { fill: color },
    ]),
    ["100%", { fill: CHANNEL_BAR_COLORS[0] }],
  ]);
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden
      sx={{
        width: size,
        height: size,
        display: "block",
        flexShrink: 0,
        "@keyframes channelBarCycle": cycleKeyframe,
        ...perPathStyles,
      }}
    >
      {CHANNEL_BAR_PATHS.map((d, i) => (
        <path key={i} d={d} fill="currentColor" />
      ))}
    </Box>
  );
}

/**
 * Pick a per-tile badge based on the channel's identity. Mimics the editorial
 * mix of "Recently Added" / "New Episode" + "Watch Now" / "New Season" badges
 * visible on a real Netflix homepage. Badges are paired: red primary +
 * optional white secondary.
 */
function badgeForChannel(channelId: string, index: number, total: number): TileBadge | undefined {
  if (channelId === "new-on-netflix") {
    return { red: "Recently Added" };
  }
  if (channelId === "your-next-watch") {
    if (index === 0) return { red: "Recently Added" };
    if (index === 1) return { red: "New Episode", white: "Watch Now" };
    if (index === 2) return { red: "Recently Added" };
    if (index === total - 1) return { red: "New Season" };
    return undefined;
  }
  if (channelId === "todays-top-picks") {
    if (index === 0) return { red: "Recently Added" };
    if (index === 2) return { red: "New Season" };
    return undefined;
  }
  if (channelId === "international-hits" && index === 0) {
    return { red: "Recently Added" };
  }
  if (channelId === "documentaries" && index === 1) {
    return { red: "New Episode", white: "Watch Now" };
  }
  return undefined;
}

function ChannelTile({
  index,
  title,
  color,
  artworkUrl,
  expandedArtworkUrl,
  expandsToLandscape,
  fillHeight,
  badge,
  moodTags,
  aspect,
  onSelect,
}: {
  index: number;
  title: string;
  color: string;
  artworkUrl?: string;
  expandedArtworkUrl?: string;
  expandsToLandscape?: boolean;
  fillHeight?: boolean;
  badge?: TileBadge;
  moodTags: string[];
  aspect: "boxart" | "poster";
  onSelect: () => void;
}) {
  // Edge-of-page detection: the rightmost card on the current page sits flush
  // against the right chevron, the leftmost sits flush against the left
  // chevron (or the viewport's safe-zone padding on page 0). Both should
  // bloom inward instead of from center so the hover partial never overlaps
  // the chevron buttons.
  const { perView, itemCount } = useRowSizing();
  let edgeAnchor: "left" | "right" | undefined;
  if (perView > 0) {
    const pos = index % perView;
    if (pos === 0) edgeAnchor = "left";
    else if (pos === perView - 1 || index === itemCount - 1) edgeAnchor = "right";
  }

  const runtimes = ["2h 11m", "3 Seasons", "1h 58m", "4 Seasons", "2h 24m", "Limited Series"];
  const ratings = ["TV-MA", "TV-14", "R", "PG-13", "TV-MA", "PG-13"];
  const isNew = index === 0 || index === 2;
  return (
    <Tile
      focused={false}
      onClick={onSelect}
      responsive
      fillHeight={fillHeight}
      aspect={aspect}
      title={artworkUrl ? undefined : title}
      color={artworkUrl ? undefined : `linear-gradient(155deg, ${color}, ${darken(color, 0.5)})`}
      artworkUrl={artworkUrl}
      expandedArtworkUrl={expandedArtworkUrl}
      expandsToLandscape={expandsToLandscape}
      badge={badge}
      edgeAnchor={edgeAnchor}
      expansion={{
        isNew,
        rating: ratings[index % ratings.length],
        duration: runtimes[index % runtimes.length],
        format: "HD",
        moodTags,
      }}
    />
  );
}

/**
 * Synthesize a DetailModalContent from the catalog entry + the channel that
 * surfaced the tile. The catalog only carries title/year/posterUrl/backdropUrl,
 * so the rest of the modal's surface (cast, director, description, genres,
 * mood, maturity) is generated deterministically from the title so the modal
 * is stable across re-opens. "More Like This" is sampled from other catalog
 * entries that have backdrop art.
 */
const SYNTH_CAST = [
  "Tilda Swinton", "Oscar Isaac", "Park Hae-soo", "Florence Pugh", "Diego Luna",
  "Letitia Wright", "Ayo Edebiri", "Ben Whishaw", "Sandra Oh", "Andrew Scott",
  "Hoyeon Jung", "Jeff Bridges", "Lily Gladstone", "Steven Yeun", "Janelle Monáe",
];
const SYNTH_DIRECTORS = [
  "Celine Song", "Bong Joon-ho", "Lulu Wang", "Barry Jenkins", "Chloé Zhao",
  "Justine Triet", "Hirokazu Kore-eda", "Jonathan Glazer", "Greta Gerwig",
];
const SYNTH_GENRES = [
  ["Drama", "Character Study"],
  ["Thriller", "Mystery"],
  ["Comedy", "Drama"],
  ["Sci-Fi", "Drama"],
  ["Crime", "Drama"],
  ["Romance", "Drama"],
  ["Action", "Adventure"],
  ["International", "Drama"],
];
const SYNTH_MATURITY_NOTES = [
  ["language", "violence"],
  ["mature themes", "language"],
  ["smoking", "language"],
  ["sexual content", "language"],
  ["violence"],
  ["mature themes"],
];
const SYNTH_RATINGS = ["TV-MA", "TV-14", "R", "PG-13", "TV-MA", "TV-14"];
const SYNTH_RUNTIMES_MOVIE = ["1h 58m", "2h 04m", "2h 11m", "2h 24m", "1h 47m"];
const SYNTH_RUNTIMES_TV = ["2 Seasons", "3 Seasons", "Limited Series", "1 Season", "4 Seasons"];
const SYNTH_DESCRIPTIONS = [
  "An unsettled stretch of time gives way to a quiet reckoning — old loyalties bend, and the room everyone walks into is never quite the one they expected.",
  "Two characters, a city that knows them too well, and the slow accumulation of small choices that turn into a life. Patient, observed, and very alive.",
  "A near-future premise hides a deeply human story about what we owe each other, and what we'll do to keep the things we already have.",
  "Half-thriller, half-elegy: a setting that should be familiar turns strange a frame at a time, until the people inside it have to decide what's worth saving.",
];

// FNV-1a-ish 32-bit hash for stable per-title sampling.
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function pickFrom<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

function sampleN<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  let i = 0;
  while (out.length < n && used.size < arr.length) {
    const idx = (seed + i * 31) % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      out.push(arr[idx]);
    }
    i++;
  }
  return out;
}

function buildDetailContent({
  entry,
  fallbackTitle,
  channel,
  rank,
}: {
  entry: CatalogEntry | null;
  fallbackTitle: string;
  channel: Channel;
  rank?: number;
}): DetailModalContent {
  const title = entry?.title ?? fallbackTitle;
  const seed = hashString(title);
  const kind: "movie" | "tv" = entry?.kind === "tv" ? "tv" : entry?.kind === "movie" ? "movie" : seed % 2 === 0 ? "tv" : "movie";

  const cast = sampleN(SYNTH_CAST, 5, seed);
  const director = kind === "movie" ? pickFrom(SYNTH_DIRECTORS, seed, 3) : undefined;
  const baseGenres = pickFrom(SYNTH_GENRES, seed, 1);
  const genres = [channel.category.title.split(/[\s]/)[0] || "Featured", ...baseGenres].slice(0, 3);
  const mood = channel.category.tone.slice(0, 3);
  const rating = pickFrom(SYNTH_RATINGS, seed, 2);
  const runtime = kind === "tv"
    ? pickFrom(SYNTH_RUNTIMES_TV, seed, 4)
    : pickFrom(SYNTH_RUNTIMES_MOVIE, seed, 4);
  const description = pickFrom(SYNTH_DESCRIPTIONS, seed, 5);
  const maturityNotes = pickFrom(SYNTH_MATURITY_NOTES, seed, 6);
  const match = 90 + (seed % 9); // 90–98

  // Suggestions: other catalog entries with backdrops, sampled stably.
  const pool = catalog.filter(
    (c) => c.title !== title && c.backdropUrl,
  );
  const picked = sampleN(pool, 6, seed + 11);
  const suggestions: DetailModalSuggestion[] = picked.map((p, i) => {
    const s = hashString(p.title);
    return {
      title: p.title,
      year: p.year,
      backdropUrl: p.backdropUrl ?? undefined,
      match: 88 + (s % 11),
      rating: pickFrom(SYNTH_RATINGS, s, 2),
      runtime: (p.kind === "tv" ? SYNTH_RUNTIMES_TV : SYNTH_RUNTIMES_MOVIE)[(s + i) % 5],
      isNew: i === 0,
      description: pickFrom(SYNTH_DESCRIPTIONS, s, 5),
    };
  });

  return {
    title,
    year: entry?.year,
    kind,
    backdropUrl: entry?.backdropUrl ?? undefined,
    posterUrl: entry?.posterUrl ?? undefined,
    match,
    rating,
    runtime,
    formats: ["HD", "AD"],
    isNew: channel.id === "new-on-netflix",
    topTenRank: rank,
    description,
    cast,
    director,
    genres,
    mood,
    maturityNotes,
    maturityAudience: "Recommended for ages 17 and up",
    suggestions,
  };
}

function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const k = 1 - amount;
  const dr = Math.round(r * k);
  const dg = Math.round(g * k);
  const db = Math.round(b * k);
  return `#${[dr, dg, db].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

