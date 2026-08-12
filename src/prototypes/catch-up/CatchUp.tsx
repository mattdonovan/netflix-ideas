import { Box, Typography, Button } from "@mui/material";
import { useMemo, useRef, useState } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { tokens } from "@/theme/tokens";
import { TvFrame, FocusRow } from "@/primitives";
import type { FocusRowItem } from "@/primitives";
import { FocusProvider } from "@/lib/focus";
import {
  TvSurfaceHead,
  Billboard,
  BillboardArt,
  Footer,
  DetailModal,
  buildRowMeta,
  buildDetailContent,
  hashString,
  TV_ACTION_SX,
  type DetailModalContent,
} from "@/surfaces/netflix-tv";
import { catalog, type CatalogEntry } from "@/lib/catalog";
import { FacePile } from "./Avatars";
import { JumpControl, HouseholdTimeline } from "./Jump";
import {
  furthestAhead,
  household,
  memberById,
  otherPositions,
  positionAt,
  seededPositions,
  titleShape,
  viewer,
  viewerPosition,
  type Position,
  type TitleShape,
} from "./household";

/**
 * Catch Up — household watch state on the Netflix TV surface.
 *
 * Netflix knows what each profile watches and nothing about which profiles
 * watch together. Today, two people who watch a show side by side have to pick
 * whose account it "lives" in, and the other one either loses their place or
 * hops profiles to find it. Catch Up removes the hop: you stay in your own
 * profile, you can see where everyone else in the house is, and one action
 * moves your own marker to theirs.
 *
 * The whole feature is one verb. Nothing is shared, nothing is merged, and
 * Play is untouched — see Jump.tsx for why that matters.
 *
 * Visibility (who in the house can see whose progress) is a household setting
 * configured once in account admin, not a per-title decision, so there are no
 * share or hide controls on cards here. That admin surface is a separate piece
 * of work.
 */

export function CatchUp() {
  return (
    <FocusProvider>
      <TvFrame>
        <CatchUpContent />
      </TvFrame>
    </FocusProvider>
  );
}

/** A viewer marker moved by Jump, overriding the seeded one. */
type JumpRecord = {
  rank: number;
  /** Where the viewer was before the jump — powers "back to my spot". */
  previousRank?: number;
};

/** One title, with the household's positions on it resolved. */
type HouseTitle = {
  entry: CatalogEntry;
  shape: TitleShape;
  positions: Position[];
  mine?: Position;
  ahead?: Position;
};

const ROW_SIZE = 12;

/** The title the hero leads with — see FEATURED in household.ts. */
const FEATURED_TITLE = "The Boroughs";

