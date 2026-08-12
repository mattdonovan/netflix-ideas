import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { tokens } from "@/theme/tokens";
import { NetflixN } from "./NetflixLogo";

/**
 * Top navigation, TV style.
 *
 * The 2025 redesign moved the menu off the left rail and onto a centered top
 * bar — closer to tvOS than to netflix.com. Three consequences worth keeping
 * in the browser port:
 *   - the nav is centered, so it reads as chrome rather than as content;
 *   - the active item is a filled white pill, not a weight change, so the
 *     current location survives being glanced at from across a room;
 *   - the bar picks up a wash of the hero's dominant color instead of sitting
 *     on a flat black scrim, which is what makes it feel attached to the art
 *     underneath rather than floating over it.
 *
 * `leftSlot` takes the profile control so this primitive stays free of the
 * prototype's own components.
 *
 * When `fixed`, the bar pins to the viewport and hides on scroll-down /
 * returns on scroll-up. On a TV the nav is always one Back press away, so it
 * can afford to be permanent; in a browser a permanent bar is just a slice of
 * the page you never get back. Hiding it on the way down and returning it on
 * the way up gives the rows the full viewport while keeping the nav one flick
 * away — the browser's equivalent of the Back button.
 */

export const TV_NAV_HEIGHT = { xs: 56, md: 72 } as const;

/** Below this scroll offset the bar always shows — near the top it belongs to the hero. */
const ALWAYS_SHOW_ABOVE = 90;
/** Scroll delta that counts as intent, filtering jitter and rubber-band overscroll. */
const DIRECTION_THRESHOLD = 6;
/** Past this offset the bar stops wearing the hero's tint and takes a neutral scrim. */
const TINT_UNTIL = 24;

export type TvNavItem = { label: string; active?: boolean };

export function TvNav({
  items,
  leftSlot,
  tint,
  fixed = false,
}: {
  items: TvNavItem[];
  leftSlot?: ReactNode;
  /** Hero-derived color washed behind the bar. */
  tint?: string;
  /** Pin to the viewport and hide on scroll-down / show on scroll-up. */
  fixed?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    if (!fixed) return;
    lastY.current = window.scrollY;
    let raf = 0;
    function onScroll() {
      if (raf) return;
      // rAF-coalesced: scroll fires far faster than we can usefully re-render.
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setOverHero(y < TINT_UNTIL);
        const dy = y - lastY.current;
        if (Math.abs(dy) <= DIRECTION_THRESHOLD) return;
        lastY.current = y;
        setHidden(y > ALWAYS_SHOW_ABOVE && dy > 0);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fixed]);

  // Over the hero the bar wears the art's hue and fades to nothing. Once the
  // rows are underneath it there's no art to belong to, so it takes a flat
  // scrim instead — otherwise a colored wash floats over dark posters.
  const heroWash = tint
    ? `linear-gradient(180deg, ${tint} 0%, rgba(0,0,0,0) 100%)`
    : "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)";
  const scrolledWash = "linear-gradient(180deg, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.9) 100%)";

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        minHeight: TV_NAV_HEIGHT,
        paddingInline: {
          xs: `${tokens.space.md}px`,
          md: `${tokens.space.lg}px`,
          lg: `${tokens.space.xl}px`,
        },
        background: fixed && !overHero ? scrolledWash : heroWash,
        ...(fixed
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              // Above page content, below the modals (which sit at 1300).
              zIndex: 1100,
              backdropFilter: overHero ? "none" : "blur(8px)",
              opacity: hidden ? 0 : 1,
              // Nothing invisible should be clickable.
              pointerEvents: hidden ? "none" : "auto",
              transition: `opacity 260ms ${tokens.motion.easing.focus}, background 260ms ${tokens.motion.easing.focus}`,
            }
          : { position: "relative" }),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>{leftSlot}</Box>

      <Box
        component="nav"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: "4px", md: "8px", lg: "12px" },
          flexShrink: 0,
        }}
      >
        <Box
          aria-label="Search"
          sx={{
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            color: tokens.color.textPrimary,
            cursor: "pointer",
            transition: `background-color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
            "&:hover": { backgroundColor: "rgba(255,255,255,0.16)" },
          }}
        >
          <SearchIcon sx={{ fontSize: 22 }} />
        </Box>

        {items.map((item) => (
          <Typography
            key={item.label}
            sx={{
              display: { xs: item.active ? "block" : "none", sm: "block" },
              paddingInline: { xs: "12px", md: "18px" },
              paddingBlock: { xs: "5px", md: "7px" },
              borderRadius: `${tokens.radius.pill}px`,
              fontSize: { xs: 13, md: 15, lg: 16 },
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              cursor: "pointer",
              // Active = filled pill. This is the redesign's single loudest
              // legibility change and the cheapest thing to copy.
              backgroundColor: item.active ? tokens.color.textPrimary : "transparent",
              color: item.active ? tokens.color.textInverse : tokens.color.textPrimary,
              fontWeight: item.active
                ? tokens.type.weight.semibold
                : tokens.type.weight.regular,
              opacity: item.active ? 1 : 0.86,
              transition: `background-color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
              "&:hover": { opacity: 1 },
            }}
          >
            {item.label}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flex: 1 }}>
        <NetflixN size="clamp(20px, 2vw, 30px)" />
      </Box>
    </Box>
  );
}
