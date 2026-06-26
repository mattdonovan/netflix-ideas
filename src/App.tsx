import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate, Link } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { hawkinsTheme } from "@/theme/hawkins";
import { tokens } from "@/theme/tokens";
import { Channels, ChannelBarsIcon } from "@/prototypes/channels/Channels";
import { IdeaHopperModal } from "@/prototypes/idea-hopper/IdeaHopperModal";
import { registeredPrototypes } from "@/prototypes/registry";
import { ExperimentsIndex, ExperimentSingle, ExperimentCompare } from "@/experiments/Experiments";
import mattAvatarLargeUrl from "@/assets/matt-avatar-large.jpg";
import hopperUrl from "@/assets/hopper.png";

const GITHUB_URL = "https://github.com/mattdonovan/netflix-ideas";
const PORTFOLIO_URL = "https://mattdonovan.me";

export default function App() {
  return (
    <ThemeProvider theme={hawkinsTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discovery" element={<Channels />} />
          {/* Back-compat: the prototype was renamed Channels → Discovery. */}
          <Route path="/channels" element={<Navigate to="/discovery" replace />} />
          <Route path="/experiments" element={<ExperimentsRouter />} />
          <Route path="/experiments/:id" element={<SingleExperimentRoute />} />
          {registeredPrototypes.map((p) => (
            <Route key={p.slug} path={`/${p.slug}`} element={<p.Component />} />
          ))}
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
 * Home — Netflix "Who's watching?" picker, repurposed as the landing screen
 * for this prototype set. Each tile maps to one of the prototypes / surfaces:
 * Channels (the built one), Idea Hopper (the parking lot), and Matt (the
 * about-the-author profile menu, identical to the one in the Channels header).
 */
function Home() {
  const [ideaHopperOpen, setIdeaHopperOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#141414",
        color: tokens.color.textPrimary,
        fontFamily: tokens.type.family.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "140px",
        paddingBottom: `${tokens.space["2xl"]}px`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top fade — matches the Figma HeaderLinearGradient. */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 68,
          background: "linear-gradient(180deg, rgba(0,0,0,0.7) 12.5%, rgba(0,0,0,0) 100%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `${tokens.space["2xl"]}px`,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 36, sm: 44, md: 50 },
            lineHeight: 1,
            color: "#fff",
            textAlign: "center",
            fontWeight: tokens.type.weight.regular,
            letterSpacing: "-0.01em",
          }}
        >
          Netflix Ideas
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: { xs: `${tokens.space.lg}px`, sm: "29px" },
            alignItems: "flex-start",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <ChannelsTile />
          <IdeaHopperTile onOpen={() => setIdeaHopperOpen(true)} />
          <MattTile />
          {registeredPrototypes.map((p) => (
            <RegistryTile key={p.slug} slug={p.slug} label={p.label} glyph={p.glyph} />
          ))}
        </Box>

        <ViewGithubButton />
      </Box>

      <IdeaHopperModal open={ideaHopperOpen} onClose={() => setIdeaHopperOpen(false)} />
    </Box>
  );
}

/**
 * Shared tile shell — 144px square + 22px label below, matching the Figma
 * LargeAvatar pattern. Renders as a button (or Link via render prop) so it's
 * keyboard-accessible. Hover lifts the border, mirroring the existing
 * PrototypeCard pattern on the previous home.
 */
function TileShell({
  label,
  children,
  onClick,
  asLink,
  externalHref,
  ariaLabel,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  asLink?: string;
  externalHref?: string;
  ariaLabel?: string;
}) {
  const tile = (
    <Box
      component={onClick ? "button" : "div"}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={ariaLabel || label}
      className="picker-tile"
      sx={{
        position: "relative",
        width: 144,
        height: 144,
        borderRadius: `${tokens.radius.sm}px`,
        overflow: "hidden",
        cursor: "pointer",
        padding: 0,
        border: "2px solid transparent",
        background: tokens.color.surfaceLow,
        color: "inherit",
        font: "inherit",
        display: "block",
        transition: `border-color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        "&:hover": { borderColor: "#fff" },
        // Trigger Channel bars hue-cycle when hovering the Channels tile.
        "&:hover .row-title-icon path": {
          animationName: "channelBarCycle",
          animationDuration: "1.4s",
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
        },
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "11px" }}>
      {asLink ? (
        <Link to={asLink} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          {tile}
        </Link>
      ) : externalHref ? (
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel || label}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          {tile}
        </a>
      ) : (
        tile
      )}
      <Typography
        sx={{
          fontSize: 18,
          lineHeight: "22px",
          color: "#808080",
          fontWeight: tokens.type.weight.regular,
          height: 22,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ChannelsTile() {
  return (
    <Tooltip title="Open Control" placement="bottom" arrow>
      <Box sx={{ display: "inline-block" }}>
        <TileShell label="Control" asLink="/discovery">
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 70% 70% at 50% 55%, #1F1B2E 0%, #0A0A0C 80%)",
              display: "grid",
              placeItems: "center",
              color: "#808080",
            }}
          >
            <Box className="row-title-icon" sx={{ display: "flex" }}>
              <ChannelBarsIcon size={80} />
            </Box>
          </Box>
        </TileShell>
      </Box>
    </Tooltip>
  );
}

/**
 * Tile for prototypes registered via `npm run build-idea`. One uniform shape
 * so generated prototypes read as a tier below the hand-coded Channels /
 * Idea Hopper / Matt tiles. Glyph is rendered centered against a tinted
 * surface — color hashed from the slug so each generated tile is visually
 * distinct without anyone choosing the color.
 */
function RegistryTile({ slug, label, glyph }: { slug: string; label: string; glyph: string }) {
  const hue = hashHue(slug);
  return (
    <Tooltip title={`Open ${label}`} placement="bottom" arrow>
      <Box sx={{ display: "inline-block" }}>
        <TileShell label={label} asLink={`/${slug}`}>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 70% 70% at 50% 55%, hsl(${hue}, 35%, 18%) 0%, #0A0A0C 80%)`,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 56,
              fontWeight: tokens.type.weight.regular,
              letterSpacing: "-0.02em",
            }}
          >
            {glyph}
          </Box>
        </TileShell>
      </Box>
    </Tooltip>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function IdeaHopperTile({ onOpen }: { onOpen: () => void }) {
  return (
    <Tooltip title="Open Idea Hopper" placement="bottom" arrow>
      <Box sx={{ display: "inline-block" }}>
        <TileShell label="Idea Hopper" onClick={onOpen}>
          <Box
            component="img"
            src={hopperUrl}
            alt=""
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 18%",
            }}
          />
        </TileShell>
      </Box>
    </Tooltip>
  );
}

/**
 * Matt tile — 144px portrait that opens mattdonovan.me in a new tab. On
 * hover the image darkens and a large "open in new tab" glyph fades in at
 * center, signalling that the click leaves the site.
 */
function MattTile() {
  return (
    <Tooltip title="Visit Portfolio" placement="bottom" arrow>
      <Box sx={{ display: "inline-block" }}>
        <TileShell label="Matt" externalHref={PORTFOLIO_URL} ariaLabel="Visit Portfolio">
          <Box
            component="img"
            src={mattAvatarLargeUrl}
            alt=""
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Box
            className="matt-tile-hover"
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              backgroundColor: "rgba(0,0,0,0.55)",
              color: "#fff",
              opacity: 0,
              transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
              pointerEvents: "none",
              ".picker-tile:hover &": { opacity: 1 },
            }}
          >
            <OpenInNewIcon sx={{ fontSize: 48 }} />
          </Box>
        </TileShell>
      </Box>
    </Tooltip>
  );
}

function ViewGithubButton() {
  return (
    <Box
      component="a"
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        minWidth: 178,
        paddingInline: "16px",
        border: "1px solid #808080",
        color: "#808080",
        fontSize: 17,
        fontWeight: tokens.type.weight.regular,
        textDecoration: "none",
        backgroundColor: "transparent",
        transition: `color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, border-color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        "&:hover": { color: "#fff", borderColor: "#fff" },
      }}
    >
      View GitHub
    </Box>
  );
}
