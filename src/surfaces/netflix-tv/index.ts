/**
 * The Netflix TV surface — the chrome every prototype in this repo that quotes
 * the 2025 TV redesign is built on. Nothing here knows about any one
 * prototype's feature: no Control, no Catch Up, no tuning, no household.
 *
 * Consumers compose it: `<TvFrame>` → `<TvSurfaceHead>` wrapping a
 * `<Billboard>` → their own rows → `<Footer>`.
 */
export { TvSurfaceHead, TV_NAV_ITEMS } from "./Shell";
export { Billboard, BillboardArt, BillboardSkeleton, HeroSkeletonBar } from "./Billboard";
export { Footer } from "./Footer";
export { TV_ACTION_SX, TV_ACTION_ICON_BOX } from "./actions";
export { ProfileMenu, ProfileCard } from "./ProfileMenu";
export type { ProfileCardAlign } from "./ProfileMenu";
export { DetailModal } from "./DetailModal";
export type { DetailModalContent, DetailModalSuggestion } from "./DetailModal";
export {
  buildRowMeta,
  buildDetailContent,
  ageChip,
  hashString,
  pickFrom,
  sampleN,
  darken,
} from "./metadata";
