import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { tokens } from "@/theme/tokens";
import { experiments, getExperiment, type ValidationState } from "./registry";

const VALIDATION_LABEL: Record<ValidationState, string> = {
  draft: "Draft",
  validated: "Validated",
  deprecated: "Deprecated",
};

const VALIDATION_COLOR: Record<ValidationState, { fg: string; bg: string }> = {
  draft: { fg: "#FFD479", bg: "rgba(255, 212, 121, 0.12)" },
  validated: { fg: "#7BD389", bg: "rgba(123, 211, 137, 0.12)" },
  deprecated: { fg: "#A0A0A0", bg: "rgba(160, 160, 160, 0.12)" },
};

function ValidationChip({ state }: { state: ValidationState }) {
  const color = VALIDATION_COLOR[state];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        paddingInline: `${tokens.space.sm}px`,
        paddingBlock: "2px",
        fontSize: tokens.type.scale.micro.size,
        letterSpacing: tokens.type.scale.micro.letterSpacing,
        textTransform: "uppercase",
        fontWeight: tokens.type.weight.semibold,
        color: color.fg,
        backgroundColor: color.bg,
        borderRadius: `${tokens.radius.sm}px`,
      }}
    >
      {VALIDATION_LABEL[state]}
    </Box>
  );
}

/**
 * Experiments surface.
 *
 * Three modes, controlled by URL:
 *   - /experiments               — list all registered experiments
 *   - /experiments/:id           — render one experiment fullscreen
 *   - /experiments?compare=A,B   — render two experiments side-by-side
 *
 * Variants do not affect the main prototype. They mount independent
 * component trees.
 */

export function ExperimentsIndex() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: tokens.color.base,
        color: tokens.color.textPrimary,
        padding: `${tokens.space["3xl"]}px ${tokens.space["3xl"]}px`,
        fontFamily: tokens.type.family.sans,
      }}
    >
      <Box sx={{ maxWidth: 1200, margin: "0 auto" }}>
        <Typography sx={{ fontSize: tokens.type.scale.micro.size, color: tokens.color.textSecondary, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase", fontWeight: tokens.type.weight.semibold }}>
          Experiments
        </Typography>
        <Typography sx={{ fontSize: tokens.type.scale.h1.size, lineHeight: 1.06, letterSpacing: tokens.type.scale.h1.letterSpacing, fontWeight: tokens.type.weight.bold, mt: `${tokens.space.sm}px`, mb: `${tokens.space.md}px` }}>
          Side-by-side variants
        </Typography>
        <Typography sx={{ fontSize: tokens.type.scale.bodySmall.size, color: tokens.color.textSecondary, maxWidth: 720, mb: `${tokens.space.lg}px`, lineHeight: 1.4 }}>
          Each experiment is a self-contained variant of a prototype. Render one full-screen, or compare two — the main prototype is registered as <code style={{ color: tokens.color.textPrimary }}>channels-main</code> so you can always diff a variant against the canonical version.
        </Typography>
        <Typography sx={{ fontSize: tokens.type.scale.micro.size, color: tokens.color.textTertiary, maxWidth: 720, mb: `${tokens.space["2xl"]}px`, lineHeight: 1.5, letterSpacing: tokens.type.scale.micro.letterSpacing }}>
          Each card carries a validation state — <Box component="span" sx={{ color: VALIDATION_COLOR.draft.fg }}>Draft</Box> means it exists but hasn't been evaluated yet, <Box component="span" sx={{ color: VALIDATION_COLOR.validated.fg }}>Validated</Box> means it's been compared and is worth referencing. Borrowed from the Hawkins team's stated regret about shipping components before product-context validation — see <code style={{ color: tokens.color.textPrimary }}>context/hawkins/notes/operations-and-contribution-model.md</code>.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: `${tokens.space.lg}px` }}>
          {experiments.map((exp) => (
            <Box
              key={exp.id}
              sx={{
                backgroundColor: tokens.color.surfaceLow,
                borderRadius: `${tokens.radius.md}px`,
                padding: `${tokens.space.lg}px`,
                border: `2px solid ${tokens.color.border}`,
                transition: `border-color ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
                "&:hover": { borderColor: tokens.color.borderStrong },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: `${tokens.space.sm}px`, gap: `${tokens.space.sm}px` }}>
                <Typography sx={{ fontSize: tokens.type.scale.h4.size, fontWeight: tokens.type.weight.semibold, color: tokens.color.textPrimary }}>
                  {exp.name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.sm}px`, flexShrink: 0 }}>
                  <ValidationChip state={exp.validation} />
                  <Typography sx={{ fontSize: tokens.type.scale.micro.size, color: tokens.color.textTertiary, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase", fontWeight: tokens.type.weight.semibold }}>
                    {exp.tag}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: tokens.type.scale.bodySmall.size, color: tokens.color.textSecondary, mb: `${tokens.space.md}px`, lineHeight: 1.4 }}>
                {exp.description}
              </Typography>
              <Box sx={{ display: "flex", gap: `${tokens.space.sm}px` }}>
                <Link to={`/experiments/${exp.id}`} style={{ textDecoration: "none" }}>
                  <PillButton>Open</PillButton>
                </Link>
                <Link to={`/experiments?compare=channels-main,${exp.id}`} style={{ textDecoration: "none" }}>
                  <PillButton outlined>Compare vs. canonical</PillButton>
                </Link>
              </Box>
              <Box sx={{ mt: `${tokens.space.sm}px`, fontSize: tokens.type.scale.micro.size, color: tokens.color.textTertiary, letterSpacing: tokens.type.scale.micro.letterSpacing, textTransform: "uppercase" }}>
                id: {exp.id}
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: `${tokens.space["3xl"]}px`, padding: `${tokens.space.lg}px`, borderRadius: `${tokens.radius.md}px`, backgroundColor: tokens.color.surfaceLow }}>
          <Typography sx={{ fontSize: tokens.type.scale.label.size, letterSpacing: tokens.type.scale.label.letterSpacing, textTransform: "uppercase", color: tokens.color.textSecondary, fontWeight: tokens.type.weight.semibold, mb: `${tokens.space.sm}px` }}>
            How to add an experiment
          </Typography>
          <Typography sx={{ fontSize: tokens.type.scale.bodySmall.size, color: tokens.color.textSecondary, lineHeight: 1.5 }}>
            1. Copy a prototype component into <code style={{ color: tokens.color.textPrimary }}>src/experiments/&lt;id&gt;.tsx</code>. Modify the variant.<br />
            2. Register it in <code style={{ color: tokens.color.textPrimary }}>src/experiments/registry.tsx</code> with a stable id, name, description, and tag.<br />
            3. Compare it against <code style={{ color: tokens.color.textPrimary }}>channels-main</code> (or any other registered variant) via the side-by-side view.<br />
            4. Variants are isolated — they never affect the canonical prototype.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function ExperimentSingle({ id }: { id: string }) {
  const exp = getExperiment(id);
  if (!exp) return <NotFound id={id} />;
  return <>{exp.render()}</>;
}

export function ExperimentCompare() {
  const location = useLocation();
  const navigate = useNavigate();

  const ids = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const compare = params.get("compare") ?? "";
    return compare.split(",").filter(Boolean).slice(0, 2);
  }, [location.search]);

  if (ids.length < 2) {
    return (
      <Box sx={{ padding: `${tokens.space["3xl"]}px`, color: tokens.color.textPrimary, fontFamily: tokens.type.family.sans }}>
        <Typography>Need two experiment ids in <code>?compare=A,B</code>.</Typography>
      </Box>
    );
  }

  const left = getExperiment(ids[0]);
  const right = getExperiment(ids[1]);

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", backgroundColor: tokens.color.base }}>
      <ComparePane label={left?.name ?? ids[0]} sublabel={ids[0]}>
        {left ? left.render() : <NotFound id={ids[0]} />}
      </ComparePane>
      <Box sx={{ width: 2, backgroundColor: tokens.color.borderStrong }} />
      <ComparePane label={right?.name ?? ids[1]} sublabel={ids[1]}>
        {right ? right.render() : <NotFound id={ids[1]} />}
      </ComparePane>
      <Box
        component="button"
        onClick={() => navigate("/experiments")}
        sx={{
          position: "fixed",
          top: tokens.space.lg,
          right: tokens.space.lg,
          padding: `${tokens.space.sm}px ${tokens.space.md}px`,
          backgroundColor: tokens.color.surfaceMid,
          color: tokens.color.textPrimary,
          border: "none",
          borderRadius: `${tokens.radius.sm}px`,
          fontSize: tokens.type.scale.label.size,
          fontFamily: tokens.type.family.sans,
          fontWeight: tokens.type.weight.semibold,
          cursor: "pointer",
          zIndex: 100,
        }}
      >
        Back to experiments
      </Box>
    </Box>
  );
}

