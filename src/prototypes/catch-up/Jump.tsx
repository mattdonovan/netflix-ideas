import { Box, Typography, Button } from "@mui/material";
import { useState, type ReactNode } from "react";
import ReplayIcon from "@mui/icons-material/Replay";
import { tokens } from "@/theme/tokens";
import { TV_ACTION_SX, TV_ACTION_ICON_BOX } from "@/surfaces/netflix-tv";
import { FacePile, MemberAvatar } from "./Avatars";
import {
  memberById,
  otherPositions,
  viewer,
  viewerPosition,
  type Position,
  type TitleShape,
} from "./household";

/**
 * Jump — the one new verb in Catch Up.
 *
 * Jumping moves *your own* marker to a point on the timeline. That is all it
 * does. It doesn't write to anyone else's timeline, it doesn't add anything to
 * your viewing history, and it doesn't remove anything from it — so jumping
 * backwards is as safe as jumping forwards, which is why the verb is "Jump"
 * rather than "Catch up".
 *
 * Because the marker is the only thing that moves, Play is untouched: it
 * always resumes your own position, and there is no dialog between a member
 * and the thing they wanted to watch.
 *
 * The control is a single button that fans its destinations upward on hover. Every destination is a place on one timeline — a household member's
 * spot, or the beginning — so they belong in one list rather than split across
 * a "Watch from beginning" button and a separate household control.
 *
 * The button wears the faces of the people you can jump to. That face pile is
 * the surface's only "who else is on this" signal: a separate badge saying the
 * same thing next to a button that already shows it is one signal too many.
 * When nobody else in the house is on the title there are no faces and no
 * destinations, and the control doesn't render at all.
 */

/**
 * Avatar size inside an action button. Larger than the button's content box on
 * purpose — the startIcon is zero-height (see TV_ACTION_SX), so these overflow
 * rather than stretch it. Tracks the button's own clamp so the two stay in
 * proportion at every width.
 */
const AVATAR_IN_BUTTON = "clamp(30px, 3.2vw, 44px)";

/**
 * A button whose icon is an avatar needs less left padding than one carrying a
 * glyph. The avatar overhangs its icon box by half the difference between the
 * two, so it already sits closer to the button's edge on the top and bottom
 * than the padding alone would suggest. Subtracting that same overhang from the
 * left padding puts the same gap on all three sides, and the avatar reads as
 * inset rather than shoved against the label.
 *
 * The theme's vertical button padding is the reference, since that's what sets
 * the top gap the left one is matching.
 */
const AVATAR_BUTTON_SX = {
  ...TV_ACTION_SX,
  paddingLeft: `calc(${tokens.space.sm}px - (${AVATAR_IN_BUTTON} - ${TV_ACTION_ICON_BOX}) / 2)`,
  "& .MuiButton-startIcon": {
    ...TV_ACTION_SX["& .MuiButton-startIcon"],
    // The generic nudge assumes a glyph; the avatar sets its own inset.
    marginLeft: 0,
  },
};

export type JumpOption = {
  id: string;
  label: string;
  icon: ReactNode;
  rank: number;
};

/** Builds the fan. Household first, then the beginning. */
export function jumpOptions(positions: Position[]): JumpOption[] {
  const mine = viewerPosition(positions);
  const out: JumpOption[] = otherPositions(positions).map((p) => {
    const member = memberById(p.memberId);
    return {
      id: member.id,
      label: `${member.name}: ${p.label}`,
      icon: <MemberAvatar member={member} size={AVATAR_IN_BUTTON} />,
      rank: p.rank,
    };
  });

  // Only offered when you're resuming. If you haven't started, Play already
  // starts at the beginning and a second control for it is noise. There's no
  // "back to my spot" either — that's just Resume.
  if (mine && mine.rank > 0) {
    out.push({
      id: "beginning",
      label: "Beginning",
      icon: <ReplayIcon />,
      rank: 0,
    });
  }

  return out;
}

/**
 * The Jump button and its fan.
 *
 * Destinations stack upward from the button, absolutely positioned so that
 * revealing them never reflows the controls beside them — a button row that
 * shifts under the cursor is how you mis-click the thing next to it. The fan's
 * container carries the bottom padding, so the gap between button and options
 * is inside the hover target and the fan doesn't collapse on the way up.
 *
 * The stack reads top to bottom in list order, but animates bottom-up: the
 * option nearest the button arrives first, so the group looks like it grew out
 * of the button rather than appearing above it.
 *
 * Options are the same size as the button that opened them: they're peers, not
 * a submenu, and each one is a destination the button stands in for.
 */
