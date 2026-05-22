import { Box, Typography, IconButton } from "@mui/material";
import { useEffect, type ReactNode } from "react";
import CloseIcon from "@mui/icons-material/Close";
import hopperUrl from "@/assets/hopper.png";
import { tokens } from "@/theme/tokens";

/**
 * Idea Hopper — a parking-lot modal that surfaces prototype concepts that
 * didn't make the cut for the build. Same overlay/centered-Box pattern as
 * DetailModal and SwitchChannelsModal so the modal language stays consistent.
 *
 * The ideas list is editorial, not generated. Edit IDEAS to add/remove.
 */

type Idea = {
  id: string;
  tag: string;
  title: string;
  description?: string;
};

const IDEAS: Idea[] = [
  {
    id: "ai-recs",
    tag: "Discovery",
    title: "Actual AI recommendations",
    description:
      "A space to dig into how Netflix's recommendation engine actually works \u2014 and to think through the possibilities once AI is doing the curating, not just the ranking.",
  },
  {
    id: "invite",
    tag: "Sharing",
    title: "Invite",
    description:
      "While watching, hit Share to spend one of your monthly invites. A QR code opens your phone; you text a friend a link that unlocks the first few episodes (or the full movie) free, with a one-time code. When they sign up you can keep sending picks from your history into a \u201cMatt\u2019s Recs for You\u201d row in their app.",
  },
  {
    id: "netflix-independent",
    tag: "Editorial",
    title: "Netflix Independant",
    description:
      "A suite of tools for independent creators to run their productions more efficiently \u2014 from pre-production through distribution.",
  },
];

const NOT_BAKED_COLOR = "#E5A23A";

export function IdeaHopperModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Idea Hopper"
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        backgroundColor: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
        paddingBlock: { xs: 0, md: `${tokens.space.xl}px` },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 760,
          backgroundColor: tokens.color.surfaceLow,
          borderRadius: { xs: 0, md: `${tokens.radius.md}px` },
          overflow: "hidden",
          color: tokens.color.textPrimary,
          boxShadow: tokens.shadow.lg,
        }}
      >
        <Header onClose={onClose} />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: `${tokens.space.sm}px`,
            paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
            paddingBlock: `${tokens.space.lg}px`,
          }}
        >
          {IDEAS.map((idea) => (
            <IdeaRow key={idea.id} idea={idea} />
          ))}
        </Box>

        <Footer />
      </Box>
    </Box>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        gap: `${tokens.space.lg}px`,
        alignItems: "center",
        paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
        paddingTop: { xs: `${tokens.space.xl}px`, md: `${tokens.space["2xl"]}px` },
        paddingBottom: `${tokens.space.lg}px`,
      }}
    >
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{
          position: "absolute",
          top: tokens.space.md,
          right: tokens.space.md,
          width: 36,
          height: 36,
          backgroundColor: "rgba(20,20,20,0.7)",
          color: tokens.color.textPrimary,
          zIndex: 2,
          "&:hover": { backgroundColor: tokens.color.base },
        }}
      >
        <CloseIcon sx={{ fontSize: 22 }} />
      </IconButton>

      <Box
        component="img"
        src={hopperUrl}
        alt="Hopper"
        sx={{
          width: 88,
          height: 88,
          borderRadius: `${tokens.radius.sm}px`,
          objectFit: "cover",
          objectPosition: "center 15%",
          flexShrink: 0,
        }}
      />

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: tokens.type.scale.micro.size,
            color: tokens.color.accent,
            letterSpacing: tokens.type.scale.micro.letterSpacing,
            textTransform: "uppercase",
            fontWeight: tokens.type.weight.semibold,
            marginBottom: "6px",
          }}
        >
          Idea Hopper
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: 26, md: 32 },
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            fontWeight: tokens.type.weight.bold,
          }}
        >
          The ones that got away
        </Typography>
        <Typography sx={{ fontSize: 13, color: tokens.color.textSecondary, marginTop: "6px", lineHeight: 1.4 }}>
          Other prototypes I thought about but didn't build for this round. Listed here so they don't get lost.
        </Typography>

      </Box>
    </Box>
  );
}

function IdeaRow({ idea }: { idea: Idea }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "100px 1fr auto",
        gap: `${tokens.space.md}px`,
        alignItems: "center",
        paddingBlock: `${tokens.space.sm}px`,
        borderBottom: `1px solid ${tokens.color.border}`,
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <Typography
        sx={{
          fontSize: tokens.type.scale.micro.size,
          color: tokens.color.textTertiary,
          letterSpacing: tokens.type.scale.micro.letterSpacing,
          textTransform: "uppercase",
          fontWeight: tokens.type.weight.semibold,
        }}
      >
        {idea.tag}
      </Typography>

      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: tokens.type.weight.bold, lineHeight: 1.2, color: tokens.color.textPrimary }}>
          {idea.title}
        </Typography>
        {idea.description && (
          <Typography sx={{ fontSize: 13, color: tokens.color.textSecondary, lineHeight: 1.45, marginTop: "4px" }}>
            {idea.description}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          fontSize: 10,
          fontWeight: tokens.type.weight.semibold,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          paddingInline: "8px",
          paddingBlock: "3px",
          borderRadius: 4,
          border: `1px solid ${NOT_BAKED_COLOR}`,
          color: NOT_BAKED_COLOR,
          whiteSpace: "nowrap",
        }}
      >
        Not Baked
      </Box>
    </Box>
  );
}

function Footer() {
  return (
    <Box
      sx={{
        paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
        paddingBlock: `${tokens.space.md}px`,
        borderTop: `1px solid ${tokens.color.border}`,
        display: "flex",
        alignItems: "center",
        gap: `${tokens.space.sm}px`,
        flexWrap: "wrap",
      }}
    >
      <FooterBullet>Esc</FooterBullet>
      <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary }}>close</Typography>
      <Box sx={{ flex: 1 }} />
      <Typography sx={{ fontSize: 12, color: tokens.color.textTertiary }}>
        {IDEAS.length} ideas in the hopper
      </Typography>
    </Box>
  );
}

function FooterBullet({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        fontSize: 10,
        fontWeight: tokens.type.weight.semibold,
        color: tokens.color.textPrimary,
        backgroundColor: tokens.color.surfaceMid,
        border: `1px solid ${tokens.color.borderStrong}`,
        paddingInline: "6px",
        paddingBlock: "2px",
        borderRadius: 4,
        letterSpacing: "0.04em",
        lineHeight: 1.4,
        fontFamily: tokens.type.family.mono,
      }}
    >
      {children}
    </Box>
  );
}
