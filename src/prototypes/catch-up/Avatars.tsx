import { Box } from "@mui/material";
import { tokens } from "@/theme/tokens";
import type { Member } from "./household";

/**
 * Household avatars.
 *
 * Circles, not Netflix's rounded squares: at the sizes these run — inside a
 * button, stacked in a pile, sitting on a timeline — a circle reads as "a
 * person" faster than a square does, and a pile of overlapping circles is
 * legible at a glance in a way overlapping squares aren't.
 *
 * Members with a photo get it; the rest get a colored monogram, so the
 * prototype never depends on avatar art it would have to source for everyone.
 */
export function MemberAvatar({
  member,
  size = 34,
  ring,
}: {
  member: Member;
  /**
   * Number of px, or any CSS length. A `clamp()` is what lets an avatar inside
   * a button track the button's own fluid sizing without a resize listener.
   */
  size?: number | string;
  /** Separating ring — used when avatars overlap in a pile. */
  ring?: boolean;
}) {
  const len = typeof size === "number" ? `${size}px` : size;
  return (
    <Box
      title={member.name}
      sx={{
        width: len,
        height: len,
        borderRadius: "50%",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        backgroundColor: member.color,
        color: "#fff",
        fontSize: `calc(${len} * 0.46)`,
        fontWeight: tokens.type.weight.bold,
        lineHeight: 1,
        userSelect: "none",
        // Half-opacity so the ring separates overlapping faces without
        // stamping a hard black outline onto artwork.
        ...(ring && { boxShadow: "0 0 0 2px rgba(20,20,20,0.5)" }),
      }}
    >
      {member.photoUrl ? (
        <Box
          component="img"
          src={member.photoUrl}
          alt={member.name}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        member.initials
      )}
    </Box>
  );
}

/**
 * Overlapping stack of household avatars — the at-a-glance answer to "who
 * else in this house has watched this?". Drops into the reason-badge slot on a
 * focused card, where the redesign puts its megaphone and Top 10 chips.
 */
export function FacePile({
  members,
  size = 28,
}: {
  members: Member[];
  size?: number | string;
}) {
  if (members.length === 0) return null;
  const len = typeof size === "number" ? `${size}px` : size;
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      {members.map((m, i) => (
        <Box key={m.id} sx={{ marginLeft: i === 0 ? 0 : `calc(${len} * -0.3)`, display: "flex" }}>
          <MemberAvatar member={m} size={len} ring />
        </Box>
      ))}
    </Box>
  );
}
