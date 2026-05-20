import { Box, Typography, IconButton, Button } from "@mui/material";
import { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReplayIcon from "@mui/icons-material/Replay";
import { tokens } from "@/theme/tokens";
import { TvFrame, Row, TopTenRow, Tile, RemoteCue, NetflixWordmark, NetflixN } from "@/primitives";
import type { TileBadge } from "@/primitives/Tile";
import { FocusProvider, useFocusable, useFocusContext } from "@/lib/focus";
import { PromptPanel } from "./PromptPanel";
import { seedChannels, type Channel } from "./seedData";
import type { ChannelCategory } from "@/lib/claude";
import { findInCatalog } from "@/lib/catalog";

/**
 * Top-level Channels screen.
 *
 * Web-first interaction model: mouse hover focuses tiles, click also
 * focuses (Netflix's actual web behavior); keyboard / TV remote are a
 * supported backup. The PromptPanel modal opens only from the row-level
 * AI magic icon or the 'T' shortcut — never from a tile.
 */

export function Channels() {
  return (
    <FocusProvider>
      <TvFrame>
        <ChannelsContent />
      </TvFrame>
    </FocusProvider>
  );
}

function ChannelsContent() {
  const [channels, setChannels] = useState<Channel[]>(seedChannels);
  const [activePanelChannel, setActivePanelChannel] = useState<string | null>(null);
  const ctx = useFocusContext();

  // 'T' opens the prompt panel for whichever channel is currently focused.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        const activeSectionId = ctx.state.activeSectionId;
        if (activeSectionId && activeSectionId.startsWith("channel-")) {
          setActivePanelChannel(activeSectionId);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctx]);

  function handleChannelAccept(channelId: string, category: ChannelCategory) {
    setChannels((cs) =>
      cs.map((c) =>
        c.id === channelId
          ? { ...c, category, tilePalette: derivePaletteFromMood(category.moodColor) }
          : c,
      ),
    );
    setActivePanelChannel(null);
  }

  const activeChannel = channels.find((c) => `channel-${c.id}` === activePanelChannel);

  return (
    <>
      <Header />
      <Hero />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: `${tokens.space.md}px`, md: `${tokens.space.lg}px` },
          paddingBlock: `${tokens.space.md}px`,
        }}
      >
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            onTweak={() => setActivePanelChannel(`channel-${channel.id}`)}
          />
        ))}
      </Box>

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          backgroundColor: tokens.color.base,
          pt: `${tokens.space.md}px`,
          pb: `${tokens.space.sm}px`,
          mt: "auto",
        }}
      >
        <RemoteCue
          cues={[
            { key: "←→", label: "Browse" },
            { key: "↑↓", label: "Switch row" },
            { key: "T", label: "Rename row" },
          ]}
        />
      </Box>

      <PromptPanel
        open={!!activePanelChannel}
        currentTitle={activeChannel?.category.title ?? ""}
        onAccept={(category) => activeChannel && handleChannelAccept(activeChannel.id, category)}
        onClose={() => setActivePanelChannel(null)}
      />
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
        justifyContent: "space-between",
        pb: `${tokens.space.md}px`,
        gap: `${tokens.space.lg}px`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: tokens.space.sm, md: tokens.space.lg }, minWidth: 0, flex: 1 }}>
        <NetflixWordmark height={28} />
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
                fontWeight: item.active ? tokens.type.weight.semibold : tokens.type.weight.regular,
                color: item.active ? tokens.color.textPrimary : tokens.color.textSecondary,
                letterSpacing: 0,
                cursor: "pointer",
                whiteSpace: "nowrap",
                "&:hover": { color: tokens.color.textPrimary },
              }}
            >
              {item.label}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.sm}px`, flexShrink: 0 }}>
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            cursor: "pointer",
            "&:hover .avatar-chevron": { transform: "rotate(180deg)" },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: `${tokens.radius.sm}px`,
              background: "linear-gradient(135deg, #B266FF 0%, #7E3FE0 100%)",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              userSelect: "none",
            }}
          >
            <span role="img" aria-label="avatar">😊</span>
          </Box>
          <ArrowDropDownIcon
            className="avatar-chevron"
            sx={{
              color: tokens.color.textPrimary,
              transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Billboard hero — Figma 202-20214. Full-bleed backdrop with the featured
 * title's logo treatment, description, and primary CTAs. Sized with clamp()
 * so it scales smoothly from 600px up to the 1920 max-width canvas.
 */
function Hero() {
  const featured = findInCatalog("House of Ninjas", 2024);
  const backdrop = featured?.backdropUrl;
  return (
    <Box
      sx={{
        position: "relative",
        height: "clamp(360px, 56vw, 720px)",
        marginInline: { xs: `-${tokens.space.lg}px`, md: `-${tokens.space.xl}px` },
        marginBottom: `${tokens.space.lg}px`,
        backgroundColor: tokens.color.surfaceLow,
        backgroundImage: backdrop ? `url("${backdrop}")` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(90deg, rgba(11,11,11,0.85) 0%, rgba(11,11,11,0.5) 35%, rgba(11,11,11,0) 70%),
            linear-gradient(0deg, ${tokens.color.base} 0%, rgba(11,11,11,0.2) 30%, rgba(11,11,11,0) 60%)
          `,
        }}
      />

      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
          paddingBlock: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
          maxWidth: { xs: "100%", md: "60%", lg: "50%" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.space.xs}px`,
            mb: `${tokens.space.sm}px`,
          }}
        >
          <NetflixN size={24} />
          <Typography
            sx={{
              fontSize: { xs: 12, md: 14 },
              fontWeight: tokens.type.weight.semibold,
              color: tokens.color.textPrimary,
              letterSpacing: "0.32em",
            }}
          >
            SERIES
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: "clamp(40px, 6.5vw, 88px)",
            lineHeight: 0.95,
            fontWeight: tokens.type.weight.bold,
            color: tokens.color.textPrimary,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
            mb: `${tokens.space.md}px`,
          }}
        >
          House of
          <br />
          Ninjas
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: 14, md: 18 },
            color: tokens.color.textPrimary,
            opacity: 0.92,
            maxWidth: 560,
            mb: `${tokens.space.lg}px`,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            display: { xs: "none", sm: "block" },
          }}
        >
          Years after retiring from their formidable ninja lives, a dysfunctional family
          must return to shadowy missions to counteract a string of looming threats.
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.sm}px` }}>
          <Button
            startIcon={<PlayArrowIcon sx={{ fontSize: 28 }} />}
            sx={{
              backgroundColor: tokens.color.textPrimary,
              color: tokens.color.textInverse,
              fontSize: { xs: 14, md: 16 },
              fontWeight: tokens.type.weight.bold,
              paddingInline: { xs: `${tokens.space.md}px`, md: `${tokens.space.lg}px` },
              minHeight: { xs: 40, md: 48 },
              borderRadius: `${tokens.radius.sm}px`,
              "&:hover": { backgroundColor: "rgba(245,245,245,0.85)" },
            }}
          >
            Play
          </Button>
          <Button
            startIcon={<InfoOutlinedIcon sx={{ fontSize: 22 }} />}
            sx={{
              backgroundColor: "rgba(109, 109, 110, 0.7)",
              color: tokens.color.textPrimary,
              fontSize: { xs: 14, md: 16 },
              fontWeight: tokens.type.weight.bold,
              paddingInline: { xs: `${tokens.space.md}px`, md: `${tokens.space.lg}px` },
              minHeight: { xs: 40, md: 48 },
              borderRadius: `${tokens.radius.sm}px`,
              "&:hover": { backgroundColor: "rgba(109, 109, 110, 0.85)" },
            }}
          >
            More Info
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          position: "absolute",
          right: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
          bottom: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
          display: "flex",
          alignItems: "center",
          gap: `${tokens.space.sm}px`,
        }}
      >
        <IconButton
          aria-label="Replay"
          sx={{
            width: 36,
            height: 36,
            border: `2px solid ${tokens.color.borderStrong}`,
            color: tokens.color.textPrimary,
          }}
        >
          <ReplayIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Box
          sx={{
            paddingInline: `${tokens.space.sm}px`,
            paddingBlock: `${tokens.space.xs / 2}px`,
            borderLeft: `4px solid ${tokens.color.textPrimary}`,
            backgroundColor: "rgba(51,51,51,0.6)",
            color: tokens.color.textPrimary,
            fontSize: { xs: 12, md: 14 },
            fontWeight: tokens.type.weight.semibold,
            letterSpacing: "0.04em",
          }}
        >
          TV-14
        </Box>
      </Box>
    </Box>
  );
}

