import { Box, Typography, IconButton, Button, Tooltip } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckIcon from "@mui/icons-material/Check";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "@/theme/tokens";
import { TvFrame, Row, TopTenRow, Tile, NetflixWordmark, FocusRow, ReasonBadge } from "@/primitives";
import type { FocusRowItem, ReasonBadgeSpec } from "@/primitives";
import { SamsungWordmark } from "@/primitives/SamsungWordmark";
import { ControlWordmark, CONTROL_LOGO_DATA_URI } from "@/primitives/ControlWordmark";
import { useRowSizing } from "@/primitives/Row";
import type { TileBadge } from "@/primitives/Tile";
import { FocusProvider } from "@/lib/focus";
import {
  TvSurfaceHead,
  Billboard,
  BillboardArt,
  BillboardSkeleton,
  HeroSkeletonBar,
  Footer,
  ProfileMenu,
  DetailModal,
  buildRowMeta,
  buildDetailContent,
  darken,
  type DetailModalContent,
} from "@/surfaces/netflix-tv";
import { SwitchChannelsModal, type MediaKind } from "./SwitchChannelsModal";
import { seedChannels, type Channel } from "./seedData";
import { findInCatalog, type CatalogEntry } from "@/lib/catalog";
import { catalog } from "@/lib/catalog";
import { tuneChannel, type TuneCandidate } from "@/lib/claude";

/**
 * Context a channel row contributes to a title's detail view. The surface's
 * `buildDetailContent` takes loose hints rather than a Channel, so this
 * adapts one to the other in a single place.
 */
function detailHints(channel: Channel) {
  return {
    genreHint: channel.category.title.split(/\s/)[0] || "Featured",
    mood: channel.category.tone,
    isNew: channel.id === "new-on-netflix",
  };
}

/**
 * Top-level Channels screen.
 *
 * Two interaction models live here, selected by `variant`:
 *
 *  - "tv" (default) — the 2025 Netflix TV language: centered pill nav, an
 *    inset billboard, and focus-committed rows where one card expands to
 *    landscape in place and its metadata renders below the reel. Nothing
 *    overlays anything.
 *  - "web" — the netflix.com language this prototype was originally built
 *    in: left-aligned nav and hover-bloom cards that pop a metadata popover
 *    on top of their neighbors.
 *
 * The web variant is kept so the two can be compared side by side from
 * /experiments rather than argued about. See src/experiments/registry.tsx.
 */

export type ChannelsVariant = "tv" | "web";

export function Channels({ variant = "tv" }: { variant?: ChannelsVariant } = {}) {
  return (
    <FocusProvider>
      <TvFrame>
        <ChannelsContent variant={variant} />
      </TvFrame>
    </FocusProvider>
  );
}

/**
 * Per-row override applied after a user tunes a row from the AI prompt. While
 * Claude selects a matching set of real catalog titles, the row's title cycles
 * through "thinking" messages via a scramble animation. When Claude returns, the
 * title scrambles to the real result and the row fills with the selected titles.
 *
 * `phase` goes `loading` → `ready`; `tiles` is populated on `ready`. `token`
 * identifies the tune so stale timers/intervals don't clobber a newer one.
 */
type RowOverride = {
  phase: "loading" | "ready";
  title: string;
  source: "prompt";
  token: string;
  tiles?: Array<{ title: string; year?: number }>;
};

// Time the AI-returned title scrambles in (row still shimmering) before the
// real tiles drop in. Lets the user read the title as the row resolves.
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

/**
 * The pool Claude tunes from: every catalog entry that has artwork, so each
 * pick it returns resolves to a real, renderable tile. Built once from the
 * static catalog import.
 */
const TUNE_CANDIDATES: TuneCandidate[] = catalog
  .filter((c) => c.posterUrl || c.backdropUrl)
  .map((c) => ({ title: c.title, year: c.year, kind: c.kind }));

/**
 * Resolve Claude's picks to a deduped, art-backed tile list. Picks that don't
 * resolve in the catalog are dropped; the row is then padded up to
 * TARGET_TILE_COUNT from the candidate pool so it never looks half-empty.
 */
function resolvePicks(
  picks: Array<{ title: string; year?: number }>,
  candidates: TuneCandidate[],
): Array<{ title: string; year?: number }> {
  const seen = new Set<string>();
  const out: Array<{ title: string; year?: number }> = [];
  const take = (title: string, year?: number) => {
    const entry = findInCatalog(title, year);
    if (!entry) return;
    const key = entry.title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ title: entry.title, year: entry.year });
  };
  for (const p of picks) {
    if (out.length >= TARGET_TILE_COUNT) break;
    take(p.title, p.year);
  }
  for (const c of candidates) {
    if (out.length >= TARGET_TILE_COUNT) break;
    take(c.title, c.year);
  }
  return out;
}

