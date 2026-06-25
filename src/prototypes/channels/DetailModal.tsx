import { Box, Typography, IconButton, Button } from "@mui/material";
import { useEffect, type ReactNode } from "react";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { tokens } from "@/theme/tokens";

/**
 * Title-detail modal — adapted from Netflix Design System (Figma 121-4892).
 *
 * Composition:
 *   - Hero banner: full-bleed backdrop with bottom gradient, big title text,
 *     play CTA + circle action buttons, top-right close, bottom-right mute.
 *   - Movie Info: two-column meta band — chips + description on the left,
 *     cast / genres / mood on the right.
 *   - More Like This: 3-column grid of related titles.
 *   - About: long-form meta block.
 *
 * The Figma source covers movies and TV shows; the prototype is content-
 * agnostic and consumes a single `DetailModalContent` shape so the same
 * modal renders for any tile click in the Channels grid.
 */

export type DetailModalSuggestion = {
  title: string;
  backdropUrl?: string;
  year?: number;
  match?: number;
  rating?: string;
  runtime?: string;
  isNew?: boolean;
  description?: string;
};

export type DetailModalContent = {
  title: string;
  year?: number;
  kind: "movie" | "tv";
  backdropUrl?: string;
  posterUrl?: string;
  /** Title-treatment logo (transparent PNG). Rendered in the hero in place of
   *  the text title; falls back to text when absent. */
  logoUrl?: string;
  match: number;
  rating: string;
  runtime: string;
  formats: string[]; // ["HD", "AD"] etc.
  isNew?: boolean;
  topTenRank?: number;
  description: string;
  cast: string[];
  director?: string;
  genres: string[];
  mood: string[];
  maturityNotes: string[];
  maturityAudience?: string;
  suggestions: DetailModalSuggestion[];
};

export function DetailModal({
  open,
  content,
  onClose,
}: {
  open: boolean;
  content: DetailModalContent | null;
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
    // Lock body scroll while modal is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !content) return null;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${content.title}`}
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        backgroundColor: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
        // Center vertically on tall viewports; allow scroll on shorter ones.
        paddingBlock: { xs: 0, md: `${tokens.space.xl}px` },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 850,
          backgroundColor: tokens.color.surfaceLow,
          borderRadius: { xs: 0, md: `${tokens.radius.md}px` },
          overflow: "hidden",
          color: tokens.color.textPrimary,
          boxShadow: tokens.shadow.lg,
        }}
      >
        <Hero content={content} onClose={onClose} />
        <MovieInfo content={content} />
        {content.suggestions.length > 0 && <MoreLikeThis suggestions={content.suggestions} />}
        <About content={content} />
      </Box>
    </Box>
  );
}

function Hero({ content, onClose }: { content: DetailModalContent; onClose: () => void }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "850 / 480",
        backgroundColor: tokens.color.surfaceMid,
        backgroundImage: content.backdropUrl ? `url("${content.backdropUrl}")` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(180deg, rgba(20,20,20,0) 35%, rgba(20,20,20,0.6) 70%, ${tokens.color.surfaceLow} 100%),
            linear-gradient(90deg, rgba(20,20,20,0.7) 0%, rgba(20,20,20,0.2) 45%, rgba(20,20,20,0) 70%)
          `,
        }}
      />

      <IconButton
        aria-label="Close details"
        onClick={onClose}
        sx={{
          position: "absolute",
          top: tokens.space.md,
          right: tokens.space.md,
          width: 36,
          height: 36,
          backgroundColor: "rgba(20,20,20,0.7)",
          color: tokens.color.textPrimary,
          "&:hover": { backgroundColor: tokens.color.base },
        }}
      >
        <CloseIcon sx={{ fontSize: 22 }} />
      </IconButton>

      <Box
        sx={{
          position: "absolute",
          bottom: tokens.space.xl,
          left: { xs: tokens.space.lg, md: tokens.space.xl },
          right: { xs: tokens.space.lg, md: tokens.space.xl },
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.space.md}px`,
        }}
      >
        {content.logoUrl ? (
          <Box
            component="img"
            src={content.logoUrl}
            alt={content.title}
            sx={{
              alignSelf: "flex-start",
              maxWidth: { xs: "70%", md: "55%" },
              maxHeight: { xs: 110, sm: 140, md: 168 },
              objectFit: "contain",
              objectPosition: "left bottom",
              filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.6))",
            }}
          />
        ) : (
          <Typography
            sx={{
              fontSize: { xs: 36, sm: 48, md: 56 },
              lineHeight: 0.95,
              fontWeight: tokens.type.weight.bold,
              color: tokens.color.textPrimary,
              letterSpacing: "-0.01em",
              textShadow: "0 4px 24px rgba(0,0,0,0.6)",
              maxWidth: "75%",
            }}
          >
            {content.title}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: `${tokens.space.xs}px`, flexWrap: "wrap" }}>
          <Button
            startIcon={<PlayArrowIcon sx={{ fontSize: 28 }} />}
            sx={{
              backgroundColor: tokens.color.textPrimary,
              color: tokens.color.textInverse,
              fontSize: 16,
              fontWeight: tokens.type.weight.bold,
              paddingInline: `${tokens.space.lg}px`,
              minHeight: 44,
              borderRadius: `${tokens.radius.sm}px`,
              textTransform: "none",
              "&:hover": { backgroundColor: "rgba(245,245,245,0.85)" },
            }}
          >
            Play
          </Button>
          <CircleButton icon={<AddIcon sx={{ fontSize: 22 }} />} label="Add to My List" />
          <CircleButton icon={<ThumbUpOffAltIcon sx={{ fontSize: 20 }} />} label="Rate this title" />
        </Box>
      </Box>

      <IconButton
        aria-label="Mute"
        sx={{
          position: "absolute",
          bottom: tokens.space.xl,
          right: { xs: tokens.space.lg, md: tokens.space.xl },
          width: 40,
          height: 40,
          border: `2px solid ${tokens.color.borderStrong}`,
          color: tokens.color.textPrimary,
          backgroundColor: "rgba(20,20,20,0.4)",
          "&:hover": { backgroundColor: "rgba(20,20,20,0.7)" },
        }}
      >
        <VolumeOffIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}

function CircleButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <IconButton
      aria-label={label}
      sx={{
        width: 44,
        height: 44,
        border: `2px solid ${tokens.color.borderStrong}`,
        backgroundColor: "rgba(20,20,20,0.55)",
        color: tokens.color.textPrimary,
        "&:hover": {
          backgroundColor: "rgba(20,20,20,0.85)",
          borderColor: tokens.color.textPrimary,
        },
      }}
    >
      {icon}
    </IconButton>
  );
}

function MovieInfo({ content }: { content: DetailModalContent }) {
  return (
    <Box
      sx={{
        paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
        paddingBottom: `${tokens.space.lg}px`,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 280px" },
        columnGap: `${tokens.space.xl}px`,
        rowGap: `${tokens.space.md}px`,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${tokens.space.sm}px` }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.space.sm}px`,
            flexWrap: "wrap",
            fontSize: 14,
          }}
        >
          <Box component="span" sx={{ color: tokens.color.success, fontWeight: tokens.type.weight.bold, fontSize: 14 }}>
            {content.match}% Match
          </Box>
          {content.isNew && (
            <Box component="span" sx={{ color: tokens.color.success, fontWeight: tokens.type.weight.bold }}>
              New
            </Box>
          )}
          {content.runtime && <span>{content.runtime}</span>}
          {content.year && <span>{content.year}</span>}
          {content.formats.map((fmt) => (
            <Chip key={fmt}>{fmt}</Chip>
          ))}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.sm}px`, flexWrap: "wrap" }}>
          <RatingBadge>{content.rating}</RatingBadge>
          {content.maturityNotes.length > 0 && (
            <Typography component="span" sx={{ fontSize: 13, color: tokens.color.textSecondary }}>
              {content.maturityNotes.join(", ")}
            </Typography>
          )}
        </Box>

        {content.topTenRank !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.xs}px` }}>
            <TopTenBadge />
            <Typography sx={{ fontSize: 18, fontWeight: tokens.type.weight.bold, color: tokens.color.textPrimary }}>
              #{content.topTenRank} in {content.kind === "tv" ? "TV Shows" : "Movies"} Today
            </Typography>
          </Box>
        )}

        <Typography sx={{ fontSize: 15, lineHeight: 1.5, color: tokens.color.textPrimary, marginTop: `${tokens.space.xs}px` }}>
          {content.description}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: `${tokens.space.sm}px` }}>
        <MetaLine label="Cast" values={content.cast} truncate />
        <MetaLine label="Genres" values={content.genres} />
        <MetaLine label={content.kind === "tv" ? "This show is" : "This movie is"} values={content.mood} />
      </Box>
    </Box>
  );
}

function MoreLikeThis({ suggestions }: { suggestions: DetailModalSuggestion[] }) {
  return (
    <Box
      sx={{
        paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
        paddingBlock: `${tokens.space.lg}px`,
      }}
    >
      <Typography
        sx={{
          fontSize: 22,
          fontWeight: tokens.type.weight.semibold,
          color: tokens.color.textPrimary,
          marginBottom: `${tokens.space.md}px`,
          letterSpacing: "-0.005em",
        }}
      >
        More Like This
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
          gap: `${tokens.space.sm}px`,
        }}
      >
        {suggestions.map((s, i) => (
          <SuggestionCard key={s.title + i} suggestion={s} />
        ))}
      </Box>
    </Box>
  );
}