function ComparePane({ label, sublabel, children }: { label: string; sublabel: string; children: React.ReactNode }) {
  return (
    <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          top: tokens.space.sm,
          left: tokens.space.sm,
          padding: `${tokens.space.xs}px ${tokens.space.sm}px`,
          backgroundColor: "rgba(11, 11, 11, 0.7)",
          color: tokens.color.textPrimary,
          fontFamily: tokens.type.family.sans,
          fontSize: tokens.type.scale.micro.size,
          letterSpacing: tokens.type.scale.micro.letterSpacing,
          textTransform: "uppercase",
          fontWeight: tokens.type.weight.semibold,
          borderRadius: `${tokens.radius.sm}px`,
          backdropFilter: "blur(8px)",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        {label} · <Box component="span" sx={{ color: tokens.color.textTertiary }}>{sublabel}</Box>
      </Box>
      {children}
    </Box>
  );
}

function PillButton({ children, outlined }: { children: React.ReactNode; outlined?: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        paddingInline: `${tokens.space.md}px`,
        paddingBlock: `${tokens.space.xs}px`,
        backgroundColor: outlined ? "transparent" : tokens.color.textPrimary,
        color: outlined ? tokens.color.textPrimary : tokens.color.textInverse,
        border: outlined ? `2px solid ${tokens.color.borderStrong}` : "none",
        borderRadius: `${tokens.radius.sm}px`,
        fontSize: tokens.type.scale.label.size,
        fontWeight: tokens.type.weight.semibold,
        letterSpacing: tokens.type.scale.label.letterSpacing,
      }}
    >
      {children}
    </Box>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <Box sx={{ padding: `${tokens.space["3xl"]}px`, color: tokens.color.textPrimary, fontFamily: tokens.type.family.sans }}>
      <Typography sx={{ fontSize: tokens.type.scale.h3.size, fontWeight: tokens.type.weight.semibold }}>
        Experiment '{id}' not registered.
      </Typography>
      <Typography sx={{ fontSize: tokens.type.scale.bodySmall.size, color: tokens.color.textSecondary, mt: `${tokens.space.sm}px` }}>
        Add it to <code>src/experiments/registry.tsx</code>.
      </Typography>
    </Box>
  );
}
