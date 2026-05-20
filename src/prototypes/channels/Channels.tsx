import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { tokens } from "@/theme/tokens";
import { TvFrame, Row, Tile, RemoteCue } from "@/primitives";
import { FocusProvider, useFocusable, useFocusContext } from "@/lib/focus";
import { PromptPanel } from "./PromptPanel";
import { seedChannels, type Channel } from "./seedData";
import type { ChannelCategory } from "@/lib/claude";

/**
 * Top-level Channels screen.
 *
 * Layout:
 *   - Brand wordmark (top-left, inside safe zone)
 *   - Channel rows (3 seed rows by default; each is fully tweakable)
 *   - D-pad cue strip (bottom)
 *
 * Interactions:
 *   - Arrow keys navigate (handled by FocusProvider).
 *   - Enter on a tile → opens the prompt panel for that channel.
 *   - 'T' anywhere → opens the prompt panel for the currently active channel.
 *   - Escape → closes the panel.
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

      <Box sx={{ flex: 1, overflowY: "auto", pb: `${tokens.space["2xl"]}px` }}>
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            onTweak={() => setActivePanelChannel(`channel-${channel.id}`)}
          />
        ))}
      </Box>

      <RemoteCue
        cues={[
          { key: "← →", label: "Browse" },
          { key: "↑ ↓", label: "Switch row" },
          { key: "OK", label: "Tweak channel" },
          { key: "T", label: "Talk" },
        ]}
      />

      <PromptPanel
        open={!!activePanelChannel}
        currentTitle={activeChannel?.category.title ?? ""}
        onAccept={(category) => activeChannel && handleChannelAccept(activeChannel.id, category)}
        onClose={() => setActivePanelChannel(null)}
      />
    </>
  );
}

function Header() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        pb: `${tokens.space.xl}px`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", gap: `${tokens.space.md}px` }}>
        <Typography sx={{ fontSize: tokens.type.scale.h2.size, lineHeight: 1, fontWeight: tokens.type.weight.bold, color: tokens.color.accent, letterSpacing: "-0.04em" }}>
          NF
        </Typography>
        <Typography
          sx={{
            fontSize: tokens.type.scale.micro.size,
            color: tokens.color.textSecondary,
            letterSpacing: tokens.type.scale.micro.letterSpacing,
            textTransform: "uppercase",
            fontWeight: tokens.type.weight.semibold,
          }}
        >
          Channels — Prototype
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: tokens.type.scale.micro.size,
          color: tokens.color.textTertiary,
          letterSpacing: tokens.type.scale.micro.letterSpacing,
          textTransform: "uppercase",
        }}
      >
        Matt's profile
      </Typography>
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

  return (
    <Row
      sectionId={sectionId}
      itemCount={tiles.length}
      title={channel.category.title}
      titleSlot={
        <ChannelMeta channel={channel} />
      }
      itemWidth={260}
      fixedFocusOffsetPx={0}
    >
      {tiles.map((ex, i) => (
        <ChannelTile
          key={ex.title + i}
          sectionId={sectionId}
          index={i}
          title={ex.title}
          subtitle={`${ex.year} · ${ex.oneLine}`}
          color={channel.tilePalette[i % channel.tilePalette.length]}
          onSelect={onTweak}
        />
      ))}
    </Row>
  );
}

function ChannelMeta({ channel }: { channel: Channel }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.sm}px` }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: channel.category.moodColor,
          boxShadow: `0 0 0 2px ${tokens.color.base}, 0 0 0 4px ${channel.category.moodColor}40`,
        }}
      />
      <Typography
        sx={{
          fontSize: tokens.type.scale.micro.size,
          letterSpacing: tokens.type.scale.micro.letterSpacing,
          textTransform: "uppercase",
          color: tokens.color.textTertiary,
          fontWeight: tokens.type.weight.semibold,
        }}
      >
        {channel.category.tone.slice(0, 3).join(" · ")}
      </Typography>
    </Box>
  );
}

function ChannelTile({
  sectionId,
  index,
  title,
  subtitle,
  color,
  onSelect,
}: {
  sectionId: string;
  index: number;
  title: string;
  subtitle: string;
  color: string;
  onSelect: () => void;
}) {
  const { focused } = useFocusable(sectionId, index, onSelect);
  return (
    <Tile
      focused={focused}
      title={title}
      subtitle={subtitle}
      color={`linear-gradient(155deg, ${color}, ${darken(color, 0.5)})`}
      badge={index === 0 ? "Top of row" : undefined}
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
  // Generate a small palette from the mood color by varying lightness.
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
