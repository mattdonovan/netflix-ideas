import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate, Link } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Typography } from "@mui/material";
import { hawkinsTheme } from "@/theme/hawkins";
import { tokens } from "@/theme/tokens";
import { Channels } from "@/prototypes/channels/Channels";
import { ExperimentsIndex, ExperimentSingle, ExperimentCompare } from "@/experiments/Experiments";

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

function Home() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: tokens.color.base,
        color: tokens.color.textPrimary,
        fontFamily: tokens.type.family.sans,
        padding: `${tokens.space["3xl"]}px`,
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.space.xl}px`,
      }}
    >
      <Box sx={{ maxWidth: 960 }}>
        <Typography sx={{ fontSize: tokens.type.scale.micro.size, color: tokens.color.accent, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase", fontWeight: tokens.type.weight.semibold }}>
          netflix-ideas
        </Typography>
        <Typography sx={{ fontSize: tokens.type.scale.display.size, lineHeight: tokens.type.scale.display.lineHeight, letterSpacing: tokens.type.scale.display.letterSpacing, fontWeight: tokens.type.weight.bold, mt: `${tokens.space.md}px` }}>
          Two feature prototypes.
        </Typography>
        <Typography sx={{ fontSize: tokens.type.scale.h3.size, color: tokens.color.textSecondary, lineHeight: 1.3, mt: `${tokens.space.md}px`, maxWidth: 820 }}>
          A TV-first exploration of self-curated discovery and content-as-invitation, built on a Hawkins-flavored Material UI theme.
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: `${tokens.space.lg}px`, maxWidth: 1200 }}>
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
          Demo controls: ← → ↑ ↓ navigate · OK select · T talk · Esc close
        </Typography>
      </Box>
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