export function JumpControl({
  positions,
  onJump,
}: {
  positions: Position[];
  onJump: (rank: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = jumpOptions(positions);
  if (options.length === 0) return null;

  // The faces on the button are exactly the faces in the fan — the people you
  // can jump to. Your own face isn't among them; you can't jump to yourself.
  const faces = otherPositions(positions).map((p) => memberById(p.memberId));

  return (
    <Box
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      sx={{
        position: "relative",
        display: "inline-flex",
        // Keyboard users get the same fan without needing a pointer.
        "&:focus-within .jump-fan": { opacity: 1, pointerEvents: "auto" },
      }}
    >
      <Button
        startIcon={<FacePile members={faces} size={AVATAR_IN_BUTTON} />}
        sx={{
          ...AVATAR_BUTTON_SX,
          backgroundColor: "rgba(109,109,110,0.7)",
          color: tokens.color.textPrimary,
          backdropFilter: "blur(6px)",
          "&:hover": { backgroundColor: "rgba(109,109,110,0.92)" },
        }}
      >
        Jump
      </Button>

      <Box
        className="jump-fan"
        sx={{
          position: "absolute",
          bottom: "100%",
          left: 0,
          // Padding, not margin: the gap stays inside the hover target.
          paddingBottom: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "8px",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
          zIndex: 20,
        }}
      >
        {options.map((option, i) => (
          <Button
            key={option.id}
            onClick={(e) => {
              // Inside a card, the card itself opens the detail view on click.
              e.stopPropagation();
              onJump(option.rank);
              setOpen(false);
            }}
            startIcon={option.icon}
            sx={{
              // Same inset as the trigger, so every icon in the stack — avatar
              // or glyph — shares one left edge.
              ...AVATAR_BUTTON_SX,
              backgroundColor: "rgba(20,20,22,0.92)",
              backdropFilter: "blur(6px)",
              boxShadow: tokens.shadow.md,
              color: tokens.color.textPrimary,
              // Reverse stagger: the bottom option (nearest the button) moves
              // first, so the stack unfolds away from its trigger.
              transform: open ? "translateY(0)" : "translateY(8px)",
              transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus} ${(options.length - 1 - i) * 45}ms, background-color ${tokens.motion.duration.press}ms`,
              "&:hover": { backgroundColor: "rgba(52,52,58,0.96)" },
            }}
          >
            {option.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

/**
 * The household timeline — one bar, one pip per member.
 *
 * This is the whole feature in a single control. Netflix shows a progress bar
 * per profile, each in its own account, never together; putting them on one
 * axis is what makes "Dana is three ahead of me" a fact you can see rather
 * than one you reconstruct by profile-hopping. Clicking a pip jumps to it.
 */
export function HouseholdTimeline({
  shape,
  positions,
  onJump,
}: {
  shape: TitleShape;
  positions: Position[];
  onJump: (rank: number) => void;
}) {
  const mine = viewerPosition(positions);
  const theirs = otherPositions(positions);
  if (theirs.length === 0) return null;

  return (
    <Box
      sx={{
        paddingInline: { xs: `${tokens.space.md}px`, md: `${tokens.space.xl}px` },
        paddingBlock: `${tokens.space.md}px`,
        borderBottom: `1px solid ${tokens.color.border}`,
      }}
    >
      <Typography
        sx={{
          fontSize: tokens.type.scale.micro.size,
          letterSpacing: tokens.type.scale.micro.letterSpacing,
          fontWeight: tokens.type.weight.semibold,
          color: tokens.color.textSecondary,
          mb: `${tokens.space.md}px`,
        }}
      >
        In your household
      </Typography>

      <Box sx={{ position: "relative", height: 46, mb: `${tokens.space.sm}px` }}>
        <Box
          sx={{
            position: "absolute",
            top: 30,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(245,245,245,0.18)",
          }}
        />
        {mine && (
          <Box
            sx={{
              position: "absolute",
              top: 30,
              left: 0,
              width: `${Math.max(0, Math.min(1, mine.progress)) * 100}%`,
              height: 4,
              borderRadius: 2,
              backgroundColor: tokens.color.brand,
              transition: `width ${tokens.motion.duration.page}ms ${tokens.motion.easing.focus}`,
            }}
          />
        )}
        {positions.map((p) => {
          const member = memberById(p.memberId);
          const isMe = p.memberId === viewer.id;
          // Two people on the same episode land on the same pixel and one
          // disappears behind the other — which is exactly the case (you and
          // someone else at the same spot) the timeline most needs to show.
          // Fan co-located pips apart by a fixed nudge.
          const sameRank = positions.filter((q) => q.rank === p.rank);
          const nudge =
            sameRank.length > 1
              ? (sameRank.findIndex((q) => q.memberId === p.memberId) - (sameRank.length - 1) / 2) * 17
              : 0;
          return (
            <Box
              key={p.memberId}
              onClick={() => !isMe && onJump(p.rank)}
              title={isMe ? `You — ${p.label}` : `Jump to ${member.name} — ${p.label}`}
              sx={{
                position: "absolute",
                top: 0,
                left: `${Math.max(0, Math.min(1, p.progress)) * 100}%`,
                marginLeft: `${nudge}px`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                cursor: isMe ? "default" : "pointer",
                transition: `left ${tokens.motion.duration.page}ms ${tokens.motion.easing.focus}`,
                "&:hover": { filter: isMe ? "none" : "brightness(1.2)" },
              }}
            >
              <MemberAvatar member={member} size={26} ring />
              <Box
                sx={{
                  width: 2,
                  height: 14,
                  borderRadius: 1,
                  backgroundColor: isMe ? tokens.color.brand : member.color,
                }}
              />
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", gap: `${tokens.space.md}px`, flexWrap: "wrap" }}>
        {positions.map((p) => (
          <Typography key={p.memberId} sx={{ fontSize: 12, color: tokens.color.textSecondary }}>
            <Box
              component="span"
              sx={{ color: tokens.color.textPrimary, fontWeight: tokens.type.weight.semibold }}
            >
              {p.memberId === viewer.id ? "You" : memberById(p.memberId).name}
            </Box>{" "}
            {p.label} · {p.lastWatched}
          </Typography>
        ))}
      </Box>

      <Typography sx={{ fontSize: 12, color: tokens.color.textTertiary, mt: `${tokens.space.sm}px` }}>
        {shape.kind === "tv"
          ? `${shape.seasons} season${shape.seasons === 1 ? "" : "s"} · ${shape.units} episodes`
          : `${shape.units} minutes`}
      </Typography>
    </Box>
  );
}
