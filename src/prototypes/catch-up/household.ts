import { hashString, buildRowMeta } from "@/surfaces/netflix-tv";
import type { CatalogEntry } from "@/lib/catalog";
import mattAvatarUrl from "@/assets/matt-avatar.png";

/**
 * The household model behind Catch Up.
 *
 * Netflix knows a lot about what each *profile* watches and nothing about
 * which profiles watch *together*. This prototype's premise is that the second
 * fact is the interesting one, and that the cheapest way to collect it is to
 * let people move their own marker to someone else's.
 *
 * There is no backend, so every position is derived from a hash of
 * `title + memberId`: stable across reloads, identical wherever the same title
 * appears, and varied enough between members that rows look real. The same
 * trick the rest of the TV surface uses for synthesized metadata.
 *
 * Nothing here is shared state. A position is only ever *read* across
 * profiles; the one write in the whole feature is a member moving their own
 * marker, which is what `jump()` in CatchUp.tsx does.
 */

export type Member = {
  id: string;
  name: string;
  /** Monogram fallback, so the prototype needs no avatar art. */
  initials: string;
  color: string;
  /** The profile the browser is signed into. */
  isViewer?: boolean;
  /** The viewer reuses the nav avatar so the two read as the same person. */
  photoUrl?: string;
};

/**
 * Profile photos come from TMDB, the same source as the catalog artwork, so
 * nothing third-party is vendored into the repo. Theo keeps a monogram — a
 * real household mixes photos and default avatars.
 */
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w300";

export const household: Member[] = [
  { id: "matt", name: "Matt", initials: "M", color: "#3D6FFF", isViewer: true, photoUrl: mattAvatarUrl },
  {
    id: "kristin",
    name: "Kristin",
    initials: "K",
    color: "#E83A1A",
    // Kristen Bell's headshot, standing in for a real household member.
    photoUrl: `${TMDB_PROFILE}/rP74dJXl7EjinGM0shQtUOlH5s2.jpg`,
  },
  { id: "theo", name: "Theo", initials: "T", color: "#7B2FFF" },
  {
    id: "kids",
    name: "Kids",
    initials: "K",
    color: "#FF8C00",
    photoUrl: `${TMDB_PROFILE}/qOwnmR5gbOT6ygp17YyLlEKXD38.jpg`,
  },
];

export const viewer = household.find((m) => m.isViewer)!;
export const others = household.filter((m) => !m.isViewer);

export function memberById(id: string): Member {
  return household.find((m) => m.id === id) ?? viewer;
}

/**
 * Where one member is in one title.
 *
 * `rank` is the sortable unit — episode index for series, elapsed minutes for
 * films — and is what "ahead" and "behind" are measured in. Everything else is
 * presentation.
 */
export type Position = {
  memberId: string;
  rank: number;
  /** 0–1 through the whole title. */
  progress: number;
  /** "S2:E4" or "1h 12m in". */
  label: string;
  /** "2 days ago". */
  lastWatched: string;
  season?: number;
  episode?: number;
};

/** Shape of a title as far as the household is concerned. */
export type TitleShape = {
  key: string;
  title: string;
  kind: "movie" | "tv" | "game";
  /** Total sortable units: episodes for series, minutes for films. */
  units: number;
  seasons: number;
  episodesPerSeason: number;
};

const EPISODES_PER_SEASON = 8;
const DEFAULT_RUNTIME_MIN = 118;

/**
 * Derive a title's shape from its catalog entry.
 *
 * Season count is read back out of the *same* string the row and detail
 * metadata display ("3 Seasons", "Limited Series"), rather than hashed
 * independently. Two hashes of the same title would disagree, and a timeline
 * claiming two seasons under an info block claiming three is the kind of
 * detail that makes a prototype read as fake.
 */
function seasonsFromMeta(entry: CatalogEntry | null, fallbackTitle: string): number {
  const length = buildRowMeta(entry, fallbackTitle).metaParts.at(-1) ?? "";
  const n = parseInt(length, 10);
  return Number.isFinite(n) && n > 0 ? n : 1; // "Limited Series" → one season
}

export function titleShape(entry: CatalogEntry | null, fallbackTitle: string): TitleShape {
  const title = entry?.title ?? fallbackTitle;
  const seed = hashString(title);
  const kind = entry?.kind ?? (seed % 2 === 0 ? "tv" : "movie");
  if (kind === "tv") {
    const seasons = seasonsFromMeta(entry, fallbackTitle);
    return {
      key: title,
      title,
      kind: "tv",
      seasons,
      episodesPerSeason: EPISODES_PER_SEASON,
      units: seasons * EPISODES_PER_SEASON,
    };
  }
  const runtime = DEFAULT_RUNTIME_MIN + (seed % 40);
  return { key: title, title, kind: kind === "game" ? "game" : "movie", seasons: 0, episodesPerSeason: 0, units: runtime };
}