function ChannelsContent({ variant }: { variant: ChannelsVariant }) {
  const [channels] = useState<Channel[]>(seedChannels);
  const [detail, setDetail] = useState<DetailModalContent | null>(null);
  const [switchTarget, setSwitchTarget] = useState<Channel | null>(null);
  const [rowOverrides, setRowOverrides] = useState<Record<string, RowOverride>>({});
  const [aboutOpen, setAboutOpen] = useState(false);
  // Take Control is a Samsung-sponsored feature: members "enable" it by signing
  // in with Samsung (entitlement is automatic on a real Samsung TV). Persisted
  // so the perk stays unlocked across opens and reloads.
  const [samsungAuthed, setSamsungAuthed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("tc-samsung") === "1",
  );
  function enableSamsung() {
    setSamsungAuthed(true);
    localStorage.setItem("tc-samsung", "1");
  }
  function disconnectSamsung() {
    setSamsungAuthed(false);
    localStorage.removeItem("tc-samsung");
  }
  // Per-row phase timers (loading→ready) and prompt-cycle intervals. Tracked
  // so a newer tune on the same row cancels an in-flight older one.
  const phaseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
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

  // Tune a row from the AI prompt: the title cycles through "thinking" messages
  // while Claude selects a matching set of real catalog titles; once that lands
  // the title scrambles to the result and the row fills with those titles. The
  // media checkboxes constrain the candidate pool to the chosen kinds.
  function handleSubmitPrompt(prompt: string, kinds: MediaKind[]) {
    if (!switchTarget) return;
    const channelId = switchTarget.id;
    const token = `prompt-${Date.now()}`;
    const messageQueue = pickLoadingMessages();

    // All three (or somehow none) → no filter; otherwise restrict to the
    // checked kinds so the row only mixes what the user asked for.
    const candidates =
      kinds.length === 0 || kinds.length >= 3
        ? TUNE_CANDIDATES
        : TUNE_CANDIDATES.filter((c) => c.kind != null && kinds.includes(c.kind as MediaKind));

    clearRowTimers(channelId);
    setRowOverrides((prev) => ({
      ...prev,
      [channelId]: { phase: "loading", title: messageQueue[0], source: "prompt", token },
    }));

    // Cycle through the message queue while the AI call is in flight.
    let messageIndex = 0;
    cycleTimersRef.current[channelId] = setInterval(() => {
      messageIndex = (messageIndex + 1) % messageQueue.length;
      setRowOverrides((prev) => {
        const current = prev[channelId];
        if (!current || current.token !== token || current.phase !== "loading") return prev;
        return { ...prev, [channelId]: { ...current, title: messageQueue[messageIndex] } };
      });
    }, PROMPT_CYCLE_MS);

    // Claude selects from the real catalog, raced against a minimum-thinking
    // timer so the scramble animation reads as "AI working" (Haiku returns in
    // 1–2s, too fast to see). On both resolved: stop cycling, scramble to the
    // final title, then drop in the resolved tiles after PROMPT_TITLE_HOLD_MS.
    const aiPromise = tuneChannel(prompt, candidates);
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, MIN_THINKING_MS));
    Promise.all([aiPromise, minDelay]).then(([result]) => {
      const interval = cycleTimersRef.current[channelId];
      if (interval) {
        clearInterval(interval);
        delete cycleTimersRef.current[channelId];
      }
      const tiles = resolvePicks(result.picks, candidates);
      setRowOverrides((prev) => {
        const current = prev[channelId];
        if (!current || current.token !== token) return prev;
        return { ...prev, [channelId]: { ...current, title: result.title } };
      });
      phaseTimersRef.current[channelId] = setTimeout(() => {
        delete phaseTimersRef.current[channelId];
        setRowOverrides((prev) => {
          const current = prev[channelId];
          if (!current || current.token !== token) return prev;
          return {
            ...prev,
            [channelId]: { phase: "ready", title: result.title, source: "prompt", token, tiles },
          };
        });
      }, PROMPT_TITLE_HOLD_MS);
    });
  }

  // The hero reflects ONLY the top row (channels[0]). When that row is tuned it
  // skeletons during loading and then features the first AI-picked title.
  const topRow = channels[0];
  const topOverride = rowOverrides[topRow.id];
  let heroFeature: HeroFeature = { phase: "default" };
  if (topOverride?.phase === "loading") {
    heroFeature = { phase: "loading" };
  } else if (topOverride?.phase === "ready" && topOverride.tiles?.[0]) {
    const ex = topOverride.tiles[0];
    const entry = findInCatalog(ex.title, ex.year);
    const content = buildDetailContent({ entry, fallbackTitle: ex.title, ...detailHints(topRow) });
    heroFeature = {
      phase: "content",
      title: ex.title,
      logoUrl: entry?.logoUrl ?? undefined,
      backdropUrl: entry?.backdropUrl ?? undefined,
      onOpen: () => setDetail(content),
    };
  }

  return (
    <>
      {variant === "tv" ? (
        <HeroTv
          feature={heroFeature}
          onTune={() => setSwitchTarget(topRow)}
          onWatchOverview={() => setAboutOpen(true)}
        />
      ) : (
        <Hero
          feature={heroFeature}
          onTune={() => setSwitchTarget(topRow)}
          onWatchOverview={() => setAboutOpen(true)}
        />
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          // Inter-row gap creates the grouping asymmetry: each row title is
          // ~24px from its own carousel (title.mb=8 + reel paddingBlock=16),
          // and ~32px from the *previous* row's image (paddingBlock=16 +
          // gap=16). Label-to-row is one spacing step closer than row-to-row,
          // signalling that each title belongs to the row beneath it.
          // TV rows already carry their own metadata block under the reel, so
          // they need less inter-row air than the web rows (whose hover-bloom
          // has to have somewhere to grow into).
          gap: variant === "tv" ? `${tokens.space.md}px` : `${tokens.space.sm}px`,
          // Web only: pull the row stack up so the first row's title sits over
          // the bottom of the full-bleed hero backdrop. The TV billboard is
          // inset and self-contained, so the rows follow it normally.
          marginTop:
            variant === "tv"
              ? `${tokens.space.md}px`
              : { xs: `-${tokens.space.xl}px`, md: `-${tokens.space["2xl"]}px` },
          position: "relative",
          zIndex: 1,
        }}
      >
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            variant={variant}
            channel={channel}
            override={rowOverrides[channel.id]}
            onTileSelect={(content) => setDetail(content)}
            onRequestSwitch={() => setSwitchTarget(channel)}
            onOpenOverview={() => setAboutOpen(true)}
          />
        ))}
      </Box>

      <Footer />

      <DetailModal open={!!detail} content={detail} onClose={() => setDetail(null)} />
      <SwitchChannelsModal
        open={!!switchTarget}
        channelTitle={switchTarget?.category.title}
        authed={samsungAuthed}
        onClose={() => setSwitchTarget(null)}
        onEnable={enableSamsung}
        onDisconnect={disconnectSamsung}
        onAbout={() => setAboutOpen(true)}
        onSubmitPrompt={handleSubmitPrompt}
      />
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
 * Hero state, driven solely by the top row (`your-next-watch`):
 * - `default`  — the "Take Control" billboard over the channel-surfing video.
 * - `loading`  — skeletons for both the backdrop and the content while the top
 *   row tunes.
 * - `content`  — features the first title of the AI-populated top row (its
 *   backdrop + logo), clickable to open its details.
 */