function ChannelRow({
  channel,
  onTweak,
}: {
  channel: Channel;
  onTweak: () => void;
}) {
  const sectionId = `channel-${channel.id}`;
  const tiles = channel.category.exemplars;
  const isTopTen = channel.id === "top-10-tv-us";

  const trigger = <RowMagicTrigger sectionId={sectionId} channel={channel} onTweak={onTweak} />;

  if (isTopTen) {
    return (
      <TopTenRow
        sectionId={sectionId}
        itemCount={Math.min(tiles.length, 10)}
        title={channel.category.title}
        titleSlot={trigger}
        itemsPerView={{ xs: 1.4, sm: 2.2, md: 3.2, lg: 4.2, xl: 5.2 }}
      >
        {tiles.slice(0, 10).map((ex, i) => {
          const catalogEntry = findInCatalog(ex.title, ex.year);
          return (
            <ChannelTile
              key={ex.title + i}
              sectionId={sectionId}
              index={i}
              title={ex.title}
              color={channel.tilePalette[i % channel.tilePalette.length]}
              artworkUrl={catalogEntry?.posterUrl ?? undefined}
              expandedArtworkUrl={catalogEntry?.backdropUrl ?? undefined}
              expandsToLandscape
              fillHeight
              badge={undefined}
              moodTags={channel.category.tone.slice(0, 3)}
              aspect="poster"
            />
          );
        })}
      </TopTenRow>
    );
  }

  return (
    <Row
      sectionId={sectionId}
      itemCount={tiles.length}
      title={channel.category.title}
      titleSlot={trigger}
      itemsPerView={{ xs: 1.6, sm: 2.6, md: 4, lg: 5, xl: 6 }}
    >
      {tiles.map((ex, i) => (
        <ChannelTile
          key={ex.title + i}
          sectionId={sectionId}
          index={i}
          title={ex.title}
          color={channel.tilePalette[i % channel.tilePalette.length]}
          artworkUrl={findInCatalog(ex.title, ex.year)?.backdropUrl ?? undefined}
          badge={badgeForChannel(channel.id, i, tiles.length)}
          moodTags={channel.category.tone.slice(0, 3)}
          aspect="boxart"
        />
      ))}
    </Row>
  );
}

