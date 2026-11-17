import { Box, Typography } from "@mui/material";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { tokens } from "@/theme/tokens";
import { interpretDetail } from "@/lib/claude";
import { OPEN_DIMS, VOCAB, chip, phrase, wordParts, type Dim, type Title } from "./catalog";
import RefreshIcon from "@mui/icons-material/Refresh";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { conflictingSlot, fitCount, fitsWithout, removable, touch, wordOptions, type Anchor, type Slot, type TuneState } from "./engine";
import { VOCAB_TEXT, fragmentOf, nextDetails, readAgainst, suggest, withValue, type Suggestion } from "./sentence";

/**
 * The description, always on screen above the picks, written as a sentence:
 *
 *   Dark crime stories with scares, set in the past, keep going…
 *
 * Every underlined word is a control. Click (or focus) a word and its options
 * appear as badges under the bar; hover a badge to preview the picks, click to
 * keep it. Remove is the last badge. Type at the end to add something new:
 * the likely completion shows in faint text (Tab or → keeps it) and previews
 * as you go. Typed text that matches nothing locally goes to Claude on Enter.
 */

export const AI = "#B9AEFF";
/** A word nothing on Netflix fits alongside the rest. */
export const CONFLICT = "#FF5A5F";
const DWELL_MS = 380;
const REMOVE = "__remove";

/** Sentence order: mood-like words, the kind of story, the noun, then clauses. */
const ROLE_ORDER = ["adj", "type", "noun", "after", "watch"] as const;
export function wordOrder(slots: Slot[]): number[] {
  return ROLE_ORDER.flatMap((role) => slots.map((s, i) => ({ s, i })).filter(({ s }) => VOCAB[s.dim].role === role).map(({ i }) => i));
}