// Mesh gradient mixing the channel-bars hover hues — the Control feature's
// signature backdrop. Shared by the hero, the Control card, and the overview.
const CONTROL_MESH = `
  radial-gradient(60% 80% at 82% 22%, rgba(255,45,130,0.85) 0%, rgba(255,45,130,0) 60%),
  radial-gradient(55% 75% at 96% 68%, rgba(123,47,255,0.80) 0%, rgba(123,47,255,0) 60%),
  radial-gradient(60% 80% at 60% 94%, rgba(194,24,91,0.75) 0%, rgba(194,24,91,0) 60%),
  radial-gradient(52% 70% at 42% 30%, rgba(61,111,255,0.70) 0%, rgba(61,111,255,0) 60%),
  radial-gradient(55% 65% at 16% 12%, rgba(255,140,0,0.70) 0%, rgba(255,140,0,0) 55%),
  radial-gradient(45% 60% at 8% 84%, rgba(232,58,26,0.65) 0%, rgba(232,58,26,0) 55%),
  #160B26
`;

type HeroFeature =
  | { phase: "default" }
  | { phase: "loading" }
  | { phase: "content"; title: string; logoUrl?: string; backdropUrl?: string; onOpen: () => void };

/**
 * Primary CTA. Black with white text; the channel-bars glyph stays white at
 * rest and color-cycles on hover (reusing ChannelBarsIcon's `spinning` mode).
 */
function TuneButton({ onClick, pill = false }: { onClick: () => void; pill?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <Button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      startIcon={
        <Box sx={{ color: "#FFFFFF", display: "inline-flex" }}>
          <ChannelBarsIcon size={20} spinning={hover} />
        </Box>
      }
      sx={{
        backgroundColor: pill ? "rgba(60,60,66,0.72)" : "#000000",
        color: "#FFFFFF",
        fontSize: "clamp(13px, 1.3vw, 17px)",
        fontWeight: tokens.type.weight.bold,
        paddingInline: pill ? "clamp(20px, 2.6vw, 36px)" : "clamp(18px, 2.4vw, 34px)",
        paddingBlock: 0,
        minHeight: pill ? "clamp(34px, 3.4vw, 46px)" : "clamp(30px, 3.2vw, 42px)",
        borderRadius: pill ? `${tokens.radius.pill}px` : `${tokens.radius.sm}px`,
        backdropFilter: pill ? "blur(6px)" : undefined,
        "&:hover": { backgroundColor: pill ? "rgba(80,80,88,0.86)" : "#1A1A1A" },
      }}
    >
      Tune Channels
    </Button>
  );
}


