import { tokens } from "@/theme/tokens";

/**
 * Metrics shared by every primary action on the Netflix TV surface — the
 * billboard's CTAs, the buttons inside a focused card, and the detail modal's
 * Play row.
 *
 * They're one size on purpose. All three sit on artwork at the same distance
 * from the viewer, so sizing each by its container would make the card's
 * controls read as a lesser class of button than the billboard's. The pill
 * radius is the 2025 redesign's button shape; the square-cornered buttons in
 * this repo are leftovers from the netflix.com language it replaced.
 */
/**
 * The glyph box inside an action button. Also fixes the button's height, and
 * is exported so callers whose icon overhangs the box can work out how far.
 */
export const TV_ACTION_ICON_BOX = "clamp(24px, 2.6vw, 32px)";
const ICON_BOX = TV_ACTION_ICON_BOX;

export const TV_ACTION_SX = {
  fontSize: "clamp(13px, 1.3vw, 17px)",
  fontWeight: tokens.type.weight.bold,
  paddingInline: "clamp(18px, 2.4vw, 32px)",
  minHeight: "clamp(34px, 3.4vw, 46px)",
  borderRadius: `${tokens.radius.pill}px`,
  textTransform: "none" as const,
  whiteSpace: "nowrap" as const,
  // The icon box is pinned to ICON_BOX rather than left to size itself, which
  // does two things. It fixes the button's height, so swapping an SVG glyph for
  // a taller avatar can't stretch the button. And with `overflow: visible` and
  // centred alignment, anything larger than the box simply overhangs it, which
  // is how the face pile runs ~1.4x the glyph size inside the same button.
  //
  // (The nested font-size rule is needed because MUI pins startIcon glyphs to
  // 20px via `.MuiButton-startIcon > *:nth-of-type(1)`, which outranks an `sx`
  // fontSize set on the icon element itself.)
  "& .MuiButton-startIcon": {
    marginRight: "10px",
    marginLeft: "-4px",
    height: ICON_BOX,
    display: "flex",
    alignItems: "center",
    overflow: "visible",
  },
  "& .MuiButton-startIcon > *:nth-of-type(1)": { fontSize: ICON_BOX },
};