function CatchUpContent() {
  const [detail, setDetail] = useState<DetailModalContent | null>(null);
  const [jumps, setJumps] = useState<Record<string, JumpRecord>>({});

  // Every title the household could have touched. Games are excluded — the
  // household model is about resuming a timeline, and a save file isn't one.
  const titles: HouseTitle[] = useMemo(() => {
    const pool = catalog.filter((c) => c.backdropUrl && c.posterUrl && c.kind !== "game");
    return pool.map((entry) => {
      const shape = titleShape(entry, entry.title);
      const seeded = seededPositions(shape);
      const jump = jumps[shape.key];
      // The jump record replaces the viewer's seeded position; everyone
      // else's is read-only and untouched by anything the viewer does.
      const positions = jump
        ? [...seeded.filter((p) => p.memberId !== viewer.id), positionAt(shape, viewer.id, jump.rank)].sort(
            (a, b) => household.findIndex((m) => m.id === a.memberId) - household.findIndex((m) => m.id === b.memberId),
          )
        : seeded;
      return {
        entry,
        shape,
        positions,
        mine: viewerPosition(positions),
        ahead: furthestAhead(positions),
      };
    });
  }, [jumps]);

  const rows = useMemo(() => buildRows(titles), [titles]);

  // The billboard pins to whatever led on first render. Without this, jumping
  // from the hero closes the gap that put it there, the row re-sorts, and the
  // whole billboard swaps under the cursor that just clicked it — which also
  // puts the undo out of reach, since "back to my spot" lives on the title you
  // jumped in.
  const leadKeyRef = useRef<string | null>(null);
  if (leadKeyRef.current === null && rows.catchUp[0]) {
    // Prefer the title the household model guarantees overlap on, so the hero
    // is never at the mercy of which hashes happened to line up.
    const featured = rows.catchUp.find((t) => t.shape.key === FEATURED_TITLE);
    leadKeyRef.current = (featured ?? rows.catchUp[0]).shape.key;
  }
  const lead = titles.find((t) => t.shape.key === leadKeyRef.current) ?? rows.catchUp[0];

  function openDetail(t: HouseTitle) {
    setDetail(
      buildDetailContent({
        entry: t.entry,
        fallbackTitle: t.entry.title,
        mood: ["watched together"],
      }),
    );
  }

  // The only write in the whole feature: your own marker moves. No history is
  // added or removed, and nobody else's timeline is touched.
  function applyJump(t: HouseTitle, rank: number) {
    setJumps((prev) => ({
      ...prev,
      [t.shape.key]: {
        rank,
        // Only record a way back the first time; jumping twice shouldn't
        // overwrite the position the member actually earned.
        previousRank: prev[t.shape.key]?.previousRank ?? t.mine?.rank,
      },
    }));
  }

  // The detail modal and the jump sheet both need the live title record, and
  // `jumps` changes underneath them, so re-resolve by key rather than holding
  // a stale object.
  const detailTitle = detail ? titles.find((t) => t.shape.key === detail.title) : undefined;

  return (
    <>
      <TvSurfaceHead navTint="rgba(18,26,48,0.92)">
        {lead ? (
          <LeadBillboard
            title={lead}
            onOpen={() => openDetail(lead)}
            onJump={(rank) => applyJump(lead, rank)}
          />
        ) : (
          <Billboard />
        )}
      </TvSurfaceHead>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.space.md}px`,
          marginTop: `${tokens.space.md}px`,
          position: "relative",
        }}
      >
        {/* Continue Watching leads. Catch Up is a surface about the house,
            but the first thing anyone opens Netflix to do is get back to what
            they were already watching — burying that under household rows
            would be a feature arguing with a habit. */}
        <HouseRow title={`Continue watching for ${viewer.name}`} titles={rows.mine} onOpen={openDetail} onJump={applyJump} />
        {/* The one shelf built from the household. Everything below is a
            normal row where a face pile is something you happen upon. */}
        <HouseRow title="Catch up on" titles={rows.catchUp} onOpen={openDetail} onJump={applyJump} />
        <HouseRow title={`Today's top picks for ${viewer.name}`} titles={rows.picks} onOpen={openDetail} onJump={applyJump} />
        <HouseRow title="New on Netflix" titles={rows.fresh} onOpen={openDetail} onJump={applyJump} />
        <HouseRow title="Top 10 TV shows today" titles={rows.topTen} ranked onOpen={openDetail} onJump={applyJump} />
        <HouseRow title="Critically acclaimed films" titles={rows.films} onOpen={openDetail} onJump={applyJump} />
      </Box>

      <Footer />

      <DetailModal
        open={!!detail}
        content={detail}
        onClose={() => setDetail(null)}
        actionSlot={
          detailTitle && (
            <JumpControl
              positions={detailTitle.positions}
              onJump={(rank) => applyJump(detailTitle, rank)}
            />
          )
        }
        belowHero={
          detailTitle && (
            <HouseholdTimeline
              shape={detailTitle.shape}
              positions={detailTitle.positions}
              onJump={(rank) => applyJump(detailTitle, rank)}
            />
          )
        }
      />
    </>
  );
}

/**
 * Row buckets.
 *
 * Every row here answers a question about the household rather than about the
 * catalog — that's the whole reason the surface exists. Ordering is by how
 * much of a gap there is to close, so the most useful jump is always leftmost
 * and lands in the billboard.
 */
function buildRows(titles: HouseTitle[]) {
  // Rank by the *fraction* of the title someone is ahead by, not the raw unit
  // gap: a film's units are minutes and a series' are episodes, so comparing
  // them directly would put every movie above every show.
  const gap = (t: HouseTitle) =>
    t.ahead ? (t.ahead.rank - (t.mine?.rank ?? 0)) / Math.max(1, t.shape.units) : 0;
  const catchUp = titles
    .filter((t) => t.ahead)
    // Series lead. "Three episodes behind" is a state a person recognizes;
    // "twenty-two minutes behind on a film" is not a thing anyone says.
    .sort((a, b) => Number(b.shape.kind === "tv") - Number(a.shape.kind === "tv") || gap(b) - gap(a))
    .slice(0, ROW_SIZE);

  // Hoisted before the slice so the featured title leads the row even if the
  // natural order would have pushed it past the cut.
  const mine = hoist(titles.filter((t) => t.mine), FEATURED_TITLE).slice(0, ROW_SIZE);

  // Ordinary browsing rows, unfiltered by the household. These are most of the
  // page on purpose: household activity is meant to be an occasional signal
  // you come across, not the thing every shelf is built from. Filtering every
  // row by it is what made it look like the whole catalog was co-watched.
  const picks = sample(titles, "picks", ROW_SIZE);
  const fresh = sample(titles.filter((t) => (t.entry.year ?? 0) >= 2024), "fresh", ROW_SIZE);
  const topTen = sample(titles.filter((t) => t.shape.kind === "tv"), "top10", 10);
  const films = sample(titles.filter((t) => t.shape.kind === "movie"), "films", ROW_SIZE);

  return { mine, catchUp, picks, fresh, topTen, films };
}

/**
 * Stable pseudo-random slice of the catalog. Hash-ordered rather than shuffled
 * so a row holds still across renders and reloads.
 */