function Hero({
  feature,
  onTune,
  onWatchOverview,
}: {
  feature: HeroFeature;
  onTune: () => void;
  onWatchOverview: () => void;
}) {
  // Normalized cursor offset (-0.5…0.5) used to gently parallax the mesh.
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setParallax({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  }
  return (
    <Box
      onMouseMove={handleMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      sx={{
        position: "relative",
        height: "clamp(240px, calc(56vw - 120px), 600px)",
        // Hero is full-bleed: escape the TvFrame's horizontal padding so the
        // backdrop runs to the viewport edges. The negative marginTop pulls the
        // hero up under the TvFrame's top padding so the floating header overlay
        // sits flush against the viewport edge.
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
      }}
    >
      {/* Backdrop — featured art, skeleton, or the default promo video. */}
      {feature.phase === "content" && feature.backdropUrl ? (
        <Box
          component="img"
          src={feature.backdropUrl}
          alt=""
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", pointerEvents: "none" }}
        />
      ) : feature.phase === "loading" ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: tokens.color.surfaceLow,
            overflow: "hidden",
            "@keyframes heroShimmer": { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
              animation: "heroShimmer 1.5s linear infinite",
            },
          }}
        />
      ) : (
        // Default backdrop — a mesh gradient mixing the channel-bars hover hues.
        // Oversized so it can gently parallax with the cursor without edge gaps.
        <Box
          sx={{
            position: "absolute",
            inset: "-8%",
            transform: `translate(${parallax.x * 28}px, ${parallax.y * 22}px)`,
            transition: "transform 320ms ease-out",
            willChange: "transform",
            background: CONTROL_MESH,
          }}
        />
      )}

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

      {/* Oversized channels glyph, centered in the open space to the right of
          the content. Each panel sits at 50% and brightens on its own hover. */}
      {feature.phase === "default" && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: { md: "81%", lg: "76%" },
            transform: "translate(-50%, -50%)",
            color: "#FFFFFF",
            display: { xs: "none", md: "block" },
            filter: "drop-shadow(0 8px 40px rgba(0,0,0,0.35))",
          }}
        >
          <ChannelBarsIcon size={300} interactive />
        </Box>
      )}

      {/* Floating header overlay. */}
      <Box
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
          maxWidth: { xs: "100%", md: "62%", lg: "52%" },
        }}
      >
        {feature.phase === "loading" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", mb: "clamp(16px, 2vw, 28px)" }}>
            <HeroSkeletonBar width="min(440px, 72%)" height={52} />
            <HeroSkeletonBar width="min(320px, 56%)" height={20} />
            <HeroSkeletonBar width="min(240px, 42%)" height={20} />
          </Box>
        ) : feature.phase === "content" ? (
          <Box
            role="button"
            onClick={feature.onOpen}
            sx={{ cursor: "pointer", mb: "clamp(16px, 2vw, 28px)", display: "inline-flex", maxWidth: "100%" }}
          >
            {feature.logoUrl ? (
              <Box
                component="img"
                src={feature.logoUrl}
                alt={feature.title}
                sx={{
                  maxWidth: "min(440px, 80%)",
                  maxHeight: "clamp(64px, 12vw, 150px)",
                  objectFit: "contain",
                  objectPosition: "left bottom",
                  filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.55))",
                }}
              />
            ) : (
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 26, sm: "clamp(36px, 5.6vw, 80px)" },
                  lineHeight: 1.02,
                  color: tokens.color.textPrimary,
                  fontWeight: tokens.type.weight.bold,
                  letterSpacing: "-0.02em",
                  textShadow: "0 4px 24px rgba(0,0,0,0.55)",
                }}
              >
                {feature.title}
              </Typography>
            )}
          </Box>
        ) : (
          <>
            <Box
              sx={{
                mb: "clamp(10px, 1.2vw, 16px)",
                filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.55))",
                "@keyframes controlIn": {
                  from: { opacity: 0, transform: "translateY(20px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
                animation: "controlIn 650ms cubic-bezier(0.22, 1, 0.36, 1) both",
              }}
            >
              <ControlWordmark height="clamp(34px, 5.2vw, 64px)" color="#FFFFFF" />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                mb: "clamp(14px, 1.8vw, 24px)",
                color: "rgba(255,255,255,0.82)",
                fontSize: "clamp(11px, 1vw, 13px)",
              }}
            >
              Presented by <SamsungWordmark height={12} color="#FFFFFF" />
            </Box>

            <Typography
              sx={{
                color: tokens.color.textPrimary,
                fontSize: "clamp(14px, 1.5vw, 22px)",
                maxWidth: "36ch",
                mb: "clamp(16px, 2vw, 28px)",
                textShadow: "0 2px 12px rgba(0,0,0,0.6)",
              }}
            >
              Tune channels to control your content
            </Typography>
          </>
        )}

        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "clamp(8px, 1vw, 16px)" }}>
          <TuneButton onClick={onTune} />
          <Button
            onClick={onWatchOverview}
            startIcon={<PlayArrowIcon sx={{ fontSize: "clamp(20px, 2.2vw, 28px)" }} />}
            sx={{
              backgroundColor: tokens.color.textPrimary,
              color: tokens.color.base,
              fontSize: "clamp(13px, 1.3vw, 17px)",
              fontWeight: tokens.type.weight.bold,
              paddingInline: "clamp(18px, 2.4vw, 34px)",
              paddingBlock: 0,
              minHeight: "clamp(30px, 3.2vw, 42px)",
              borderRadius: `${tokens.radius.sm}px`,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.85)" },
            }}
          >
            Watch Overview
          </Button>
        </Box>
      </Box>

      {/* Premium rating chip. */}
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
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <CheckIcon sx={{ fontSize: "clamp(13px, 1.3vw, 17px)" }} />
        Premium
      </Box>
    </Box>
  );
}


/**
 * TV hero — the inset billboard.
 *
 * Where the web hero is a full-bleed band that the first row's title crawls
 * up into, the TV hero is a discrete object: an inset rounded rectangle with
 * a visible edge, taking most of the screen, with the next row's title
 * peeking below it. That edge is doing real work — it tells you the hero is
 * one focusable thing rather than a background the rows sit on top of.
 */
