import { Box, Typography, IconButton } from "@mui/material";
import { useEffect, type ReactNode } from "react";
import CloseIcon from "@mui/icons-material/Close";
import hopperUrl from "@/assets/hopper.png";
import { tokens } from "@/theme/tokens";

/**
 * Idea Hopper — a roadmap-style modal for the Control prototype: what's shipped,
 * what's parked, and what's next. Styled like the show/movie detail modals with
 * a full-width image hero. The list is editorial — edit IDEAS to add/remove.
 */

type Status = "Built" | "Next" | "Parked";

type Idea = {
  id: string;
  tag: string;
  title: string;
  status: Status;
  description?: string;
};

const STATUS_COLOR: Record<Status, string> = {
  Built: "#46D369",
  Next: "#3D6FFF",
  Parked: "#E5A23A",
};

const IDEAS: Idea[] = [
  {
    id: "control",
    tag: "Control",
    title: "Tune your channels",
    status: "Built",
    description:
      "The core of this build: describe what you want and the row retunes to a real catalog mix of movies, shows, and games, chosen in the moment.",
  },
  {
    id: "partners",
    tag: "Partnerships",
    title: "Partner-enabled discovery",
    status: "Built",
    description:
      "Control is presented by Samsung and unlocked through a partner sign-in — a sketch of how device makers and carriers could light up premium discovery for their members.",
  },
  {
    id: "games",
    tag: "Games",
    title: "Games in the mix",
    status: "Built",
    description:
      "Games sit in the same mix as movies and shows, badged by type, so a single tuned row can blend all three.",
  },
  {
    id: "levers",
    tag: "Control",
    title: "More discovery levers",
    status: "Next",
    description:
      "Playful, engaging ways to steer the mix beyond a text box — moods, dials, mash-ups, surprise-me. Make tuning feel like play.",
  },
  {
    id: "overview-video",
    tag: "Storytelling",
    title: "Overview video",
    status: "Built",
    description:
      "A short walkthrough behind the Watch Overview button, explaining the idea in motion.",
  },
  {
    id: "invite",
    tag: "Sharing",
    title: "Invite",
    status: "Parked",
    description:
      "While watching, hit Share to spend one of your monthly invites. A QR code opens your phone; you text a friend a link that unlocks the first few episodes (or the full movie) free. When they sign up, your picks flow into a “Matt’s recs for you” row in their app.",
  },
  {
    id: "netflix-independent",
    tag: "Creators",
    title: "Netflix Independent",
    status: "Parked",
    description:
      "A suite of tools for independent creators to run their productions more efficiently — from pre-production through distribution.",
  },
];

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
        <Hero onClose={onClose} />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
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

/** Image hero, mirroring the show/movie detail modals. */
function Hero({ onClose }: { onClose: () => void }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "760 / 300",
        backgroundColor: tokens.color.surfaceMid,
        backgroundImage: `url("${hopperUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center 22%",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(180deg, rgba(20,20,20,0) 30%, rgba(20,20,20,0.6) 72%, ${tokens.color.surfaceLow} 100%),
            linear-gradient(90deg, rgba(20,20,20,0.7) 0%, rgba(20,20,20,0.15) 55%, rgba(20,20,20,0) 75%)
          `,
        }}
      />

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
        sx={{
          position: "absolute",
          bottom: tokens.space.lg,
          left: { xs: tokens.space.lg, md: tokens.space.xl },
          right: { xs: tokens.space.lg, md: tokens.space.xl },
        }}
      >
        <Typography
          sx={{
            fontSize: tokens.type.scale.micro.size,
            color: tokens.color.accent,
            letterSpacing: tokens.type.scale.micro.letterSpacing,
            fontWeight: tokens.type.weight.semibold,
            marginBottom: "6px",
          }}
        >
          Control · roadmap
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: 28, md: 36 },
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            fontWeight: tokens.type.weight.bold,
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          Idea Hopper
        </Typography>
        <Typography sx={{ fontSize: 14, color: tokens.color.textSecondary, marginTop: "6px", lineHeight: 1.4 }}>
          What's shipped, what's parked, and what's next.
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
        gridTemplateColumns: "110px 1fr auto",
        gap: `${tokens.space.md}px`,
        alignItems: "start",
        paddingBlock: `${tokens.space.md}px`,
        borderBottom: `1px solid ${tokens.color.border}`,
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          color: tokens.color.textTertiary,
          fontWeight: tokens.type.weight.semibold,
          marginTop: "2px",
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
          fontSize: 11,
          fontWeight: tokens.type.weight.semibold,
          paddingInline: "9px",
          paddingBlock: "3px",
          borderRadius: 4,
          border: `1px solid ${STATUS_COLOR[idea.status]}`,
          color: STATUS_COLOR[idea.status],
          whiteSpace: "nowrap",
          marginTop: "2px",
        }}
      >
        {idea.status}
      </Box>
    </Box>
  );
}

function Footer() {
  const built = IDEAS.filter((i) => i.status === "Built").length;
  const next = IDEAS.filter((i) => i.status === "Next").length;
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
        {built} shipped · {next} next · {IDEAS.length} in the hopper
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