function sample(titles: HouseTitle[], key: string, n: number): HouseTitle[] {
  return [...titles]
    .sort((a, b) => hashString(key + a.entry.title) - hashString(key + b.entry.title))
    .slice(0, n);
}

/** Moves one title to the front of a row, if it's in it. */
function hoist(titles: HouseTitle[], key: string): HouseTitle[] {
  const i = titles.findIndex((t) => t.shape.key === key);
  if (i <= 0) return titles;
  return [titles[i], ...titles.slice(0, i), ...titles.slice(i + 1)];
}

/**
 * The billboard leads with the single biggest gap in the house — the title
 * where someone is furthest ahead of you. A brand marquee would be wasted
 * space on a surface whose entire job is "here's what you've fallen behind on".
 */
function LeadBillboard({
  title,
  onOpen,
  onJump,
}: {
  title: HouseTitle;
  onOpen: () => void;
  onJump: (rank: number) => void;
}) {

  return (
    <Billboard
      backdrop={title.entry.backdropUrl ? <BillboardArt src={title.entry.backdropUrl} /> : undefined}
    >
      {title.entry.logoUrl ? (
        <Box
          component="img"
          src={title.entry.logoUrl}
          alt={title.entry.title}
          sx={{
            maxWidth: "min(440px, 80%)",
            maxHeight: "clamp(56px, 10vw, 130px)",
            objectFit: "contain",
            objectPosition: "left bottom",
            alignSelf: "flex-start",
            filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.55))",
            mb: "clamp(12px, 1.6vw, 22px)",
          }}
        />
      ) : (
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 30, sm: "clamp(38px, 5.2vw, 72px)" },
            lineHeight: 1.02,
            fontWeight: tokens.type.weight.bold,
            letterSpacing: "-0.02em",
            color: tokens.color.textPrimary,
            textShadow: "0 4px 24px rgba(0,0,0,0.55)",
            mb: "clamp(12px, 1.6vw, 22px)",
          }}
        >
          {title.entry.title}
        </Typography>
      )}

      <Typography
        sx={{
          color: tokens.color.textPrimary,
          fontSize: "clamp(13px, 1.2vw, 17px)",
          maxWidth: "44ch",
          mb: "clamp(16px, 2vw, 26px)",
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}
      >
        {buildRowMeta(title.entry, title.entry.title).synopsis}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "clamp(8px, 1vw, 14px)" }}>
        <Button
          onClick={onOpen}
          startIcon={<PlayArrowIcon sx={{ fontSize: "clamp(20px, 2.2vw, 28px)" }} />}
          sx={{
            ...TV_ACTION_SX,
            backgroundColor: tokens.color.textPrimary,
            color: tokens.color.base,
            "&:hover": { backgroundColor: "rgba(255,255,255,0.85)" },
          }}
        >
          {title.mine ? `Resume ${title.mine.label}` : "Play"}
        </Button>
        <JumpControl positions={title.positions} onJump={onJump} />
      </Box>
    </Billboard>
  );
}

function HouseRow({
  title,
  titles,
  ranked,
  onOpen,
  onJump,
}: {
  title: string;
  titles: HouseTitle[];
  ranked?: boolean;
  onOpen: (t: HouseTitle) => void;
  onJump: (t: HouseTitle, rank: number) => void;
}) {
  if (titles.length === 0) return null;

  const items: FocusRowItem[] = titles.map((t) => {
    const meta = buildRowMeta(t.entry, t.entry.title);
    return {
      key: t.shape.key,
      title: t.entry.title,
      posterUrl: t.entry.posterUrl ?? undefined,
      backdropUrl: t.entry.backdropUrl ?? undefined,
      logoUrl: t.entry.logoUrl ?? undefined,
      // Other members only. Your own face on your own card says nothing you
      // didn't already know, and stamping it on every Continue Watching item
      // made household activity look universal when it's meant to be rare.
      topRight: otherPositions(t.positions).length > 0
        ? <FacePile members={otherPositions(t.positions).map((p) => memberById(p.memberId))} size={30} />
        : undefined,
      metaParts: meta.metaParts,
      rating: meta.rating,
      hasCaptions: meta.hasCaptions,
      synopsis: meta.synopsis,
      actions: (
        <>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(t);
            }}
            startIcon={<PlayArrowIcon sx={{ fontSize: "clamp(20px, 2.2vw, 28px)" }} />}
            sx={{
              ...TV_ACTION_SX,
              backgroundColor: tokens.color.textPrimary,
              color: tokens.color.base,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.85)" },
            }}
          >
            {t.mine ? `Resume ${t.mine.label}` : "Play"}
          </Button>
          <JumpControl positions={t.positions} onJump={(rank) => onJump(t, rank)} />
        </>
      ),
      progress: t.mine?.progress,
      onOpen: () => onOpen(t),
    };
  });

  return (
    <FocusRow
      title={title}
      items={items}
      ranked={ranked}
    />
  );
}