function SuggestionCard({ suggestion }: { suggestion: DetailModalSuggestion }) {
  return (
    <Box
      sx={{
        backgroundColor: tokens.color.surfaceMid,
        borderRadius: `${tokens.radius.sm}px`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        "&:hover": { transform: "scale(1.02)" },
      }}
    >
      <Box
        sx={{
          width: "100%",
          aspectRatio: "16 / 9",
          backgroundColor: tokens.color.surfaceHigh,
          backgroundImage: suggestion.backdropUrl ? `url("${suggestion.backdropUrl}")` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {suggestion.runtime && (
          <Box
            sx={{
              position: "absolute",
              right: 8,
              bottom: 8,
              paddingInline: "6px",
              paddingBlock: "2px",
              backgroundColor: "rgba(20,20,20,0.7)",
              color: tokens.color.textPrimary,
              fontSize: 11,
              fontWeight: tokens.type.weight.semibold,
              borderRadius: 2,
            }}
          >
            {suggestion.runtime}
          </Box>
        )}
      </Box>

      <Box sx={{ padding: `${tokens.space.sm}px`, display: "flex", flexDirection: "column", gap: "6px" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.space.xs}px`,
            fontSize: 12,
            flexWrap: "wrap",
          }}
        >
          <Box component="span" sx={{ color: tokens.color.success, fontWeight: tokens.type.weight.bold }}>
            {suggestion.match ?? 92}% Match
          </Box>
          {suggestion.year && (
            <Box component="span" sx={{ color: tokens.color.textSecondary }}>{suggestion.year}</Box>
          )}
          {suggestion.rating && <RatingBadge small>{suggestion.rating}</RatingBadge>}
        </Box>

        <Typography sx={{ fontSize: 14, fontWeight: tokens.type.weight.semibold, color: tokens.color.textPrimary, lineHeight: 1.2 }}>
          {suggestion.title}
        </Typography>

        {suggestion.description && (
          <Typography
            sx={{
              fontSize: 12,
              color: tokens.color.textSecondary,
              lineHeight: 1.4,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {suggestion.description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function About({ content }: { content: DetailModalContent }) {
  return (
    <Box
      sx={{
        paddingInline: { xs: `${tokens.space.lg}px`, md: `${tokens.space.xl}px` },
        paddingBlock: `${tokens.space.lg}px`,
        borderTop: `1px solid ${tokens.color.border}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", gap: `${tokens.space.xs}px`, marginBottom: `${tokens.space.md}px` }}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: tokens.type.weight.semibold,
            color: tokens.color.textPrimary,
            letterSpacing: "-0.005em",
          }}
        >
          About
        </Typography>
        <Typography sx={{ fontSize: 15, color: tokens.color.textSecondary }}>
          {content.title}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: `${tokens.space.sm}px` }}>
        {content.director && <MetaLine label="Director" values={[content.director]} />}
        <MetaLine label="Cast" values={content.cast} />
        <MetaLine label="Genres" values={content.genres} />
        <MetaLine label={content.kind === "tv" ? "This show is" : "This movie is"} values={content.mood} />
        <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.xs}px`, flexWrap: "wrap" }}>
          <Box component="span" sx={{ fontSize: 13, color: tokens.color.textSecondary, flexShrink: 0 }}>
            Maturity rating:
          </Box>
          <RatingBadge>{content.rating}</RatingBadge>
          {content.maturityNotes.length > 0 && (
            <Typography component="span" sx={{ fontSize: 13, color: tokens.color.textPrimary }}>
              {content.maturityNotes.join(", ")}
            </Typography>
          )}
          {content.maturityAudience && (
            <Typography component="span" sx={{ fontSize: 13, color: tokens.color.textPrimary }}>
              {content.maturityAudience}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function MetaLine({ label, values, truncate }: { label: string; values: string[]; truncate?: boolean }) {
  if (values.length === 0) return null;
  const display = truncate && values.length > 3
    ? `${values.slice(0, 3).join(", ")}, more`
    : values.join(", ");
  return (
    <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: tokens.color.textPrimary }}>
      <Box component="span" sx={{ color: tokens.color.textSecondary }}>{label}: </Box>
      {display}
    </Typography>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        fontSize: 10,
        fontWeight: tokens.type.weight.semibold,
        color: tokens.color.textSecondary,
        letterSpacing: "0.04em",
        paddingInline: "5px",
        paddingBlock: "1px",
        border: `1px solid ${tokens.color.borderStrong}`,
        borderRadius: "2px",
        lineHeight: 1.4,
      }}
    >
      {children}
    </Box>
  );
}

function RatingBadge({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        fontSize: small ? 10 : 12,
        fontWeight: tokens.type.weight.semibold,
        color: tokens.color.textPrimary,
        backgroundColor: "rgba(51,51,51,0.6)",
        borderLeft: `3px solid ${tokens.color.textPrimary}`,
        paddingInline: small ? "4px" : "6px",
        paddingBlock: "1px",
        letterSpacing: "0.04em",
        lineHeight: 1.4,
      }}
    >
      {children}
    </Box>
  );
}

function TopTenBadge() {
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        backgroundColor: tokens.color.brand,
        color: tokens.color.textPrimary,
        display: "grid",
        placeItems: "center",
        fontSize: 9,
        fontWeight: tokens.type.weight.bold,
        lineHeight: 1,
        letterSpacing: 0,
        borderRadius: 2,
      }}
    >
      <Box>
        <Box sx={{ fontSize: 7, lineHeight: 1 }}>TOP</Box>
        <Box sx={{ fontSize: 11, lineHeight: 1, fontWeight: 900 }}>10</Box>
      </Box>
    </Box>
  );
}