const DAYS_AGO = ["today", "yesterday", "2 days ago", "4 days ago", "last week", "2 weeks ago"];

function labelFor(shape: TitleShape, rank: number): { label: string; season?: number; episode?: number } {
  if (shape.kind !== "tv") {
    const h = Math.floor(rank / 60);
    const m = rank % 60;
    return { label: h > 0 ? `${h}h ${m}m in` : `${m}m in` };
  }
  const season = Math.floor(rank / shape.episodesPerSeason) + 1;
  const episode = (rank % shape.episodesPerSeason) + 1;
  return { label: `S${season}:E${episode}`, season, episode };
}

export function positionAt(shape: TitleShape, memberId: string, rank: number): Position {
  const clamped = Math.max(0, Math.min(shape.units - 1, Math.round(rank)));
  const seed = hashString(shape.title + memberId);
  return {
    memberId,
    rank: clamped,
    progress: shape.units > 0 ? clamped / shape.units : 0,
    lastWatched: DAYS_AGO[seed % DAYS_AGO.length],
    ...labelFor(shape, clamped),
  };
}

/**
 * How often a member shows up on a title.
 *
 * Overlap is the whole point of the surface but it has to stay rare to mean
 * anything: a household where everyone has started everything is a household
 * where "Kristin is on this too" carries no information. At 7% per non-viewer
 * member across three of them, roughly one title in five has anyone else on
 * it, and most of those have exactly one — which is what a real house looks
 * like.
 */
const VIEWER_RATE = 26;
const MEMBER_RATE = 7;

/**
 * Titles the household is guaranteed to share, so the surface has a known-good
 * lead instead of depending on the hash lottery. Ranks are fractions of the
 * title so they hold whatever season count the metadata hands us.
 */
const FEATURED: Record<string, Array<{ memberId: string; at: number }>> = {
  "The Boroughs": [
    { memberId: "matt", at: 0.08 },
    { memberId: "kristin", at: 0.72 },
    { memberId: "kids", at: 0.3 },
  ],
  "The Florida Project": [
    { memberId: "matt", at: 0.21 },
    { memberId: "kristin", at: 0.64 },
  ],
};

export function seededPositions(shape: TitleShape): Position[] {
  if (shape.kind === "game") return [];

  const featured = FEATURED[shape.title];
  if (featured) {
    return featured.map((f) =>
      positionAt(shape, f.memberId, Math.round(f.at * (shape.units - 1))),
    );
  }

  const out: Position[] = [];
  for (const member of household) {
    const h = hashString(shape.title + ":" + member.id);
    if (h % 100 >= (member.isViewer ? VIEWER_RATE : MEMBER_RATE)) continue;
    const rank = (h >> 7) % shape.units;
    out.push(positionAt(shape, member.id, rank));
  }
  return out;
}

/** Positions belonging to everyone except the viewer. */
export function otherPositions(positions: Position[]): Position[] {
  return positions.filter((p) => p.memberId !== viewer.id);
}

export function viewerPosition(positions: Position[]): Position | undefined {
  return positions.find((p) => p.memberId === viewer.id);
}

/**
 * The single most useful jump on a title: the member furthest ahead of the
 * viewer. Undefined when nobody is ahead — which is the case the Jump control
 * is supposed to disappear for.
 */
export function furthestAhead(positions: Position[]): Position | undefined {
  const mine = viewerPosition(positions);
  const floor = mine?.rank ?? -1;
  return otherPositions(positions)
    .filter((p) => p.rank > floor)
    .sort((a, b) => b.rank - a.rank)[0];
}

/** "3 episodes ahead" / "22 minutes ahead" — the copy on a face-pile badge. */
export function gapLabel(shape: TitleShape, ahead: Position, mine?: Position): string {
  const delta = ahead.rank - (mine?.rank ?? 0);
  if (shape.kind === "tv") {
    if (!mine) return `${memberById(ahead.memberId).name} is on ${ahead.label}`;
    return delta === 1
      ? `${memberById(ahead.memberId).name} is an episode ahead`
      : `${memberById(ahead.memberId).name} is ${delta} episodes ahead`;
  }
  if (!mine) return `${memberById(ahead.memberId).name} is ${ahead.label}`;
  return `${memberById(ahead.memberId).name} is ${delta} minutes ahead`;
}