function HeroTv({
  feature,
  onTune,
  onWatchOverview,
}: {
  feature: HeroFeature;
  onTune: () => void;
  onWatchOverview: () => void;
}) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setParallax({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  }

  // Backdrop: featured art when the top row is tuned, a shimmer while it
  // tunes, and otherwise the Control mesh — oversized so it can parallax with
  // the cursor without opening a gap at the edges.
  const backdrop =
    feature.phase === "content" && feature.backdropUrl ? (
      <BillboardArt src={feature.backdropUrl} />
    ) : feature.phase === "loading" ? (
      <BillboardSkeleton />
    ) : (
      <Box
        sx={{
          position: "absolute",
          inset: "-8%",
          transform: `translate(${parallax.x * 24}px, ${parallax.y * 18}px)`,
          transition: "transform 320ms ease-out",
          willChange: "transform",
          background: CONTROL_MESH,
        }}
      />
    );

  return (
    <TvSurfaceHead navTint="rgba(60,20,64,0.92)">
      <Billboard
        onMouseMove={handleMove}
        onMouseLeave={() => setParallax({ x: 0, y: 0 })}
        backdrop={backdrop}
        overlay={
          feature.phase === "default" ? (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: { md: "76%", lg: "72%" },
                transform: "translate(-50%, -50%)",
                color: "#FFFFFF",
                display: { xs: "none", md: "block" },
                filter: "drop-shadow(0 8px 40px rgba(0,0,0,0.35))",
              }}
            >
              <ChannelBarsIcon size={280} interactive />
            </Box>
          ) : undefined
        }
        badges={
          feature.phase === "content" ? (
            <ReasonBadge spec={{ kind: "recommend", text: "We think you'll love this" }} />
          ) : (
            <ReasonBadge spec={{ kind: "announce", text: "Included with Premium" }} />
          )
        }
      >
            {feature.phase === "loading" ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", mb: "clamp(16px, 2vw, 28px)" }}>
                <HeroSkeletonBar width="min(440px, 72%)" height={52} />
                <HeroSkeletonBar width="min(320px, 56%)" height={20} />
              </Box>
            ) : feature.phase === "content" ? (
              <Box
                role="button"
                onClick={feature.onOpen}
                sx={{ cursor: "pointer", mb: "clamp(16px, 2vw, 28px)", display: "inline-flex", maxWidth: "100%" }}
              >
                {feature.logoUrl ? (
                  <Box
                    component="img"
                    src={feature.logoUrl}
                    alt={feature.title}
                    sx={{
                      maxWidth: "min(440px, 80%)",
                      maxHeight: "clamp(64px, 12vw, 150px)",
                      objectFit: "contain",
                      objectPosition: "left bottom",
                      filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.55))",
                    }}
                  />
                ) : (
                  <Typography
                    component="h1"
                    sx={{
                      fontSize: { xs: 26, sm: "clamp(36px, 5.6vw, 80px)" },
                      lineHeight: 1.02,
                      color: tokens.color.textPrimary,
                      fontWeight: tokens.type.weight.bold,
                      letterSpacing: "-0.02em",
                      textShadow: "0 4px 24px rgba(0,0,0,0.55)",
                    }}
                  >
                    {feature.title}
                  </Typography>
                )}
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    mb: "clamp(10px, 1.2vw, 16px)",
                    filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.55))",
                    "@keyframes controlIn": {
                      from: { opacity: 0, transform: "translateY(20px)" },
                      to: { opacity: 1, transform: "translateY(0)" },
                    },
                    animation: "controlIn 650ms cubic-bezier(0.22, 1, 0.36, 1) both",
                  }}
                >
                  <ControlWordmark height="clamp(34px, 5.2vw, 64px)" color="#FFFFFF" />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    mb: "clamp(12px, 1.6vw, 20px)",
                    color: "rgba(255,255,255,0.82)",
                    fontSize: "clamp(11px, 1vw, 13px)",
                  }}
                >
                  Presented by <SamsungWordmark height={12} color="#FFFFFF" />
                </Box>

                <Typography
                  sx={{
                    color: tokens.color.textPrimary,
                    fontSize: "clamp(14px, 1.5vw, 22px)",
                    maxWidth: "36ch",
                    mb: "clamp(16px, 2vw, 28px)",
                    textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                  }}
                >
                  Tune channels to control your content
                </Typography>
              </>
            )}

            {/* Pill CTAs — the TV redesign's button shape. */}
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "clamp(8px, 1vw, 14px)" }}>
              <Button
                onClick={onWatchOverview}
                startIcon={<PlayArrowIcon sx={{ fontSize: "clamp(20px, 2.2vw, 28px)" }} />}
                sx={{
                  backgroundColor: tokens.color.textPrimary,
                  color: tokens.color.base,
                  fontSize: "clamp(13px, 1.3vw, 17px)",
                  fontWeight: tokens.type.weight.bold,
                  paddingInline: "clamp(20px, 2.6vw, 36px)",
                  paddingBlock: 0,
                  minHeight: "clamp(34px, 3.4vw, 46px)",
                  borderRadius: `${tokens.radius.pill}px`,
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.85)" },
                }}
              >
                Watch Overview
              </Button>
              <TuneButton onClick={onTune} pill />
            </Box>
      </Billboard>
    </TvSurfaceHead>
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
  variant,
  channel,
  override,
  onTileSelect,
  onRequestSwitch,
  onOpenOverview,
}: {
  variant: ChannelsVariant;
  channel: Channel;
  override?: RowOverride;
  onTileSelect: (content: DetailModalContent) => void;
  onRequestSwitch: () => void;
  onOpenOverview: () => void;
}) {
  const sectionId = `channel-${channel.id}`;
  const isTopTen = channel.id === "top-10-tv-us";
  // The first row is the "tunable canvas": it keeps two permanent action cards
  // (Tune Channels / Explore Games) and the override only replaces the content
  // after them, so the cards — and the hero that mirrors them — stay stable.
  const isFirstRow = channel.id === "your-next-watch";
  const loading = override?.phase === "loading";

  // A ready override supplies the real tuned tiles; otherwise the row shows its
  // own exemplars. Either way we pad up to TARGET_TILE_COUNT (Top 10 stays 10).
  const contentSource =
    override?.phase === "ready" && override.tiles ? override.tiles : channel.category.exemplars;
  const contentTiles = isTopTen
    ? contentSource.slice(0, 10)
    : Array.from({ length: TARGET_TILE_COUNT }, (_, i) => contentSource[i % contentSource.length]);

  function selectTile(exemplar: { title: string; year?: number }, i: number) {
    const entry = findInCatalog(exemplar.title, exemplar.year);
    onTileSelect(buildDetailContent({ entry, fallbackTitle: exemplar.title, ...detailHints(channel), rank: isTopTen ? i + 1 : undefined }));
  }

  // While the row is tuned, swap its label/icon for the override's title. The
  // channel-bar icon spins only during loading; it stops once tiles arrive.
  const displayTitle = override ? override.title : channel.category.title;
  const leadingIcon = <ChannelBarsIcon spinning={loading} />;
  // Prompt-driven tunes scramble each title change (cycling "thinking" messages
  // then the final AI title). The Games action changes the title exactly once.
  const titleNode: ReactNode =
    override?.source === "prompt" ? <ScrambleText target={displayTitle} /> : displayTitle;

  const renderBoxartTile = (ex: { title: string; year?: number }, i: number) => {
    const entry = findInCatalog(ex.title, ex.year);
    return (
      <ChannelTile
        key={ex.title + i}
        index={i}
        title={ex.title}
        color={channel.tilePalette[i % channel.tilePalette.length]}
        artworkUrl={entry?.backdropUrl ?? undefined}
        logoUrl={entry?.logoUrl ?? undefined}
        badge={override ? mediaBadge(entry?.kind) : badgeForChannel(channel.id, i, contentTiles.length)}
        moodTags={channel.category.tone.slice(0, 3)}
        aspect="boxart"
        onSelect={() => selectTile(ex, i)}
      />
    );
  };

  const skeletons = (n: number) =>
    Array.from({ length: n }, (_, i) => <SkeletonTile key={`sk-${i}`} aspect="boxart" />);

  // ---- TV variant ----
  // Every channel — Top 10 included — renders through the same focus-committed
  // row. On TV there is no separate "Top 10 component": the ranking is a
  // numeral decoration behind the same card, which is why the redesign's rows
  // all feel like one mechanism.
  if (variant === "tv") {
    const items: FocusRowItem[] = contentTiles.map((ex, i) => {
      const entry = findInCatalog(ex.title, ex.year);
      const meta = buildRowMeta(entry, ex.title);
      const swatch = channel.tilePalette[i % channel.tilePalette.length];
      return {
        key: `${ex.title}-${i}`,
        title: ex.title,
        posterUrl: entry?.posterUrl ?? undefined,
        backdropUrl: entry?.backdropUrl ?? undefined,
        logoUrl: entry?.logoUrl ?? undefined,
        color: `linear-gradient(155deg, ${swatch}, ${darken(swatch, 0.5)})`,
        badges: reasonBadges({
          channelId: channel.id,
          index: i,
          total: contentTiles.length,
          kind: entry?.kind ?? null,
          rank: isTopTen ? i + 1 : undefined,
          tuned: !!override,
        }),
        metaParts: meta.metaParts,
        rating: meta.rating,
        hasCaptions: meta.hasCaptions,
        synopsis: meta.synopsis,
        actionLabel: entry?.kind === "game" ? "Play Game" : "Play",
        onOpen: () => selectTile(ex, i),
      };
    });

    // The Control card leads the first row at rest and moves to the end once
    // the row is tuned, so fresh results take focus — same rule as the web row.
    if (isFirstRow) {
      const control = controlFocusItem(onOpenOverview);
      if (override) items.push(control);
      else items.unshift(control);
    }

    return (
      <FocusRow
        title={titleNode}
        leadingIcon={leadingIcon}
        hoverHint={<ShuffleIcon sx={{ fontSize: 16 }} />}
        onTitleClick={onRequestSwitch}
        items={items}
        ranked={isTopTen}
        loading={loading}
        loadingCount={isTopTen ? 10 : TARGET_TILE_COUNT}
      />
    );
  }

  // Non-first rows that have been tuned render as a plain Row (dropping Top 10
  // numerals etc.): loading shimmer, then the real tuned tiles.
  if (override && !isFirstRow) {
    return (
      <Row
        sectionId={sectionId}
        itemCount={TARGET_TILE_COUNT}
        title={titleNode}
        leadingIcon={leadingIcon}
        hoverHint={<ShuffleIcon sx={{ fontSize: 16 }} />}
        onTitleClick={onRequestSwitch}
        itemsPerView={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
      >
        {loading ? skeletons(TARGET_TILE_COUNT) : contentTiles.map(renderBoxartTile)}
      </Row>
    );
  }

  if (isTopTen) {
    return (
      <TopTenRow
        sectionId={sectionId}
        itemCount={contentTiles.length}
        title={displayTitle}
        leadingIcon={leadingIcon}
        hoverHint={<ShuffleIcon sx={{ fontSize: 16 }} />}
        onTitleClick={onRequestSwitch}
        // Match Row.tsx's perView so Top 10 columns line up vertically with
        // the boxart cards in adjacent rows — the Netflix homepage rule.
        itemsPerView={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
      >
        {contentTiles.map((ex, i) => {
          const catalogEntry = findInCatalog(ex.title, ex.year);
          return (
            <ChannelTile
              key={ex.title + i}
              index={i}
              title={ex.title}
              color={channel.tilePalette[i % channel.tilePalette.length]}
              artworkUrl={catalogEntry?.posterUrl ?? undefined}
              expandedArtworkUrl={catalogEntry?.backdropUrl ?? undefined}
              logoUrl={catalogEntry?.logoUrl ?? undefined}
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

  // Default row (includes the first row). The first row carries the Take Control
  // media card (the prototype explainer): it leads at rest, but once the row is
  // tuned it moves to the end so the fresh results lead.
  const contentNodes = loading ? skeletons(TARGET_TILE_COUNT) : contentTiles.map(renderBoxartTile);
  const takeControl = <TakeControlTile key="take-control" onClick={onOpenOverview} />;
  const children: ReactNode[] = isFirstRow
    ? override
      ? [...contentNodes, takeControl]
      : [takeControl, ...contentNodes]
    : contentNodes;

  return (
    <Row
      sectionId={sectionId}
      itemCount={children.length}
      title={titleNode}
      leadingIcon={leadingIcon}
      hoverHint={<ShuffleIcon sx={{ fontSize: 16 }} />}
      onTitleClick={onRequestSwitch}
      itemsPerView={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
    >
      {children}
    </Row>
  );
}

/**
 * Placeholder card shown while a row is tuning. Mirrors the resting tile
 * geometry so the row's height doesn't jump, with a shimmer to convey activity.
 * Non-interactive: it resolves to real tiles on its own once tuning completes.
 */
function SkeletonTile({ aspect }: { aspect: "boxart" | "poster" }) {
  const restAspect = aspect === "boxart" ? "16 / 9" : "2 / 3";
  // Width comes from Row's `& > *` rule (cardW). We only set the aspect ratio,
  // matching how the responsive Tile primitive sizes itself in the same row.
  return (
    <Box
      aria-hidden
      sx={{
        aspectRatio: restAspect,
        flexShrink: 0,
        borderRadius: `${tokens.radius.sm}px`,
        backgroundColor: tokens.color.surfaceMid,
        position: "relative",
        overflow: "hidden",
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
 * Take Control media card — the first card in the top row. Reuses the Tile
 * primitive so it gets the same hover-bloom + popover info panel as every other
 * card; clicking it opens the Take Control overview.
 */
function TakeControlTile({ onClick }: { onClick: () => void }) {
  return (
    <Tile
      focused={false}
      onClick={onClick}
      responsive
      aspect="boxart"
      color={CONTROL_MESH}
      edgeAnchor="left"
      artwork={
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "8%" }}>
          <Box
            component="img"
            src={CONTROL_LOGO_DATA_URI}
            alt="Control"
            sx={{ width: "64%", filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.45))" }}
          />
        </Box>
      }
      expansion={{
        description: "Presented by Samsung. Open the overview to see how it works.",
        moodTags: ["movies", "shows", "games"],
      }}
    />
  );
}

/**
 * Take Control explainer modal. Fires from the hero's "Watch" button and the
 * Take Control media card. Same centered-overlay language as DetailModal /
 * SwitchChannelsModal — this is where the prototype describes itself.
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
      aria-label="Control"
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
          overflow: "hidden",
        }}
      >
        {/* Lead — the overview walkthrough video. */}
        <Box sx={{ position: "relative" }}>
          <Box
            component="iframe"
            src="https://www.loom.com/embed/7f790ed025b94629ab89666cbc1dbe42"
            title="Control overview"
            allowFullScreen
            sx={{
              width: "100%",
              aspectRatio: "4 / 3",
              border: 0,
              display: "block",
              backgroundColor: tokens.color.base,
            }}
          />
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
        </Box>

        {/* Body */}
        <Box
          sx={{
            paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
            paddingTop: `${tokens.space.lg}px`,
            paddingBottom: `${tokens.space.xl}px`,
          }}
        >
          <Typography
            sx={{
              fontSize: tokens.type.scale.micro.size,
              color: tokens.color.accent,
              letterSpacing: tokens.type.scale.micro.letterSpacing,
              fontWeight: tokens.type.weight.semibold,
              marginBottom: `${tokens.space.sm}px`,
            }}
          >
            Control · a Netflix design prototype
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: `${tokens.space.sm}px` }}>
            <AboutSectionLabel>What this is</AboutSectionLabel>
          <AboutParagraph>
            Control is a browser prototype for the hardest part of Netflix — deciding what to watch. You take control of a row: describe what you're in the mood for and it retunes into a real mix of movies, shows, and games, chosen in the moment.
          </AboutParagraph>

          <AboutSectionLabel>An experiment in ingredients</AboutSectionLabel>
          <AboutParagraph>
            The bigger idea is widening what goes into the mix. Alongside movies and shows, this version pulls in games, and treats partnerships as a first-class ingredient: Control is presented by Samsung and unlocked through a partner sign-in — the way a device maker or carrier could light it up for their members. More ingredients, better mixes.
          </AboutParagraph>

          <AboutSectionLabel>How it works</AboutSectionLabel>
          <AboutParagraph>
            Open Tune Channels, or click any row title, and describe what you want — something like a tense sci-fi heist, or cozy games and shows. Claude reads your prompt and picks a matching set of titles from a real catalog, so the row fills with actual artwork. Choose which media types to include, and the hero features the first result.
          </AboutParagraph>

          <AboutSectionLabel>What's real, what's set dressing</AboutSectionLabel>
          <AboutParagraph>
            The catalog and its artwork are real, pulled from public movie, show, and game databases, and the tuning is a live Claude call that chooses from it. Everything around it — the chrome, the badges, the modals — is faithful set dressing so the new behavior reads as a design choice rather than a demo.
          </AboutParagraph>

          <AboutSectionLabel>What's next</AboutSectionLabel>
          <AboutParagraph>
            More discovery levers — playful, engaging ways to steer the mix beyond a text box — plus more partner and content ingredients. The walkthrough above shows where it stands today.
          </AboutParagraph>
          </Box>
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
  interactive = false,
}: {
  size?: number;
  /** When true, run the color-cycle animation continuously (no hover needed). */
  spinning?: boolean;
  /** When true, each panel sits at 50% and brightens to full on its own hover. */
  interactive?: boolean;
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
        ...(interactive && {
          pointerEvents: "auto",
          "& path": { opacity: 0.5, transition: "opacity 220ms ease" },
          "& path:hover": { opacity: 1 },
        }),
      }}
    >
      {CHANNEL_BAR_PATHS.map((d, i) => (
        <path key={i} d={d} fill="currentColor" />
      ))}
    </Box>
  );
}

/**
 * Per-tile media-type badge, keyed off the catalog entry's kind: red for
 * movies, white for shows, black for games. Used only on AI-tuned rows so a
 * mixed result reads at a glance which cards are which; untuned rows keep their
 * editorial badges (see badgeForChannel).
 */
function mediaBadge(kind: CatalogEntry["kind"] | undefined): TileBadge | undefined {
  if (kind === "movie") return { red: "Movie" };
  if (kind === "tv") return { white: "Show" };
  if (kind === "game") return { black: "Game" };
  return undefined;
}

/**
 * Editorial badge for untuned rows. Mimics the mix of "Recently Added" /
 * "New Episode" + "Watch Now" / "New Season" badges on a real Netflix homepage.
 * Badges are paired: red primary + optional white secondary.
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


/**
 * Reason badges for a card. This is the mechanic most worth porting: Netflix
 * renders the *why* behind a recommendation as chrome. Untuned rows carry the
 * editorial reasons (recently added, new season); tuned rows carry the media
 * type instead, because a mixed movie/show/game result is the thing the user
 * needs to read at a glance.
 */
function reasonBadges({
  channelId,
  index,
  total,
  kind,
  rank,
  tuned,
}: {
  channelId: string;
  index: number;
  total: number;
  kind: CatalogEntry["kind"] | null;
  rank?: number;
  tuned: boolean;
}): ReasonBadgeSpec[] {
  const out: ReasonBadgeSpec[] = [];

  if (rank) out.push({ kind: "topTen", text: `No. ${rank} in Series` });

  if (tuned) {
    if (kind === "movie") out.push({ kind: "movie", text: "Film" });
    else if (kind === "tv") out.push({ kind: "show", text: "Series" });
    else if (kind === "game") out.push({ kind: "game", text: "Game" });
    return out;
  }

  if (channelId === "netflix-games") {
    out.push({ kind: "game", text: "Included with Netflix" });
    return out;
  }

  const editorial = badgeForChannel(channelId, index, total);
  if (editorial?.red) out.push({ kind: "announce", text: editorial.red });
  if (channelId === "todays-top-picks" && index === 1) {
    out.push({ kind: "recommend", text: "We think you'll love this" });
  }
  if (channelId === "critically-acclaimed-tv" && index === 0) {
    out.push({ kind: "rewatch", text: "Highly rewatched" });
  }
  return out;
}

/**
 * The Control explainer, expressed as a focus-row card. It reuses the hero's
 * mesh so the feature reads as one thing across the page.
 */
function controlFocusItem(onOpen: () => void): FocusRowItem {
  return {
    key: "control-card",
    title: "Control",
    color: CONTROL_MESH,
    artwork: (
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "10%" }}>
        <Box
          component="img"
          src={CONTROL_LOGO_DATA_URI}
          alt="Control"
          sx={{ width: "52%", filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.45))" }}
        />
      </Box>
    ),
    badges: [{ kind: "announce", text: "Presented by Samsung" }],
    metaParts: ["Feature", "Movies, series and games"],
    synopsis: "Describe what you're in the mood for and any row retunes into a fresh mix. Open the overview to see how it works.",
    onOpen,
  };
}

function ChannelTile({
  index,
  title,
  color,
  artworkUrl,
  expandedArtworkUrl,
  logoUrl,
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
  logoUrl?: string;
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
      title={title}
      color={artworkUrl ? undefined : `linear-gradient(155deg, ${color}, ${darken(color, 0.5)})`}
      artworkUrl={artworkUrl}
      expandedArtworkUrl={expandedArtworkUrl}
      logoUrl={logoUrl}
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