export function SentenceBar({
  state,
  shownState,
  picks,
  anchor,
  inputRef,
  onPreview,
  onCommit,
  onExitDown,
  onRephrase,
}: {
  state: TuneState;
  /** What the picks currently show (a preview, or the committed state): the red underline follows it. */
  shownState: TuneState;
  picks: Title[];
  anchor: Anchor;
  inputRef: React.RefObject<HTMLInputElement>;
  onPreview: (s: TuneState | null) => void;
  onCommit: (s: TuneState) => void;
  /** ▼ out of the bar, to the picks. */
  onExitDown: () => void;
  /** ↻ in the bar: reword the whole idea. */
  onRephrase: () => void;
}) {
  const [text, setText] = useState("");
  const [sel, setSel] = useState(0);
  /** The word whose options are showing (a slot index), or null while typing. */
  const [word, setWord] = useState<number | null>(null);
  const [badgeFocus, setBadgeFocus] = useState<number | null>(null);
  const [thinking, setThinking] = useState(false);
  /** Backspace on an empty field marks the last word; a second Backspace removes it. */
  const [armed, setArmed] = useState<number | null>(null);
  const wordEls = useRef<Map<number, HTMLButtonElement>>(new Map());
  const badgeEls = useRef<Map<number, HTMLButtonElement>>(new Map());
  const dwell = useRef<number | undefined>(undefined);
  /** The badge whose preview is on its way (its fill sweeps across), and the one whose preview the picks now show. */
  const [pending, setPending] = useState<string | null>(null);
  const [landed, setLanded] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  /** Arrowing through the idle suggestions from the field: show and preview the one you're on. */
  const [kbSel, setKbSel] = useState(false);
  /**
   * A badge that appeared under a resting pointer (the rail changed under it
   * after a pick) ignores hover until the pointer leaves it, so a pick never
   * quietly previews whatever slid in behind it.
   */
  const stale = useRef<string | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      if (stale.current !== null) {
        const over = (e.target as Element | null)?.closest?.("[data-badge]")?.getAttribute("data-badge");
        if (over !== stale.current) stale.current = null;
      }
    };
    window.addEventListener("pointermove", track, { passive: true });
    window.addEventListener("pointerdown", track, { passive: true });
    return () => {
      window.removeEventListener("pointermove", track);
      window.removeEventListener("pointerdown", track);
    };
  }, []);

  function schedule(key: string, next: TuneState) {
    window.clearTimeout(dwell.current);
    setLanded(null);
    setPending(key);
    dwell.current = window.setTimeout(() => {
      onPreview(next);
      setPending(null);
      setLanded(key);
    }, DWELL_MS);
  }
  function unpreview() {
    window.clearTimeout(dwell.current);
    setPending(null);
    setLanded(null);
    onPreview(null);
  }
  const enter = (key: string, go: () => void) => {
    if (stale.current === key) return;
    setHoverKey(key);
    go();
  };
  const leave = (key: string, go: () => void) => {
    if (stale.current === key) {
      stale.current = null;
      return;
    }
    setHoverKey((k) => (k === key ? null : k));
    go();
  };

  const order = useMemo(() => wordOrder(state.slots), [state.slots]);
  // When nothing fits every word, the word that tipped it to zero is marked red.
  const conflict = useMemo(() => {
    const i = conflictingSlot(shownState, anchor);
    // Only words already in the sentence can be underlined; a previewed addition is beyond them.
    return i !== null && i < state.slots.length ? i : null;
  }, [shownState, state.slots.length, anchor]);
  const rephraseRef = useRef<HTMLButtonElement>(null);
  const suggestions = useMemo(() => {
    if (word !== null) return [];
    const raw = text.trim() ? suggest(text, state) : nextDetails(state, picks);
    const scored = raw.map((s) => ({ ...s, fits: fitCount(withValue(state, s.dim, s.value), anchor) }));
    // Idle suggestions only offer things that work; typed completions stay, so you can see a dead end.
    return text.trim() ? scored : scored.filter((s) => s.fits > 0);
  }, [text, state, word, picks, anchor]);
  const idle = word === null && !text.trim();
  const active = suggestions[Math.min(sel, suggestions.length - 1)];
  const { q } = fragmentOf(text);
  const ghost = !idle && active && q && active.label.toLowerCase().startsWith(q.toLowerCase()) ? active.label.slice(q.length) : "";

  // The open word's options: only ones something fits, each with how many titles fit everything with it.
  const wordSlot = word !== null ? state.slots[word] : null;
  const options = useMemo(() => {
    if (word === null || !wordSlot) return [] as Array<{ value: string; label: string; fits: number }>;
    const opts = wordOptions(state, word, anchor, picks).map((o) => ({ ...o, label: chip(wordSlot.dim, o.value) }));
    return removable(wordSlot.dim) ? [...opts, { value: REMOVE, label: "Remove", fits: fitsWithout(state, word, anchor) }] : opts;
  }, [word, wordSlot, state, anchor, picks]);
  const stateFor = (value: string): TuneState | null => {
    if (word === null || !wordSlot) return null;
    if (value === REMOVE) return { slots: state.slots.map((x, i) => (i === word ? { ...x, removed: true } : x)) };
    if (value === wordSlot.value) return null;
    return { slots: state.slots.map((x, i) => (i === word ? { ...x, value, user: true, inferred: false, at: touch() } : x)) };
  };


  // Whenever the rail's badges change (a pick, a new word, typing), the badge
  // now under a resting pointer goes stale. Runs before paint, so before the
  // browser can send that badge a hover. Fresh badges start un-hovered.
  /** `keepHovered`: on a scroll, the badge you're already on stays yours. */
  function markStale(keepHovered = false) {
    const p = pointer.current;
    const el = p ? document.elementFromPoint(p.x, p.y)?.closest<HTMLElement>("[data-badge]") : null;
    const key = el && barRef.current?.contains(el) ? (el.dataset.badge ?? null) : null;
    stale.current = keepHovered && key === hoverKey ? null : key;
  }
  useLayoutEffect(() => {
    markStale();
    setHoverKey(null);
    setKbSel(false);
  }, [state, word, text]);

  // Typing previews the likely completion after a short rest (and so does arrowing through the idle ones).
  useEffect(() => {
    if (word !== null || (idle && !kbSel)) return;
    if (!active) {
      unpreview();
      return;
    }
    schedule(`s:${active.dim}:${active.value}`, withValue(state, active.dim, active.value));
    return () => {
      window.clearTimeout(dwell.current);
      setPending(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.dim, active?.value, state, word, idle, kbSel]);

  function previewOption(i: number | null) {
    setBadgeFocus(i);
    const next = i === null ? null : stateFor(options[i].value);
    // The current value previews nothing new: the picks go back to what's kept.
    if (i === null || !next) return unpreview();
    schedule(`o:${options[i].value}`, next);
  }

  function pickOption(i: number) {
    window.clearTimeout(dwell.current);
    const value = options[i].value;
    const staged = stateFor(value);
    unpreview();
    if (!staged) return;
    if (value === REMOVE) {
      onCommit({ slots: staged.slots.filter((x) => !x.removed) });
      setWord(null);
      setBadgeFocus(null);
      return;
    }
    onCommit(staged);
    // Done with this word: let the next suggestions come up.
    setWord(null);
    setBadgeFocus(null);
  }

  function selectWord(i: number | null) {
    window.clearTimeout(dwell.current);
    unpreview();
    setBadgeFocus(null);
    setWord(i);
  }

  function accept(s: Suggestion) {
    unpreview();
    setKbSel(false);
    onCommit(withValue(state, s.dim, s.value));
    setText("");
    setSel(0);
  }

  /**
   * Enter on text that isn't a completion. First, read it against the
   * sentence locally: "or anytime" loosens (removes) the era, and a value of a
   * word that's already there replaces it. Anything left goes to Claude with
   * the whole sentence, and comes back as an edit: words to set, words to drop.
   */
  async function interpret() {
    const typed = text.trim();
    if (!typed) return;
    const local = readAgainst(typed, state);
    if (local) {
      unpreview();
      onCommit(local);
      setText("");
      return;
    }
    setThinking(true);
    const sentence = state.slots.map((x) => phrase(x.dim, x.value)).join(", ");
    const current = state.slots.map((x) => `${x.dim}=${x.value}`).join(", ");
    const edit = await interpretDetail(typed, VOCAB_TEXT, sentence, current);
    setThinking(false);
    let next = state;
    for (const dim of edit.remove) {
      if (removable(dim as Dim)) next = { slots: next.slots.filter((x) => x.dim !== dim) };
    }
    for (const m of edit.set) {
      const dim = m.dim as Dim;
      if (!(dim in VOCAB)) continue;
      if (!OPEN_DIMS.includes(dim) && !(m.value in VOCAB[dim].values)) continue;
      next = withValue(next, dim, m.value);
    }
    if (next !== state) {
      unpreview();
      onCommit(next);
      setText("");
    }
  }

  // ---------- keys ----------
  function onInputKey(e: KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation();
    if (e.key === "Backspace" && !text) {
      e.preventDefault();
      if (armed !== null && state.slots[armed]) {
        unpreview();
        onCommit({ slots: state.slots.filter((_, j) => j !== armed) });
        setArmed(null);
      } else {
        // The word you added last, else the last word in the sentence. Story and format stay.
        const removableIdx = order.filter((i) => removable(state.slots[i].dim));
        const byRecency = [...removableIdx].sort((a, b) => (state.slots[b].at ?? -1) - (state.slots[a].at ?? -1) || order.indexOf(b) - order.indexOf(a));
        setArmed(byRecency[0] ?? null);
      }
      return;
    }
    if (armed !== null) setArmed(null);
    if ((e.key === "Tab" || (e.key === "ArrowRight" && e.currentTarget.selectionStart === text.length)) && active) {
      e.preventDefault();
      accept(active);
    } else if (e.key === "ArrowRight" && e.currentTarget.selectionStart === text.length) {
      // Past the end of the sentence: the rephrase button.
      e.preventDefault();
      rephraseRef.current?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Words that edit the sentence ("or anytime") win over a partial completion.
      if (text.trim() && readAgainst(text.trim(), state)) interpret();
      else if (active && (!idle || kbSel)) accept(active);
      else interpret();
    } else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0 && order.length) {
      e.preventDefault();
      wordEls.current.get(order[order.length - 1])?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      // From the idle field, the first ▼ lands on the first suggestion; after that it moves along.
      if (!suggestions.length) onExitDown();
      else if (idle && !kbSel) {
        setKbSel(true);
        setSel(0);
      } else setSel((n) => (n + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length) {
      e.preventDefault();
      if (idle && !kbSel) {
        setKbSel(true);
        setSel(suggestions.length - 1);
      } else setSel((n) => (n - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setText("");
      setKbSel(false);
      unpreview();
      (e.target as HTMLInputElement).blur();
    }
  }

  function onWordKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    e.stopPropagation();
    const at = order.indexOf(i);
    if (e.key === "ArrowLeft" && at > 0) {
      e.preventDefault();
      wordEls.current.get(order[at - 1])?.focus();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (at < order.length - 1) wordEls.current.get(order[at + 1])?.focus();
      else inputRef.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      const cur = Math.max(0, options.findIndex((o) => o.value === state.slots[i].value));
      badgeEls.current.get(cur)?.focus();
    } else if (e.key === "Escape" || e.key === "ArrowUp") {
      e.preventDefault();
      selectWord(null);
      (e.target as HTMLButtonElement).blur();
    }
  }

  function onBadgeKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    e.stopPropagation();
    if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      badgeEls.current.get(i - 1)?.focus();
    } else if (e.key === "ArrowRight" && i < options.length - 1) {
      e.preventDefault();
      badgeEls.current.get(i + 1)?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickOption(i);
      // The word is done; back to the end of the sentence, where the next suggestions are.
      inputRef.current?.focus();
    } else if (e.key === "ArrowUp" || e.key === "Escape") {
      e.preventDefault();
      previewOption(null);
      if (word !== null) wordEls.current.get(word)?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      previewOption(null);
      onExitDown();
    }
  }

  /** How a badge looks: its preview showing, on its way, pointed at, or at rest. */
  const previewing = shownState !== state;
  const phaseOf = (key: string, hot: boolean): BadgePhase =>
    landed === key && previewing ? "on" : pending === key ? "pending" : hot || hoverKey === key ? "hot" : "rest";

  // ---------- sentence ----------
  const parts: ReactNode[] = [];
  const plain = (t: string, key: string) => (
    <Box component="span" key={key} sx={{ color: "rgba(245,245,245,0.5)", fontWeight: 400 }}>
      {t}
    </Box>
  );
  let first = true;
  let clauses = 0;
  for (const i of order) {
    const s = state.slots[i];
    const role = VOCAB[s.dim].role;
    if (role === "after" || role === "watch") parts.push(plain(clauses++ === 0 ? " " : ", ", `sep${i}`));
    else if (!first) parts.push(plain(" ", `sp${i}`));
    // Linking words ("set", "with", "starring") are plain text; only the value is a control.
    const { lead, word: raw } = wordParts(s.dim, s.value);
    const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
    if (lead) parts.push(plain(`${first ? cap(lead) : lead} `, `lead${i}`));
    parts.push(
      <Word
        key={`w${i}`}
        text={first && !lead ? cap(raw) : raw}
        slot={s}
        conflict={conflict === i}
        armed={armed === i}
        selected={word === i}
        elRef={(el) => (el ? wordEls.current.set(i, el) : wordEls.current.delete(i))}
        onSelect={() => selectWord(word === i ? null : i)}
        onFocus={() => word !== i && selectWord(i)}
        onKeyDown={(e) => onWordKey(e, i)}
      />,
    );
    first = false;
  }
  parts.push(plain(" ", "tail"));

  return (
    <Box ref={barRef} sx={{ mb: "clamp(14px, 1.6vw, 22px)" }}>
      <Box
        onMouseDown={(e: React.MouseEvent) => {
          // Clicking the bar's empty space (not a word) goes to typing.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            selectWord(null);
            inputRef.current?.focus();
          }
        }}
        sx={{
          padding: "clamp(14px, 1.4vw, 20px) clamp(16px, 1.6vw, 22px)",
          borderRadius: `${tokens.radius.md}px`,
          backgroundColor: "rgba(10,10,10,0.55)",
          border: `1px solid ${tokens.color.borderStrong}`,
          backdropFilter: "blur(10px)",
          fontSize: "clamp(18px, 1.6vw, 24px)",
          lineHeight: 1.7,
          position: "relative",
          paddingRight: "clamp(56px, 4.6vw, 68px)",
          fontWeight: 650,
          letterSpacing: "-0.01em",
          cursor: "text",
        }}
      >
        {parts}
        <Box component="span" sx={{ position: "relative", display: "inline-block", minWidth: "10ch" }}>
          <Box component="span" aria-hidden sx={{ position: "absolute", left: 0, top: 0, whiteSpace: "pre", pointerEvents: "none", font: "inherit", fontWeight: 500 }}>
            <Box component="span" sx={{ visibility: "hidden" }}>
              {text}
            </Box>
            <Box component="span" sx={{ color: "rgba(245,245,245,0.38)" }}>
              {ghost}
            </Box>
          </Box>
          <Box
            component="input"
            ref={inputRef}
            // Not a credential field: keep password managers and browser autofill out of it.
            type="text"
            name="discover-detail"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            role="combobox"
            aria-label="Add to the description"
            aria-autocomplete="inline"
            data-1p-ignore="true"
            data-lpignore="true"
            data-bwignore="true"
            data-form-type="other"
            value={text}
            onFocus={() => word !== null && selectWord(null)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const v = e.target.value;
              // Emptying the field drops what typing previewed.
              if (text.trim() && !v.trim()) unpreview();
              setText(v);
              setSel(0);
            }}
            onKeyDown={onInputKey}
            sx={{
              all: "unset",
              font: "inherit",
              fontWeight: 500,
              color: tokens.color.textPrimary,
              width: `${Math.max(10, text.length + ghost.length + 1)}ch`,
              maxWidth: "100%",
              caretColor: AI,
              "&::placeholder": { color: "rgba(245,245,245,0.35)" },
            }}
          />
        </Box>
        {thinking && (
          <Box component="span" sx={{ ml: 1, fontSize: "0.65em", fontWeight: 500, color: AI }}>
            thinking…
          </Box>
        )}
        <Box
          component="button"
          ref={rephraseRef}
          aria-label="Rephrase this idea"
          onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              inputRef.current?.focus();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              onExitDown();
            } else if (e.key === "Escape") {
              e.preventDefault();
              (e.target as HTMLButtonElement).blur();
            }
          }}
          title="Rephrase this idea"
          onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
          onClick={() => {
            selectWord(null);
            setText("");
            onRephrase();
          }}
          sx={{
            all: "unset",
            position: "absolute",
            right: "clamp(10px, 1vw, 14px)",
            top: "clamp(10px, 1vw, 14px)",
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            cursor: "pointer",
            color: tokens.color.textPrimary,
            backgroundColor: "rgba(60,60,66,0.72)",
            transition: `background-color ${tokens.motion.duration.focusFast}ms ease, transform 300ms ease`,
            "&:hover": { backgroundColor: tokens.color.textPrimary, color: tokens.color.textInverse },
            "&:active svg": { transform: "rotate(-180deg)" },
            "& svg": { transition: "transform 300ms ease" },
            "&:focus-visible": { backgroundColor: tokens.color.textPrimary, color: tokens.color.textInverse, outline: `2px solid ${tokens.color.textPrimary}`, outlineOffset: 2 },
          }}
        >
          <RefreshIcon sx={{ fontSize: 22 }} />
        </Box>
        {/* Inside the bar, under the sentence: the selected word's options, or completions while typing. Scrolls sideways like a home row. */}
        <BadgeRail resetKey={`${word}:${idle}`} onScrolled={() => markStale(true)}>
          {wordSlot && (
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tokens.color.textTertiary, mr: "4px", whiteSpace: "nowrap" }}>
              {VOCAB[wordSlot.dim].label}
            </Typography>
          )}
          {wordSlot &&
            options.map((o, i) => {
              const key = `o:${o.value}`;
              return (
                <Badge
                  key={o.value}
                  badgeKey={key}
                  label={o.label}
                  current={o.value === wordSlot.value}
                  remove={o.value === REMOVE}
                  fits={o.value === wordSlot.value ? undefined : o.fits}
                  elRef={(el) => (el ? badgeEls.current.set(i, el) : badgeEls.current.delete(i))}
                  phase={phaseOf(key, badgeFocus === i)}
                  onEnter={() => enter(key, () => previewOption(i))}
                  onLeave={() => leave(key, () => previewOption(null))}
                  onFocus={() => previewOption(i)}
                  onClick={() => pickOption(i)}
                  onKeyDown={(e) => onBadgeKey(e, i)}
                />
              );
            })}
          {!wordSlot &&
            suggestions.map((s, i) => {
              const key = `s:${s.dim}:${s.value}`;
              const hover = () => {
                setSel(i);
                // While typing (or arrowing), the effect above previews the selected one.
                if (idle && !kbSel) schedule(key, withValue(state, s.dim, s.value));
              };
              const unhover = () => {
                if (idle && !kbSel) unpreview();
              };
              return (
                <Badge
                  key={`${s.dim}:${s.value}`}
                  badgeKey={key}
                  kind={s.kind}
                  label={s.label}
                  fits={s.fits}
                  phase={phaseOf(key, hoverKey === key || ((!idle || kbSel) && i === sel))}
                  onEnter={() => enter(key, hover)}
                  onLeave={() => leave(key, unhover)}
                  onFocus={hover}
                  onBlur={unhover}
                  onClick={() => accept(s)}
                />
              );
            })}
          {!wordSlot && !suggestions.length && text.trim().length >= 3 && !thinking && (
            <Typography sx={{ fontSize: "clamp(12px, 1vw, 14px)", color: tokens.color.textTertiary }}>Enter to describe it in your own words</Typography>
          )}
        </BadgeRail>
      </Box>

    </Box>
  );
}

