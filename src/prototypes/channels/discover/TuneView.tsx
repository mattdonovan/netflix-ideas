import { Box, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { tokens } from "@/theme/tokens";
import { Tile } from "@/primitives";
import { runtimeLabel, type Title } from "./catalog";
import { fitsAll, initialState, rank, reasons, rephrase, themeArt, type Anchor, type TuneState } from "./engine";
import { AI, SentenceBar } from "./SentenceBar";

/**
 * The tune view.
 *
 * Left: the theme (or title) card and a Next theme button. Right: the
 * description as an always-visible sentence whose words are the controls,
 * then the 36 picks it produces, as the homepage's own tiles.
 *
 * Click the card to go back to the Discover carousel. Every change re-ranks
 * ~5,400 titles; the page is always the best 36, and the header says how many
 * carry every word.
 */

export { AI };

type Focus = { z: "none" } | { z: "anchor" } | { z: "next" } | { z: "grid"; i: number };
export type TuneKey = "up" | "down" | "left" | "right" | "ok" | "back";

export const TuneView = forwardRef<
  HTMLDivElement,
  {
    anchor: Anchor;
    revealed: boolean;
    framed: boolean;
    keysEnabled: boolean;
    /** Back, and a click on the anchor card: both return to the Discover carousel. */
    onBack: () => void;
    onOpenTitle: (t: Title) => void;
    /** Next theme. For a title anchor, the current picks to choose the next title from. */
    onRecycle: (picks?: Title[]) => void;
  }
>(function TuneView({ anchor, revealed, framed, keysEnabled, onBack, onOpenTitle, onRecycle }, ref) {
  const theme = useTheme();
  const lg = useMediaQuery(theme.breakpoints.up("lg"));
  const md = useMediaQuery(theme.breakpoints.up("md"));
  const cols = lg ? 4 : md ? 3 : 2;

  const [state, setState] = useState<TuneState>(() => initialState(anchor));
  const [preview, setPreview] = useState<TuneState | null>(null);
  const [focus, setFocus] = useState<Focus>({ z: "none" });
  const [cardHover, setCardHover] = useState(false);
  const [turn, setTurn] = useState(1);
  const prevPicks = useRef<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const picks = useMemo(() => rank(state, anchor), [state, anchor]);
  const previewPicks = useMemo(() => (preview ? rank(preview, anchor) : null), [preview, anchor]);
  const shown = previewPicks ?? picks;
  const shownState = preview ?? state;

  // Titles that fit every word lead; the rest follow in rank order.
  const layout = useMemo(() => {
    const perfect = shown.filter((t) => fitsAll(t, shownState));
    // When everything fits, size alone says nothing, so only the first few are large.
    // Every tile is the same size; the titles that fit every word simply come first.
    const big = new Set<string>();
    const fitIds = new Set(perfect.map((t) => t.id));
    const ordered = [...shown.filter((t) => fitIds.has(t.id)), ...shown.filter((t) => !fitIds.has(t.id))];
    return pack(ordered, big, cols);
  }, [shown, shownState, cols]);

  const fresh = useMemo(() => {
    const before = prevPicks.current;
    return new Set(shown.filter((t) => before.size && !before.has(t.id)).map((t) => t.id));
  }, [shown]);
  useEffect(() => {
    prevPicks.current = new Set(picks.map((t) => t.id));
  }, [picks]);

  useEffect(() => {
    if (focus.z === "grid") gridRef.current?.querySelector(`[data-pick="${focus.i}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (focus.z === "next") nextRef.current?.focus();
  }, [focus]);

  const recycle = () => onRecycle(anchor.kind === "title" ? picks : undefined);

  // Remote-style keys for the card, Next theme and the picks. The sentence bar handles its own keys.
  useEffect(() => {
    if (!keysEnabled) return;
    const map: Record<string, TuneKey> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", Enter: "ok", Escape: "back", Backspace: "back" };
    function onKey(e: KeyboardEvent) {
      const key = map[e.key];
      if (!key) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      e.preventDefault();
      handle(key);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function toBar() {
    setFocus({ z: "none" });
    inputRef.current?.focus();
  }

  function handle(key: TuneKey) {
    const f = focus;
    switch (f.z) {
      case "none":
        if (key === "back") onBack();
        else if (key === "up") toBar();
        else if (key === "left") setFocus({ z: "anchor" });
        else setFocus({ z: "grid", i: 0 });
        return;
      case "anchor":
        if (key === "down") setFocus({ z: "next" });
        else if (key === "right") toBar();
        else if (key === "ok" || key === "back") onBack();
        return;
      case "next":
        if (key === "up") setFocus({ z: "anchor" });
        else if (key === "right") setFocus({ z: "grid", i: 0 });
        else if (key === "ok") recycle();
        else if (key === "back") onBack();
        return;
      case "grid": {
        const cur = layout[f.i];
        if (!cur) return setFocus({ z: "grid", i: 0 });
        if (key === "left" || key === "right" || key === "up" || key === "down") {
          const next = neighbour(layout, f.i, key);
          if (next !== null) setFocus({ z: "grid", i: next });
          else if (key === "left") setFocus({ z: "next" });
          else if (key === "up") toBar();
        } else if (key === "ok") onOpenTitle(cur.t);
        else if (key === "back") onBack();
        return;
      }
    }
  }

  const artTitle = anchor.kind === "theme" ? themeArt(anchor.theme) : anchor.title;
  const anchorName = anchor.kind === "theme" ? anchor.theme.name : anchor.title.title;

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        borderRadius: `${tokens.radius.lg}px`,
        backgroundColor: tokens.color.surfaceLow,
        border: framed ? "1px solid transparent" : "1px solid rgba(245,245,245,0.16)",
        minHeight: "clamp(560px, 80vh, 1100px)",
      }}
    >
      {/* Ambient art, clipped to the panel. The panel itself doesn't clip, so pick cards can pop over its edge. */}
      <Box sx={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: "-10%", backgroundImage: `url(${artTitle.backdrop})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(80px) saturate(1.25) brightness(0.32)" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,20,20,0.15), rgba(20,20,20,0.75) 60%)" }} />
      </Box>
      {framed && <Box className="discovery-ring" sx={{ position: "absolute", inset: 0, opacity: 0.55 }} />}

      <Box
        sx={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 22%) 1fr" },
          gap: "clamp(24px, 3vw, 48px)",
          padding: "clamp(24px, 3.4vw, 56px)",
          opacity: revealed ? 1 : 0,
          transition: "opacity 420ms ease",
          "& > *": revealed ? { animation: "discoveryIn 560ms cubic-bezier(0.16, 1, 0.3, 1) both" } : {},
          "& > *:nth-of-type(2)": revealed ? { animationDelay: "120ms" } : {},
          "@keyframes discoveryIn": { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "none" } },
        }}
      >
        {/* ---------------- left: the card and Next theme ---------------- */}
        <Box sx={{ position: { md: "sticky" }, top: { md: 96 }, alignSelf: "start", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px" }}>
          <Box
            onClick={onBack}
            onMouseEnter={() => setCardHover(true)}
            onMouseLeave={() => setCardHover(false)}
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: `${tokens.radius.md}px`,
              overflow: "hidden",
              cursor: "pointer",
              backgroundImage: `url(${artTitle.backdrop})`,
              backgroundSize: "cover",
              backgroundPosition: "center 25%",
              boxShadow: "0 18px 44px rgba(0,0,0,0.55)",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                pointerEvents: "none",
                boxShadow: focus.z === "anchor" || cardHover ? "inset 0 0 0 2px rgba(245,245,245,0.92)" : "none",
              },
            }}
          >
            <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85))" }} />
            <Box sx={{ position: "absolute", left: "7%", right: "7%", bottom: "8%" }}>
              {anchor.kind === "title" && anchor.title.logo ? (
                <Box component="img" src={anchor.title.logo} alt={anchorName} sx={{ maxHeight: "clamp(28px, 3vw, 52px)", maxWidth: "85%", objectFit: "contain", objectPosition: "left bottom", display: "block" }} />
              ) : (
                <Typography sx={{ fontSize: "clamp(18px, 1.8vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{anchorName}</Typography>
              )}
            </Box>
          </Box>

          <Box
            component="button"
            ref={nextRef}
            onClick={recycle}
            sx={{
              all: "unset",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: `${tokens.radius.pill}px`,
              cursor: "pointer",
              fontSize: "clamp(15px, 1.25vw, 18px)",
              fontWeight: 600,
              color: focus.z === "next" ? tokens.color.textInverse : tokens.color.textPrimary,
              backgroundColor: focus.z === "next" ? tokens.color.textPrimary : "rgba(60,60,66,0.72)",
              backdropFilter: "blur(6px)",
              "&:hover": focus.z === "next" ? {} : { backgroundColor: "rgba(80,80,88,0.85)" },
            }}
          >
            <RefreshIcon sx={{ fontSize: 22 }} />
            {anchor.kind === "theme" ? "Next theme" : "Something else like this"}
          </Box>
        </Box>

        {/* ---------------- right: the sentence, then the picks ---------------- */}
        <Box sx={{ minWidth: 0 }}>
          <SentenceBar
            state={state}
            shownState={shownState}
            picks={picks}
            anchor={anchor}
            inputRef={inputRef}
            onPreview={setPreview}
            onCommit={(next) => {
              setPreview(null);
              setState(next);
            }}
            onRephrase={() => {
              setPreview(null);
              setState(rephrase(anchor, state, turn));
              setTurn((n) => n + 1);
            }}
            onExitDown={() => {
              (document.activeElement as HTMLElement | null)?.blur();
              setFocus({ z: "grid", i: 0 });
            }}
          />


          <Box
            ref={gridRef}
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: "auto",
              gap: "clamp(12px, 1.2vw, 16px)",
              alignItems: "start",
            }}
          >
            {layout.map(({ t, col, row, big }, i) => {
              const isNew = fresh.has(t.id);
              const focused = focus.z === "grid" && focus.i === i;
              const span = big ? 2 : 1;
              return (
                <Box
                  key={t.id}
                  data-pick={i}
                  sx={{
                    gridColumn: `${col + 1} / span ${span}`,
                    gridRow: `${row + 1} / span ${span}`,
                    position: "relative",
                    animation: isNew ? `pickIn 420ms ${tokens.motion.easing.entrance} ${Math.min(i, 16) * 26}ms backwards` : undefined,
                    "@keyframes pickIn": { from: { opacity: 0, transform: "translateY(8px)" } },
                    zIndex: focused ? 5 : 1,
                    "&:hover": { zIndex: 6 },
                  }}
                >
                  <Tile
                    responsive
                    aspect="boxart"
                    title={t.title}
                    artworkUrl={big ? t.backdrop : t.backdrop.replace("/w1280/", "/w780/")}
                    expandedArtworkUrl={t.backdrop}
                    logoUrl={t.logo ?? undefined}
                    badge={isNew ? { red: "New pick" } : undefined}
                    edgeAnchor={col === 0 ? "left" : col + span >= cols ? "right" : undefined}
                    focused={focused}
                    onClick={() => onOpenTitle(t)}
                    expansion={{
                      rating: t.rating ?? undefined,
                      duration: runtimeLabel(t),
                      format: "HD",
                      moodTags: reasons(t, shownState).slice(0, 3).map((r) => r.toLowerCase()),
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

type Cell = { t: Title; col: number; row: number; big: boolean };

/** First-fit packing on a `cols`-wide grid: big tiles take 2×2, the rest 1×1, filling gaps in order. */
function pack(items: Title[], big: Set<string>, cols: number): Cell[] {
  const taken: boolean[][] = [];
  const free = (r: number, c: number) => !taken[r]?.[c];
  const take = (r: number, c: number) => {
    (taken[r] ??= [])[c] = true;
  };
  const out: Cell[] = [];
  for (const t of items) {
    const size = big.has(t.id) && cols >= 2 ? 2 : 1;
    for (let r = 0; ; r++) {
      let placed = false;
      for (let c = 0; c + size <= cols; c++) {
        let ok = true;
        for (let dr = 0; dr < size && ok; dr++) for (let dc = 0; dc < size && ok; dc++) ok = free(r + dr, c + dc);
        if (!ok) continue;
        for (let dr = 0; dr < size; dr++) for (let dc = 0; dc < size; dc++) take(r + dr, c + dc);
        out.push({ t, col: c, row: r, big: size === 2 });
        placed = true;
        break;
      }
      if (placed) break;
    }
  }
  // Reading order, so arrow keys and the "New pick" stagger follow the layout.
  return out.sort((a, b) => a.row - b.row || a.col - b.col);
}

/** The tile an arrow key lands on: nearest in that direction, measured between tile centres. */
function neighbour(cells: Cell[], i: number, dir: "left" | "right" | "up" | "down"): number | null {
  const centre = (c: Cell) => {
    const s = c.big ? 2 : 1;
    return { x: c.col + s / 2, y: c.row + s / 2 };
  };
  const from = centre(cells[i]);
  let best: number | null = null;
  let bestD = Infinity;
  cells.forEach((c, j) => {
    if (j === i) return;
    const p = centre(c);
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    const ahead = dir === "left" ? dx < -0.4 : dir === "right" ? dx > 0.4 : dir === "up" ? dy < -0.4 : dy > 0.4;
    if (!ahead) return;
    const along = dir === "left" || dir === "right" ? Math.abs(dx) : Math.abs(dy);
    const across = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);
    const d = along + across * 2;
    if (d < bestD) {
      bestD = d;
      best = j;
    }
  });
  return best;
}