/**
 * Pick a per-tile badge based on the channel's identity. Mimics the editorial
 * mix of "Recently Added" / "New Episode" + "Watch Now" / "New Season" badges
 * visible on a real Netflix homepage. Badges are paired: red primary +
 * optional white secondary.
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
 * Row-level "magic" trigger — appears next to the row title when any tile
 * in this row is focused. Clicking it opens the PromptPanel for renaming
 * (or re-targeting) this category. This is the *only* path from the grid to
 * the PromptPanel — tile hover/click no longer opens the modal.
 */
function RowMagicTrigger({
  sectionId,
  channel,
  onTweak,
}: {
  sectionId: string;
  channel: Channel;
  onTweak: () => void;
}) {
  const ctx = useFocusContext();
  const isActive = ctx.state.activeSectionId === sectionId;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${tokens.space.sm}px`,
        opacity: isActive ? 1 : 0,
        transform: isActive ? "translateX(0)" : "translateX(-8px)",
        transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        pointerEvents: isActive ? "auto" : "none",
      }}
    >
      <IconButton
        aria-label="Rename this row with AI"
        onClick={onTweak}
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: tokens.color.surfaceMid,
          color: tokens.color.textPrimary,
          border: `1px solid ${tokens.color.borderStrong}`,
          "&:hover": {
            backgroundColor: tokens.color.surfaceHigh,
            borderColor: tokens.color.textPrimary,
          },
        }}
      >
        <AutoAwesomeIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <Typography
        sx={{
          fontSize: { xs: 11, md: 12 },
          color: tokens.color.textSecondary,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: tokens.type.weight.semibold,
          display: { xs: "none", sm: "block" },
        }}
      >
        Press <Box component="span" sx={{ color: tokens.color.textPrimary }}>T</Box> to rename · {channel.category.tone.slice(0, 3).join(" · ")}
      </Typography>
    </Box>
  );
}

function ChannelTile({
  sectionId,
  index,
  title,
  color,
  artworkUrl,
  expandedArtworkUrl,
  expandsToLandscape,
  fillHeight,
  badge,
  moodTags,
  aspect,
}: {
  sectionId: string;
  index: number;
  title: string;
  color: string;
  artworkUrl?: string;
  expandedArtworkUrl?: string;
  expandsToLandscape?: boolean;
  fillHeight?: boolean;
  badge?: TileBadge;
  moodTags: string[];
  aspect: "boxart" | "poster";
}) {
  const { focused, setFocus } = useFocusable(sectionId, index);
  const ctx = useFocusContext();
  const runtimes = ["2h 11m", "3 Seasons", "1h 58m", "4 Seasons", "2h 24m", "Limited Series"];
  const ratings = ["TV-MA", "TV-14", "R", "PG-13", "TV-MA", "PG-13"];
  const isNew = index === 0 || index === 2;
  // Click treats this tile as a deliberate "select" — sets focus AND flips
  // input mode to keyboard so the focus ring shows (mouse hover alone does
  // neither, by design).
  function handleClick() {
    ctx.setInputMode("keyboard");
    setFocus();
  }
  return (
    <Tile
      focused={focused}
      onClick={handleClick}
      responsive
      fillHeight={fillHeight}
      aspect={aspect}
      title={artworkUrl ? undefined : title}
      color={artworkUrl ? undefined : `linear-gradient(155deg, ${color}, ${darken(color, 0.5)})`}
      artworkUrl={artworkUrl}
      expandedArtworkUrl={expandedArtworkUrl}
      expandsToLandscape={expandsToLandscape}
      badge={badge}
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

function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const k = 1 - amount;
  const dr = Math.round(r * k);
  const dg = Math.round(g * k);
  const db = Math.round(b * k);
  return `#${[dr, dg, db].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function derivePaletteFromMood(moodHex: string): string[] {
  return [
    darken(moodHex, 0.15),
    moodHex,
    darken(moodHex, 0.3),
    darken(moodHex, 0.05),
    darken(moodHex, 0.45),
    darken(moodHex, 0.25),
    darken(moodHex, 0.55),
  ];
}
