import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Spatial focus manager.
 *
 * Conceptual model:
 *   - The page is a vertical stack of named "sections" (typically rows).
 *   - Each section has an ordered list of focusable items.
 *   - One section is "active" at a time. Within that section, one item is focused.
 *   - Arrow Up / Down moves between sections (clamped at the ends).
 *   - Arrow Left / Right moves between items inside the active section.
 *   - Enter / Space invokes the focused item's onSelect.
 *
 * Why not a generic geometry-based focus engine? On TV the row-and-index
 * mental model maps directly to the layout discipline (`<Row>` of `<Tile>`s).
 * This makes navigation deterministic and easy to reason about without
 * needing every component to expose a DOM rect.
 */

type FocusState = {
  activeSectionId: string | null;
  sectionIndex: Record<string, number>; // sectionId -> active item index
  sectionItemCounts: Record<string, number>; // sectionId -> count
  sectionOrder: string[]; // top-to-bottom ordering
};

type Direction = "up" | "down" | "left" | "right";

type FocusContextValue = {
  state: FocusState;
  registerSection: (id: string, itemCount: number) => () => void;
  setSectionItemCount: (id: string, count: number) => void;
  focusSection: (id: string, itemIndex?: number) => void;
  focusItem: (sectionId: string, index: number) => void;
  move: (direction: Direction) => void;
  isItemFocused: (sectionId: string, index: number) => boolean;
  onSelect: (sectionId: string, index: number, handler: () => void) => () => void;
  invokeSelect: () => void;
};

