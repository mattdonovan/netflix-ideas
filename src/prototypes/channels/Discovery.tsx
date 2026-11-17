import { Box, Button, GlobalStyles, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { tokens } from "@/theme/tokens";
import { ReasonBadge } from "@/primitives";
import type { TvNavItem } from "@/primitives";
import {
  TvSurfaceHead,
  TV_NAV_ITEMS,
  TV_ACTION_SX,
  Billboard,
  BillboardArt,
  Footer,
  DetailModal,
  hashString,
  type DetailModalContent,
} from "@/surfaces/netflix-tv";
import { seedChannels } from "./seedData";
import { AboutModal, ChannelRow, type AboutKind } from "./Channels";
import { THEME_SETS, chip, runtimeLabel, titleByName, type Title } from "./discover/catalog";
import { initialState, rank, themeArt, type Anchor } from "./discover/engine";
import { TuneView } from "./discover/TuneView";
import { DiscoverMark } from "./discover/DiscoverMark";

/**
 * Discovery (formerly Control) on the Netflix TV surface.
 *
 * Netflix's AI Discover, kept recognisable: a Discover nav item and the same
 * theme carousel. The change is what "Get more options" does. Instead of
 * regenerating the carousel it opens the focused theme as a tune view: the
 * theme written as a sentence whose underlined words are controls, beside 36
 * picks re-ranked from ~5,400 titles on Netflix.
 *
 * Home keeps one featured title with Play and Discover; every title's detail
 * view gets the same Discover button, which opens the tune view seeded with
 * that title.
 */

type View =
  | { name: "home" }
  | { name: "discover"; set: number; idx: number }
  | { name: "tune"; anchor: Anchor; set: number; idx: number; id: number; visited?: string[] };

type Rect = { left: number; top: number; width: number; height: number };
type Tx = { dir: "in" | "out"; phase: number; start: Rect; mid: Rect; end: Rect; art: string; label: string; k: number };

const HERO_TITLE = "Glass Onion: A Knives Out Mystery";
const NAV_TINT = "rgba(60,20,64,0.92)";

const RING_CSS = {
  "@property --discovery-ang": { syntax: "'<angle>'", initialValue: "0deg", inherits: "false" },
  "@keyframes discoverySpin": { to: { "--discovery-ang": "360deg" } },
  ".discovery-ring": {
    position: "absolute",
    borderRadius: `${tokens.radius.lg}px`,
    padding: "3px",
    pointerEvents: "none",
    boxSizing: "border-box",
    background: "conic-gradient(from var(--discovery-ang), #E50914, #FF2E63, #A43CFF, #5B2BFF, #FF7A1A, #E50914)",
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    animation: "discoverySpin 5s linear infinite",
    filter: "drop-shadow(0 0 14px rgba(229, 9, 20, 0.35))",
  },
} as const;

export function DiscoveryContent() {
  const [view, setView] = useState<View>({ name: "home" });
  const [detail, setDetail] = useState<{ content: DetailModalContent; title?: Title } | null>(null);
  const [about, setAbout] = useState<AboutKind | null>(null);
  const aboutOpen = about !== null;
  const [tx, setTx] = useState<Tx | null>(null);
  const [revealed, setRevealed] = useState(true);
  const [fade, setFade] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const firstRun = useRef(true);
  const finish = useRef<(() => void) | null>(null);

  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Any key during the transition skips to the end.
  useEffect(() => {
    if (!tx) return;
    const skip = () => finish.current?.();
    window.addEventListener("keydown", skip, { capture: true });
    return () => window.removeEventListener("keydown", skip, { capture: true });
  }, [tx]);

  /** Navigate, cancelling any transition still in flight so its timers can't override the choice. */
  function go(next: View) {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    finish.current = null;
    setTx(null);
    setFade(false);
    setRevealed(true);
    setView(next);
  }

  function at(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function frameRect(): Rect {
    const r = slotRef.current?.getBoundingClientRect();
    const top = Math.max(r?.top ?? 80, 72);
    const left = r?.left ?? 32;
    const width = r?.width ?? window.innerWidth - 64;
    return { left, top, width, height: Math.max(320, window.innerHeight - top - 24) };
  }

  function midRect(): Rect {
    const w = Math.min(window.innerWidth * 0.62, 1100);
    const h = Math.min((w * 9) / 16, window.innerHeight * 0.6);
    return { left: (window.innerWidth - w) / 2, top: Math.max(90, (window.innerHeight - h) / 2), width: w, height: h };
  }

  /** The card's border lights up, grows, its image dissolves, and the border becomes the tune view's frame. */
  /** set/idx: the carousel position the tune view returns to (and ↻ steps through). */
  function openTune(anchor: Anchor, set: number, idx: number, art: string, label: string) {
    const target: View = { name: "tune", anchor, set, idx, id: Date.now() };
    const el = sourceRef.current?.getBoundingClientRect();
    if (reduced || !el) {
      window.scrollTo({ top: 0 });
      go(target);
      return;
    }
    // One continuous motion: the card and its kaleidoscope border grow together
    // to the full frame while the image dissolves; only once the frame has
    // landed does the content fade in. A little slower the first time.
    const k = firstRun.current ? 1 : 0.8;
    firstRun.current = false;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const start = { left: el.left, top: el.top, width: el.width, height: el.height };
    const end = frameRect();
    const grow = Math.round(GROW_MS * k);
    const done = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      window.scrollTo({ top: 0 });
      setView(target);
      setRevealed(true);
      setFade(false);
      setTx(null);
      finish.current = null;
    };
    finish.current = done;
    setTx({ dir: "in", phase: 0, start, mid: midRect(), end, art, label, k });
    at(20, () => {
      setTx((t) => t && { ...t, phase: 1 });
      setFade(true);
    });
    at(20 + grow, () => {
      // The frame has landed: swap in the tune view underneath, hidden, then reveal it.
      window.scrollTo({ top: 0 });
      setRevealed(false);
      setView(target);
      setFade(false);
      setTx((t) => t && { ...t, phase: 2 });
      at(40, () => setRevealed(true));
    });
    at(20 + grow + 520, done);
  }

  /** Back: the frame closes down to a card while the previous view returns. */
  function closeTune(from: View) {
    if (reduced) {
      go(from);
      return;
    }
    const k = 0.6;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const start = frameRect();
    const done = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      setView(from);
      setFade(false);
      setRevealed(true);
      setTx(null);
      finish.current = null;
    };
    finish.current = done;
    setTx({ dir: "out", phase: 0, start, mid: midRect(), end: midRect(), art: "", label: "", k });
    at(20, () => {
      setTx((t) => t && { ...t, phase: 1 });
      setFade(true);
    });
    at(350 * k, () => {
      setView(from);
      setTx((t) => t && { ...t, phase: 2 });
      setFade(false);
    });
    at(800 * k, done);
  }

  const navItems: TvNavItem[] = [
    ...TV_NAV_ITEMS.map((n) => ({
      ...n,
      active: n.label === "Home" ? view.name === "home" : false,
      onClick: n.label === "Home" ? () => go({ name: "home" }) : undefined,
    })),
    {
      label: "Discover",
      active: view.name !== "home",
      icon: <DiscoverMark size={16} glow={view.name !== "home"} />,
      tone: "glass",
      badge: <NewBadge />,
      onClick: () => go({ name: "discover", set: 0, idx: 0 }),
    },
  ];

  function openDiscoveryTitle(t: Title) {
    setDetail({ content: detailFor(t), title: t });
  }

  // Row tiles come from the older 180-title catalog; Discover works when the title is in the 5,400 pool.
  const detailDiscover = detail ? (detail.title ?? titleByName.get(detail.content.title)) : undefined;

  const contentStyle: CSSProperties = { opacity: fade ? 0 : 1, transition: `opacity ${fade ? 280 : 360}ms ease` };

  return (
    <>
      <GlobalStyles styles={RING_CSS as never} />
      <TvSurfaceHead navTint={NAV_TINT} navItems={navItems}>
        <Box ref={slotRef} style={contentStyle}>
          {view.name === "home" && (
            <HomeBillboard
              heroRef={sourceRef}
              onPlay={() => openDiscoveryTitle(titleByName.get(HERO_TITLE)!)}
              onDiscover={() => {
                const t = titleByName.get(HERO_TITLE)!;
                openTune({ kind: "title", title: t }, 0, 0, t.backdrop, t.title);
              }}
            />
          )}
          {view.name === "discover" && (
            <ThemeCarousel
              key="carousel"
              startSet={view.set}
              startIdx={view.idx}
              cardRef={sourceRef}
              keysEnabled={!detail && !tx}
              onTune={(set, idx) => {
                const th = THEME_SETS[set][idx];
                openTune({ kind: "theme", theme: th }, set, idx, themeArt(th).backdrop, th.name);
              }}
              onBack={() => go({ name: "home" })}
            />
          )}
          {view.name === "tune" && (
            <TuneView
              key={view.id}
              anchor={view.anchor}
              revealed={revealed}
              framed={!tx}
              keysEnabled={!detail && !tx && !aboutOpen}
              onBack={() => closeTune({ name: "discover", set: view.set, idx: view.idx })}
              onOpenTitle={openDiscoveryTitle}
              onRecycle={(picks) => {
                // ↻: the next theme in the set, or from a title, the top pick. Same frame, new anchor.
                if (view.anchor.kind === "theme") {
                  const idx = (view.idx + 1) % THEME_SETS[view.set].length;
                  go({ name: "tune", anchor: { kind: "theme", theme: THEME_SETS[view.set][idx] }, set: view.set, idx, id: Date.now() });
                } else if (picks && view.anchor.kind === "title") {
                  // Walk forward through the picks without bouncing back to a title already visited.
                  const visited = [...(view.visited ?? []), view.anchor.title.id];
                  const next = picks.find((t) => !visited.includes(t.id));
                  if (next) go({ name: "tune", anchor: { kind: "title", title: next }, set: view.set, idx: view.idx, id: Date.now(), visited });
                }
              }}
            />
          )}
        </Box>
      </TvSurfaceHead>

      {view.name === "home" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${tokens.space.md}px`, marginTop: `${tokens.space.md}px`, position: "relative", zIndex: 1 }} style={contentStyle}>
          {seedChannels.map((channel) => (
            <ChannelRow
              key={channel.id}
              variant="tv"
              channel={channel}
              onTileSelect={(content) => setDetail({ content })}
              onRequestSwitch={() => go({ name: "discover", set: 0, idx: 0 })}
              onOpenOverview={() => setAbout("control")}
              onOpenDiscovery={() => setAbout("discovery")}
            />
          ))}
        </Box>
      )}

      <Footer />

      <DetailModal
        open={!!detail}
        content={detail?.content ?? null}
        onClose={() => setDetail(null)}
        actionSlot={
          detailDiscover && (
            <Button
              onClick={() => {
                const t = detailDiscover;
                setDetail(null);
                window.scrollTo({ top: 0 });
                const set = view.name === "home" ? 0 : view.set;
                const idx = view.name === "home" ? 0 : view.idx;
                openTune({ kind: "title", title: t }, set, idx, t.backdrop, t.title);
              }}
              startIcon={<Sparkle />}
              sx={{ ...TV_ACTION_SX, ...TRANSLUCENT_ACTION }}
            >
              Discover
            </Button>
          )
        }
      />
      <AboutModal open={aboutOpen} kind={about ?? "discovery"} onClose={() => setAbout(null)} />
      {tx && <TxOverlay tx={tx} />}
    </>
  );
}

// ---------------------------------------------------------------- pieces

const TRANSLUCENT_ACTION = {
  backgroundColor: "rgba(60,60,66,0.72)",
  color: tokens.color.textPrimary,
  backdropFilter: "blur(6px)",
  "&:hover": { backgroundColor: "rgba(80,80,88,0.85)" },
} as const;

function Sparkle({ size = 15 }: { size?: number }) {
  return <DiscoverMark size={size} />;
}

function NewBadge() {
  return (
    <Box component="span" sx={{ backgroundColor: tokens.color.brand, color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", borderRadius: "999px", px: "7px", py: "2px", lineHeight: 1.3 }}>
      NEW
    </Box>
  );
}

function HomeBillboard({ heroRef, onPlay, onDiscover }: { heroRef: React.RefObject<HTMLDivElement>; onPlay: () => void; onDiscover: () => void }) {
  const t = titleByName.get(HERO_TITLE)!;
  return (
    <Box ref={heroRef}>
      <Billboard
        backdrop={<BillboardArt src={t.backdrop} />}
        badges={<ReasonBadge spec={{ kind: "recommend", text: "We think you'll love this" }} />}
      >
        {t.logo ? (
          <Box
            component="img"
            src={t.logo}
            alt={t.title}
            sx={{ maxWidth: "min(440px, 80%)", maxHeight: "clamp(64px, 12vw, 150px)", objectFit: "contain", objectPosition: "left bottom", alignSelf: "flex-start", filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.55))", mb: "clamp(12px, 1.6vw, 22px)" }}
          />
        ) : (
          <Typography sx={{ fontSize: "clamp(36px, 5.6vw, 80px)", fontWeight: 800, letterSpacing: "-0.02em" }}>{t.title}</Typography>
        )}
        <Typography sx={{ fontSize: "clamp(12px, 1.1vw, 15px)", fontWeight: tokens.type.weight.semibold, color: "rgba(245,245,245,0.8)", mb: "8px" }}>
          {[t.year, t.rating, runtimeLabel(t), t.genres.slice(0, 2).join(", ")].filter(Boolean).join("  ·  ")}
        </Typography>
        <Typography sx={{ color: tokens.color.textPrimary, fontSize: "clamp(13px, 1.2vw, 17px)", maxWidth: "44ch", mb: "clamp(16px, 2vw, 26px)", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          {t.overview}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "clamp(8px, 1vw, 14px)" }}>
          <Button
            onClick={onPlay}
            startIcon={<PlayArrowIcon sx={{ fontSize: "clamp(20px, 2.2vw, 28px)" }} />}
            sx={{ ...TV_ACTION_SX, backgroundColor: tokens.color.textPrimary, color: tokens.color.textInverse, "&:hover": { backgroundColor: "rgba(245,245,245,0.85)" } }}
          >
            Play
          </Button>
          <Button onClick={onDiscover} startIcon={<Sparkle />} sx={{ ...TV_ACTION_SX, ...TRANSLUCENT_ACTION }}>
            Discover
          </Button>
        </Box>
      </Billboard>
    </Box>
  );
}

/**
 * Today's AI Discover carousel. Clicking (or OK on) the focused card opens it
 * as a tune view; Get more options swaps in a whole new set of themes.
 */
function ThemeCarousel({
  startSet,
  startIdx,
  cardRef,
  keysEnabled,
  onTune,
  onBack,
}: {
  startSet: number;
  startIdx: number;
  cardRef: React.RefObject<HTMLDivElement>;
  keysEnabled: boolean;
  onTune: (set: number, idx: number) => void;
  onBack: () => void;
}) {
  const [set, setSet] = useState(startSet);
  const [idx, setIdx] = useState(startIdx);
  const [onGmo, setOnGmo] = useState(false);
  const themes = THEME_SETS[set];

  function moreOptions() {
    setSet((n) => (n + 1) % THEME_SETS.length);
    setIdx(0);
  }

  useEffect(() => {
    if (!keysEnabled) return;
    function onKey(e: KeyboardEvent) {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Enter", "Escape", "Backspace"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      if (e.key === "Escape" || e.key === "Backspace") return onGmo ? setOnGmo(false) : onBack();
      if (e.key === "ArrowLeft" && !onGmo) setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight" && !onGmo) setIdx((i) => Math.min(themes.length - 1, i + 1));
      if (e.key === "ArrowDown") setOnGmo(true);
      if (e.key === "ArrowUp") setOnGmo(false);
      if (e.key === "Enter") onGmo ? moreOptions() : onTune(set, idx);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Box
      sx={{
        position: "relative",
        height: "clamp(420px, 72vh, 820px)",
        borderRadius: `${tokens.radius.lg}px`,
        overflow: "hidden",
        backgroundColor: tokens.color.base,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(16px, 2.6vh, 32px)",
      }}
    >
      <DiscoverMark size={64} animate="intro" glow />
      <Typography sx={{ fontSize: "clamp(26px, 3.2vw, 48px)", fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center" }}>Ready for something new?</Typography>

      <Box
        key={set}
        sx={{
          position: "relative",
          width: "100%",
          height: "clamp(200px, 30vw, 440px)",
          animation: "setIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both",
          "@keyframes setIn": { from: { opacity: 0, transform: "translateX(40px)" }, to: { opacity: 1, transform: "none" } },
        }}
      >
        {themes.map((th, j) => {
          const d = j - idx;
          const focused = d === 0;
          const w = focused ? "clamp(320px, 40vw, 760px)" : "clamp(180px, 20vw, 360px)";
          const offset = d === 0 ? "0px" : `calc(${Math.sign(d)} * (clamp(320px, 40vw, 760px) / 2 + 16px + ${Math.abs(d) - 0.5} * (clamp(180px, 20vw, 360px) + 16px)))`;
          return (
            <Box
              key={th.id}
              ref={focused ? cardRef : undefined}
              onClick={() => (focused ? onTune(set, j) : setIdx(j))}
              onMouseEnter={() => setOnGmo(false)}
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: w,
                aspectRatio: "16 / 9",
                transform: `translate(calc(-50% + ${offset}), -50%)`,
                borderRadius: `${tokens.radius.md}px`,
                overflow: "hidden",
                cursor: "pointer",
                opacity: Math.abs(d) > 2 ? 0 : 1,
                zIndex: focused ? 2 : 1,
                boxShadow: focused ? "0 18px 44px rgba(0,0,0,0.55)" : "none",
                transition: `transform 380ms ${tokens.motion.easing.focus}, width 380ms ${tokens.motion.easing.focus}, opacity 300ms`,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  boxShadow: focused ? `inset 0 0 0 ${onGmo ? 1 : 2}px rgba(245,245,245,${onGmo ? 0.45 : 0.92})` : "none",
                },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${themeArt(th).backdrop})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center 30%",
                  // Stands in for the preview clip Discover plays on the focused card.
                  animation: focused ? "themeDrift 9s ease-in-out infinite alternate" : "none",
                  "@keyframes themeDrift": { from: { transform: "scale(1)" }, to: { transform: "scale(1.06)" } },
                }}
              />
              <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.75))" }} />
              <Typography sx={{ position: "absolute", left: "5%", bottom: "6%", fontSize: focused ? "clamp(20px, 2.2vw, 34px)" : "clamp(13px, 1.2vw, 18px)", fontWeight: 800 }}>{th.name}</Typography>
            </Box>
          );
        })}
      </Box>

      <Button
        onClick={moreOptions}
        onMouseEnter={() => setOnGmo(true)}
        sx={{
          ...TV_ACTION_SX,
          ...(onGmo ? { backgroundColor: tokens.color.textPrimary, color: tokens.color.textInverse, "&:hover": { backgroundColor: "rgba(245,245,245,0.85)" } } : TRANSLUCENT_ACTION),
        }}
      >
        ↻&nbsp; Get more options
      </Button>
    </Box>
  );
}

function detailFor(t: Title): DetailModalContent {
  const anchor: Anchor = { kind: "title", title: t };
  const more = rank(initialState(anchor), anchor, 6);
  const seed = hashString(t.title);
  return {
    title: t.title,
    year: t.year ?? undefined,
    kind: t.kind === "movie" ? "movie" : "tv",
    backdropUrl: t.backdrop,
    posterUrl: t.poster ?? undefined,
    logoUrl: t.logo ?? undefined,
    match: 88 + (seed % 11),
    rating: t.rating ?? "TV-14",
    runtime: runtimeLabel(t),
    formats: ["HD"],
    description: t.overview,
    cast: [],
    genres: t.genres,
    mood: [chip("tone", t.dims.tone), chip("story", t.tags.story[0])],
    maturityNotes: [],
    suggestions: more.map((m) => ({ title: m.title, backdropUrl: m.backdrop, year: m.year ?? undefined, rating: m.rating ?? undefined, runtime: runtimeLabel(m), description: m.overview })),
  };
}

/** The kaleidoscope ring and the image it grows out of. */
/** How long the card takes to grow into the frame, first time in a session. */
const GROW_MS = 1050;

function TxOverlay({ tx }: { tx: Tx }) {
  const T = (ms: number) => Math.round(ms * tx.k);
  const ease = "cubic-bezier(.2,.7,.2,1)";
  const box = (ms: number) => `left ${ms}ms ${ease}, top ${ms}ms ${ease}, width ${ms}ms ${ease}, height ${ms}ms ${ease}`;
  let ring: Rect, card: Rect, ringOp: number, cardOp: number, blur: number;
  let ringTr = "none",
    cardTr = "none";
  if (tx.dir === "in") {
    // Phase 1 is a single eased move from card to frame. The image starts to
    // dissolve a third of the way in and is gone just before the frame lands.
    const grow = Math.round(GROW_MS * tx.k);
    const glide = "cubic-bezier(.6,0,.2,1)";
    const move = `left ${grow}ms ${glide}, top ${grow}ms ${glide}, width ${grow}ms ${glide}, height ${grow}ms ${glide}`;
    ring = tx.phase >= 1 ? tx.end : tx.start;
    card = tx.phase >= 1 ? tx.end : tx.start;
    ringOp = tx.phase === 0 ? 0 : tx.phase >= 2 ? 0.55 : 1;
    cardOp = tx.phase >= 1 ? 0 : 1;
    blur = tx.phase >= 1 ? 16 : 0;
    if (tx.phase === 1) {
      ringTr = `${move}, opacity ${T(220)}ms ease`;
      cardTr = `${move}, opacity ${Math.round(grow * 0.6)}ms ease ${Math.round(grow * 0.32)}ms, filter ${Math.round(grow * 0.6)}ms ease ${Math.round(grow * 0.32)}ms`;
    }
    if (tx.phase === 2) ringTr = `opacity ${T(500)}ms ease`;
  } else {
    ring = tx.phase >= 2 ? tx.end : tx.start;
    card = tx.end;
    ringOp = tx.phase >= 2 ? 0 : tx.phase === 1 ? 1 : 0.55;
    cardOp = 0;
    blur = 0;
    if (tx.phase === 1) ringTr = `opacity ${T(200)}ms ease`;
    if (tx.phase === 2) ringTr = `${box(T(450))}, opacity ${T(450)}ms ease`;
  }
  return (
    <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1200 }}>
      {tx.art && (
        <Box
          sx={{ position: "fixed", borderRadius: `${tokens.radius.md}px`, overflow: "hidden", backgroundImage: `url(${tx.art})`, backgroundSize: "cover", backgroundPosition: "center 30%" }}
          style={{ ...card, opacity: cardOp, filter: `blur(${blur}px)`, transition: cardTr }}
        >
          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.75))" }} />
          <Typography sx={{ position: "absolute", left: "5%", bottom: "6%", fontSize: "clamp(20px, 2.6vw, 44px)", fontWeight: 800 }}>{tx.label}</Typography>
        </Box>
      )}
      <Box className="discovery-ring" sx={{ position: "fixed" }} style={{ ...ring, opacity: ringOp, transition: ringTr }} />
    </Box>
  );
}
