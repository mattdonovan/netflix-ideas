import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate, Link } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Typography } from "@mui/material";
import { hawkinsTheme } from "@/theme/hawkins";
import { tokens } from "@/theme/tokens";
import { Channels } from "@/prototypes/channels/Channels";
import { ExperimentsIndex, ExperimentSingle, ExperimentCompare } from "@/experiments/Experiments";
import { findInCatalog } from "@/lib/catalog";

export default function App() {
  return (
    <ThemeProvider theme={hawkinsTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/experiments" element={<ExperimentsRouter />} />
          <Route path="/experiments/:id" element={<SingleExperimentRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function ExperimentsRouter() {
  const location = useLocation();
  const compare = new URLSearchParams(location.search).get("compare");
  if (compare) return <ExperimentCompare />;
  return <ExperimentsIndex />;
}

function SingleExperimentRoute() {
  const { id } = useParams();
  if (!id) return <Navigate to="/experiments" replace />;
  return <ExperimentSingle id={id} />;
}

/**
 * Featured title for the home hero. Picked by hand for backdrop quality —
 * Blade Runner 2049 has one of the strongest backdrop images in the catalog
 * and matches the "atmospheric, cinematic" thesis of this prototype set.
 * Swap with another catalog entry to rotate.
 */
const HERO_FEATURE = {
  catalogTitle: "Blade Runner 2049",
  year: 2017,
  pitch: "Self-curated discovery and content-as-invitation, designed for the couch.",
  tagline: "Two feature prototypes for Netflix, built TV-first.",
};

function Home() {
  const feature = findInCatalog(HERO_FEATURE.catalogTitle, HERO_FEATURE.year);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: tokens.color.base,
        color: tokens.color.textPrimary,
        fontFamily: tokens.type.family.sans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <HomeHero feature={feature} />

      <Box
        sx={{
          padding: {
            xs: `${tokens.space.lg}px`,
            sm: `${tokens.space.xl}px`,
            md: `${tokens.space["2xl"]}px`,
            lg: `${tokens.space["3xl"]}px`,
          },
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.space.xl}px`,
          flex: 1,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr",
              md: "repeat(auto-fit, minmax(340px, 1fr))",
            },
            gap: `${tokens.space.lg}px`,
            maxWidth: 1200,
          }}
        >
          <PrototypeCard
            to="/channels"
            tag="Prototype 1"
            title="Channels"
            status="First pass"
            description="Replace the predefined recommendation rows with rows you describe in your own words. Speak or type. The AI assigns a category, the Ranker fills it in, and you can tweak until it's right."
          />
          <PrototypeCard
            to="/channels"
            tag="Prototype 2"
            title="Invite"
            status="Planned"
            description="Share a show or movie with a friend via QR → mobile companion page → unique link → free sample → recommendation graph. Not yet built."
            disabled
          />
          <PrototypeCard
            to="/experiments"
            tag="Sandbox"
            title="Experiments"
            status="Open"
            description="Side-by-side variants of the prototypes. Compare layouts, motion, and copy without touching the canonical versions."
          />
        </Box>

        <Box sx={{ marginTop: "auto", paddingTop: `${tokens.space.xl}px`, color: tokens.color.textTertiary }}>
          <Typography sx={{ fontSize: tokens.type.scale.micro.size, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase" }}>
            Click a card or, inside Channels, use ← → ↑ ↓ to navigate · Enter to edit · T to talk · Esc to close
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Netflix-style hero billboard. Full-bleed backdrop image, dark gradient on
 * the left for text legibility, title + tagline + CTA pair. The featured
 * artwork comes from the enriched catalog (TMDB backdrops).
 *
 * Why the brand red sits on the primary CTA here and not on the system:
 * `tokens.color.brand` (#E50914) is the "intentional quotation" — Netflix red
 * on a Netflix-shaped hero is the joke. The system accent (#E4404C) stays
 * the voice for everything else.
 */
function HomeHero({ feature }: { feature: ReturnType<typeof findInCatalog> }) {
  const backdrop = feature?.backdropUrl;
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: 520, md: 640, lg: 720 },
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        backgroundColor: tokens.color.surfaceLow,
        backgroundImage: backdrop ? `url("${backdrop}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center 25%",
      }}
    >
      {/* Left-to-right legibility gradient over the artwork */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${tokens.color.base} 0%, rgba(11,11,11,0.85) 30%, rgba(11,11,11,0.2) 60%, rgba(11,11,11,0) 100%)`,
        }}
      />
      {/* Bottom fade into the page */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(11,11,11,0) 60%, ${tokens.color.base} 100%)`,
        }}
      />

      <Box
        sx={{
          position: "relative",
          padding: {
            xs: `${tokens.space.lg}px`,
            sm: `${tokens.space.xl}px`,
            md: `${tokens.space["2xl"]}px`,
            lg: `${tokens.space["3xl"]}px`,
          },
          maxWidth: 820,
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.space.md}px`,
        }}
      >
        <Typography sx={{ fontSize: tokens.type.scale.micro.size, color: tokens.color.brand, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase", fontWeight: tokens.type.weight.semibold }}>
          netflix-ideas
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: 40, sm: 56, md: 80, lg: tokens.type.scale.display.size },
            lineHeight: tokens.type.scale.display.lineHeight,
            letterSpacing: tokens.type.scale.display.letterSpacing,
            fontWeight: tokens.type.weight.bold,
          }}
        >
          {HERO_FEATURE.tagline}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: tokens.type.scale.h4.size, md: tokens.type.scale.h3.size },
            color: tokens.color.textSecondary,
            lineHeight: 1.3,
            fontWeight: tokens.type.weight.light,
            maxWidth: 720,
          }}
        >
          {HERO_FEATURE.pitch}
        </Typography>

        <Box sx={{ display: "flex", gap: `${tokens.space.sm}px`, mt: `${tokens.space.md}px`, flexWrap: "wrap" }}>
          <Link to="/channels" style={{ textDecoration: "none" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: `${tokens.space.xs}px`,
                backgroundColor: tokens.color.brand,
                color: tokens.color.textPrimary,
                fontWeight: tokens.type.weight.semibold,
                fontSize: tokens.type.scale.body.size,
                paddingInline: `${tokens.space.lg}px`,
                paddingBlock: `${tokens.space.sm}px`,
                borderRadius: `${tokens.radius.sm}px`,
                cursor: "pointer",
                transition: `background-color ${tokens.motion.duration.press}ms ${tokens.motion.easing.press}`,
                "&:hover": { backgroundColor: "#F40612" },
              }}
            >
              <span aria-hidden style={{ fontSize: tokens.type.scale.h4.size, lineHeight: 1 }}>▶</span>
              Open Channels
            </Box>
          </Link>
          <Link to="/experiments" style={{ textDecoration: "none" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: `${tokens.space.xs}px`,
                backgroundColor: "rgba(245,245,245,0.16)",
                color: tokens.color.textPrimary,
                fontWeight: tokens.type.weight.semibold,
                fontSize: tokens.type.scale.body.size,
                paddingInline: `${tokens.space.lg}px`,
                paddingBlock: `${tokens.space.sm}px`,
                borderRadius: `${tokens.radius.sm}px`,
                cursor: "pointer",
                transition: `background-color ${tokens.motion.duration.press}ms ${tokens.motion.easing.press}`,
                "&:hover": { backgroundColor: "rgba(245,245,245,0.24)" },
              }}
            >
              <span aria-hidden style={{ fontSize: tokens.type.scale.h4.size, lineHeight: 1 }}>ⓘ</span>
              More info
            </Box>
          </Link>
        </Box>
      </Box>

      {/* Featured-artwork attribution, bottom right */}
      {feature && (
        <Typography
          sx={{
            position: "absolute",
            right: { xs: tokens.space.lg, md: tokens.space["2xl"] },
            bottom: tokens.space.lg,
            fontSize: tokens.type.scale.micro.size,
            color: tokens.color.textTertiary,
            letterSpacing: tokens.type.scale.micro.letterSpacing,
            textTransform: "uppercase",
            fontWeight: tokens.type.weight.semibold,
          }}
        >
          Hero artwork · {feature.title}
        </Typography>
      )}
    </Box>
  );
}

function PrototypeCard({
  to,
  tag,
  title,
  status,
  description,
  disabled,
}: {
  to: string;
  tag: string;
  title: string;
  status: string;
  description: string;
  disabled?: boolean;
}) {
  const card = (
    <Box
      sx={{
        backgroundColor: tokens.color.surfaceLow,
        border: `2px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius.md}px`,
        padding: `${tokens.space.lg}px`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.space.sm}px`,
        transition: `border-color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        "&:hover": {
          borderColor: disabled ? tokens.color.border : tokens.color.textPrimary,
          transform: disabled ? "none" : "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography sx={{ fontSize: tokens.type.scale.micro.size, color: tokens.color.textTertiary, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase", fontWeight: tokens.type.weight.semibold }}>
          {tag}
        </Typography>
        <Typography sx={{ fontSize: tokens.type.scale.micro.size, color: status === "First pass" ? tokens.color.accent : tokens.color.textTertiary, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase", fontWeight: tokens.type.weight.semibold }}>
          {status}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: tokens.type.scale.h2.size, lineHeight: 1.1, letterSpacing: tokens.type.scale.h2.letterSpacing, fontWeight: tokens.type.weight.bold, color: tokens.color.textPrimary }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: tokens.type.scale.bodySmall.size, color: tokens.color.textSecondary, lineHeight: 1.4 }}>
        {description}
      </Typography>
    </Box>
  );
  if (disabled) return card;
  return <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>{card}</Link>;
}