const FocusContext = createContext<FocusContextValue | null>(null);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FocusState>({
    activeSectionId: null,
    sectionIndex: {},
    sectionItemCounts: {},
    sectionOrder: [],
  });

  /**
   * onSelect handlers live in a ref-keyed map so they don't trigger
   * re-renders when registered/replaced.
   */
  const handlersRef = useRef<Map<string, () => void>>(new Map());
  const handlerKey = (sectionId: string, index: number) => `${sectionId}::${index}`;

  const registerSection = useCallback(
    (id: string, itemCount: number) => {
      setState((s) => {
        if (s.sectionOrder.includes(id)) {
          // Already registered — just update count (idempotent).
          return {
            ...s,
            sectionItemCounts: { ...s.sectionItemCounts, [id]: itemCount },
          };
        }
        const order = [...s.sectionOrder, id];
        const active = s.activeSectionId ?? id;
        return {
          ...s,
          activeSectionId: active,
          sectionOrder: order,
          sectionIndex: { ...s.sectionIndex, [id]: s.sectionIndex[id] ?? 0 },
          sectionItemCounts: { ...s.sectionItemCounts, [id]: itemCount },
        };
      });

      return () => {
        setState((s) => {
          const order = s.sectionOrder.filter((sid) => sid !== id);
          const { [id]: _, ...indexRest } = s.sectionIndex;
          const { [id]: __, ...countRest } = s.sectionItemCounts;
          const active = s.activeSectionId === id ? order[0] ?? null : s.activeSectionId;
          return {
            ...s,
            sectionOrder: order,
            activeSectionId: active,
            sectionIndex: indexRest,
            sectionItemCounts: countRest,
          };
        });
      };
    },
    [],
  );

  const setSectionItemCount = useCallback((id: string, count: number) => {
    setState((s) => {
      if (s.sectionItemCounts[id] === count) return s;
      const idx = s.sectionIndex[id] ?? 0;
      const clamped = count === 0 ? 0 : Math.min(idx, count - 1);
      return {
        ...s,
        sectionItemCounts: { ...s.sectionItemCounts, [id]: count },
        sectionIndex: { ...s.sectionIndex, [id]: clamped },
      };
    });
  }, []);

  const focusSection = useCallback((id: string, itemIndex?: number) => {
    setState((s) => {
      if (!s.sectionOrder.includes(id)) return s;
      return {
        ...s,
        activeSectionId: id,
        sectionIndex:
          itemIndex !== undefined
            ? { ...s.sectionIndex, [id]: itemIndex }
            : s.sectionIndex,
      };
    });
  }, []);

  const focusItem = useCallback((sectionId: string, index: number) => {
    setState((s) => ({
      ...s,
      activeSectionId: sectionId,
      sectionIndex: { ...s.sectionIndex, [sectionId]: index },
    }));
  }, []);

  const move = useCallback((direction: Direction) => {
    setState((s) => {
      const { activeSectionId, sectionOrder, sectionIndex, sectionItemCounts } = s;
      if (!activeSectionId) return s;
      const sectionPos = sectionOrder.indexOf(activeSectionId);

      if (direction === "up" || direction === "down") {
        const nextPos = direction === "up" ? sectionPos - 1 : sectionPos + 1;
        if (nextPos < 0 || nextPos >= sectionOrder.length) return s;
        const nextSectionId = sectionOrder[nextPos];
        // Preserve current item index but clamp to next section's bounds.
        const targetIdx = sectionIndex[nextSectionId] ?? 0;
        const count = sectionItemCounts[nextSectionId] ?? 0;
        const clamped = count === 0 ? 0 : Math.min(targetIdx, count - 1);
        return {
          ...s,
          activeSectionId: nextSectionId,
          sectionIndex: { ...sectionIndex, [nextSectionId]: clamped },
        };
      }

      // Left/right within active section
      const count = sectionItemCounts[activeSectionId] ?? 0;
      if (count === 0) return s;
      const current = sectionIndex[activeSectionId] ?? 0;
      const delta = direction === "left" ? -1 : 1;
      const next = Math.max(0, Math.min(count - 1, current + delta));
      if (next === current) return s;
      return {
        ...s,
        sectionIndex: { ...sectionIndex, [activeSectionId]: next },
      };
    });
  }, []);

  const isItemFocused = useCallback(
    (sectionId: string, index: number) => {
      return (
        state.activeSectionId === sectionId &&
        (state.sectionIndex[sectionId] ?? 0) === index
      );
    },
    [state],
  );

  const onSelect = useCallback(
    (sectionId: string, index: number, handler: () => void) => {
      const key = handlerKey(sectionId, index);
      handlersRef.current.set(key, handler);
      return () => {
        if (handlersRef.current.get(key) === handler) {
          handlersRef.current.delete(key);
        }
      };
    },
    [],
  );

  const invokeSelect = useCallback(() => {
    setState((s) => {
      if (!s.activeSectionId) return s;
      const idx = s.sectionIndex[s.activeSectionId] ?? 0;
      const key = handlerKey(s.activeSectionId, idx);
      const handler = handlersRef.current.get(key);
      if (handler) {
        // Defer to keep the call out of the render cycle.
        queueMicrotask(handler);
      }
      return s;
    });
  }, []);

  /**
   * Global key handler. Arrow keys move; Enter/Space selects.
   * Ignores key events that originate inside a real input/textarea so the
   * user can type into the prompt panel without the focus engine stealing
   * the keystrokes.
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          move("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          move("down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          move("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          move("right");
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          invokeSelect();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, invokeSelect]);

  const value = useMemo<FocusContextValue>(
    () => ({
      state,
      registerSection,
      setSectionItemCount,
      focusSection,
      focusItem,
      move,
      isItemFocused,
      onSelect,
      invokeSelect,
    }),
    [state, registerSection, setSectionItemCount, focusSection, focusItem, move, isItemFocused, onSelect, invokeSelect],
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocusContext() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocusContext must be used inside <FocusProvider>");
  return ctx;
}

/**
 * Register a section (row). Returns the section state + helpers.
 * Item count can change dynamically — pass the live count.
 */
export function useSection(sectionId: string, itemCount: number) {
  const ctx = useFocusContext();

  useEffect(() => {
    const unregister = ctx.registerSection(sectionId, itemCount);
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  useEffect(() => {
    ctx.setSectionItemCount(sectionId, itemCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, itemCount]);

  const activeIndex = ctx.state.sectionIndex[sectionId] ?? 0;
  const isActive = ctx.state.activeSectionId === sectionId;

  return {
    activeIndex,
    isActive,
    focusItem: (i: number) => ctx.focusItem(sectionId, i),
    focusSection: () => ctx.focusSection(sectionId),
  };
}

/**
 * Register an item within a section. Returns whether this item is currently
 * focused, plus a setter (used e.g. by mouse handlers in dev).
 */
export function useFocusable(
  sectionId: string,
  index: number,
  onSelectHandler?: () => void,
) {
  const ctx = useFocusContext();

  useEffect(() => {
    if (!onSelectHandler) return;
    return ctx.onSelect(sectionId, index, onSelectHandler);
  }, [ctx, sectionId, index, onSelectHandler]);

  const focused = ctx.isItemFocused(sectionId, index);
  return {
    focused,
    setFocus: () => ctx.focusItem(sectionId, index),
  };
}