function Word({
  text,
  conflict,
  armed,
  selected,
  elRef,
  onSelect,
  onFocus,
  onKeyDown,
}: {
  text: string;
  slot: Slot;
  conflict: boolean;
  /** Marked by Backspace: the next Backspace removes it. */
  armed?: boolean;
  selected: boolean;
  elRef: (el: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onFocus: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Box
      component="button"
      ref={elRef}
      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
      onClick={onSelect}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      sx={{
        all: "unset",
        cursor: "pointer",
        padding: "0 5px",
        margin: "0 -5px",
        borderRadius: `${tokens.radius.sm}px`,
        whiteSpace: "nowrap",
        color: selected ? tokens.color.textInverse : tokens.color.textPrimary,
        // Purple for every control: dashed while it's the AI's guess, solid once you've set it. Red when it's the conflict.
        textDecoration: selected ? "none" : armed ? `line-through ${CONFLICT}` : `underline dotted ${conflict ? CONFLICT : AI}`,
        backgroundColor: selected ? tokens.color.textPrimary : armed ? "rgba(255,90,95,0.18)" : "transparent",
        textUnderlineOffset: "6px",
        textDecorationThickness: "2px",
        transition: `background-color ${tokens.motion.duration.focusFast}ms ease, color ${tokens.motion.duration.focusFast}ms ease`,
        "&:hover": selected ? {} : { backgroundColor: "rgba(245,245,245,0.1)" },
        "&:focus-visible": { outline: `2px solid ${tokens.color.textPrimary}`, outlineOffset: 2 },
      }}
    >
      {text}
    </Box>
  );
}

/**
 * rest → hot (pointed at: lighter) → pending (a fill sweeps across for the
 * dwell, so you can see the picks are about to change) → on (white: the picks
 * below are showing this). Keyboard focus adds a ring on top of any of them.
 */
type BadgePhase = "rest" | "hot" | "pending" | "on";

function Badge({
  badgeKey,
  label,
  kind,
  count,
  fits,
  current,
  remove,
  phase = "rest",
  elRef,
  onEnter,
  onLeave,
  onFocus,
  onBlur,
  onClick,
  onKeyDown,
}: {
  badgeKey: string;
  label: string;
  kind?: string;
  count?: number;
  /** Perfect fits this choice would give. Only shown when there are some. */
  fits?: number;
  current?: boolean;
  remove?: boolean;
  phase?: BadgePhase;
  elRef?: (el: HTMLButtonElement | null) => void;
  onEnter?: () => void;
  onLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const on = phase === "on";
  const lit = phase === "hot" || phase === "pending";
  return (
    <Box
      component="button"
      ref={elRef}
      data-badge={badgeKey}
      data-phase={phase}
      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}
      onKeyDown={onKeyDown}
      sx={{
        all: "unset",
        position: "relative",
        isolation: "isolate",
        // Clips the dwell sweep to the pill; flexShrink keeps the rail from squeezing the label to fit.
        overflow: "hidden",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        whiteSpace: "nowrap",
        borderRadius: `${tokens.radius.pill}px`,
        cursor: "pointer",
        fontSize: "clamp(15px, 1.25vw, 18px)",
        // Weight never changes with the phase: a badge that grows on hover shifts the row under the pointer.
        fontWeight: current ? 700 : 600,
        color: on ? tokens.color.textInverse : remove && !lit ? tokens.color.textSecondary : tokens.color.textPrimary,
        backgroundColor: on ? tokens.color.textPrimary : lit ? "rgba(78,78,86,0.95)" : current ? "rgba(245,245,245,0.16)" : "rgba(60,60,66,0.72)",
        border: `1px solid ${current && !on ? "rgba(245,245,245,0.7)" : "transparent"}`,
        transition: `background-color ${tokens.motion.duration.focusFast}ms ease, color ${tokens.motion.duration.focusFast}ms ease`,
        // The dwell, made visible: a bar fills along the bottom, and when it's full the picks change.
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          zIndex: -1,
          backgroundColor: tokens.color.textPrimary,
          transformOrigin: "left center",
          transform: "scaleX(0)",
          animation: phase === "pending" ? `badgeDwell ${DWELL_MS}ms linear forwards` : "none",
        },
        "@keyframes badgeDwell": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        "@media (prefers-reduced-motion: reduce)": { "&::before": { animation: "none" } },
        "&:focus-visible": { outline: `2px solid ${tokens.color.textPrimary}`, outlineOffset: 2 },
      }}
    >
      {kind && (
        <Box component="span" sx={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>
          {kind}
        </Box>
      )}
      {current && "✓ "}
      {remove && "✕ "}
      {label}
      {count ? (
        <Box component="span" sx={{ opacity: 0.55, fontWeight: 500 }}>
          {count}
        </Box>
      ) : null}
      {fits !== undefined && fits > 0 && (
        <Box component="span" sx={{ fontSize: "0.85em", fontWeight: 700, color: on ? "#5a49d0" : AI }}>
          +{fits.toLocaleString()}
        </Box>
      )}
    </Box>
  );
}

/**
 * A single sideways-scrolling row of badges, like a home row: no wrapping,
 * chevrons fade in on hover when there's more to either side, the edges fade
 * out, and a focused badge scrolls itself into view.
 */
function BadgeRail({ children, resetKey, onScrolled }: { children: ReactNode; resetKey: string; onScrolled: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    // Same edges, same object: no re-render (this runs after every render).
    setEdges((e) => (e.left === left && e.right === right ? e : { left, right }));
  };
  useLayoutEffect(() => {
    ref.current?.scrollTo({ left: 0 });
    measure();
  }, [resetKey]);
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  });
  const step = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const fade = `linear-gradient(90deg, ${edges.left ? "transparent" : "#000"} 0, #000 ${edges.left ? 48 : 0}px, #000 calc(100% - ${edges.right ? 48 : 0}px), ${edges.right ? "transparent" : "#000"} 100%)`;
  return (
    <Box sx={{ position: "relative", mt: "9px", lineHeight: 1.3, fontWeight: 600, letterSpacing: 0, "&:hover .rail-step": { opacity: 1 } }}>
      <Box
        ref={ref}
        onScroll={() => {
          measure();
          // A badge that scrolled under a resting pointer waits for the pointer to move.
          onScrolled();
        }}
        onFocusCapture={(e) => (e.target as HTMLElement).scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" })}
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "nowrap",
          gap: "8px",
          minHeight: 44,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          // No scroll snap: it re-snaps whenever a badge's layout changes, which moved badges out from under the pointer.
          "& > *": { flexShrink: 0 },
          maskImage: fade,
          WebkitMaskImage: fade,
          py: "5px",
          px: "5px",
          mx: "-5px",
          scrollPaddingInline: "5px",
        }}
      >
        {children}
      </Box>
      {(["left", "right"] as const).map((side) =>
        edges[side] ? (
          <Box
            key={side}
            className="rail-step"
            component="button"
            aria-label={side === "left" ? "Earlier options" : "More options"}
            onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
            onClick={() => step(side === "left" ? -1 : 1)}
            sx={{
              all: "unset",
              position: "absolute",
              top: "50%",
              [side]: -6,
              transform: "translateY(-50%)",
              width: 30,
              height: 30,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              cursor: "pointer",
              opacity: 0,
              color: tokens.color.textPrimary,
              backgroundColor: "rgba(20,20,20,0.9)",
              border: "1px solid rgba(245,245,245,0.2)",
              transition: `opacity ${tokens.motion.duration.focusFast}ms ease`,
              "&:hover": { backgroundColor: tokens.color.textPrimary, color: tokens.color.textInverse },
            }}
          >
            {side === "left" ? <ChevronLeftIcon sx={{ fontSize: 20 }} /> : <ChevronRightIcon sx={{ fontSize: 20 }} />}
          </Box>
        ) : null,
      )}
    </Box>
  );
}
