import { createTheme, type ThemeOptions } from "@mui/material/styles";
import { tokens } from "./tokens";

/**
 * Hawkins-flavored MUI theme.
 *
 * The strategy: take Material's component anatomy, override every visible
 * property at the token layer so the result reads as Netflix-flavored, not
 * Material. App code should NOT import from @mui/material directly — go
 * through our primitives in src/primitives/ which wrap MUI components with
 * a Hawkins surface. This mirrors what Netflix does with their internal
 * Hawkins package (obfuscating MUI at the boundary).
 */

const t = tokens;

const fontStack = t.type.family.sans;

const baseTheme: ThemeOptions = {
  palette: {
    mode: "dark",
    background: {
      default: t.color.base,
      paper: t.color.surfaceLow,
    },
    text: {
      primary: t.color.textPrimary,
      secondary: t.color.textSecondary,
      disabled: t.color.textTertiary,
    },
    primary: {
      main: t.color.accent,
      light: t.color.accentHover,
      dark: t.color.accent,
      contrastText: t.color.textPrimary,
    },
    secondary: {
      main: t.color.textPrimary,
      contrastText: t.color.textInverse,
    },
    error: { main: t.color.danger },
    warning: { main: t.color.warning },
    success: { main: t.color.success },
    divider: t.color.border,
  },
  shape: {
    borderRadius: t.radius.sm,
  },
  spacing: 4, // 4px base unit
  typography: {
    fontFamily: fontStack,
    fontWeightRegular: t.type.weight.regular,
    fontWeightMedium: t.type.weight.medium,
    fontWeightBold: t.type.weight.bold,
    h1: {
      fontSize: t.type.scale.h1.size,
      lineHeight: t.type.scale.h1.lineHeight,
      letterSpacing: t.type.scale.h1.letterSpacing,
      fontWeight: t.type.weight.bold,
    },
    h2: {
      fontSize: t.type.scale.h2.size,
      lineHeight: t.type.scale.h2.lineHeight,
      letterSpacing: t.type.scale.h2.letterSpacing,
      fontWeight: t.type.weight.bold,
    },
    h3: {
      fontSize: t.type.scale.h3.size,
      lineHeight: t.type.scale.h3.lineHeight,
      letterSpacing: t.type.scale.h3.letterSpacing,
      fontWeight: t.type.weight.semibold,
    },
    h4: {
      fontSize: t.type.scale.h4.size,
      lineHeight: t.type.scale.h4.lineHeight,
      letterSpacing: t.type.scale.h4.letterSpacing,
      fontWeight: t.type.weight.semibold,
    },
    body1: {
      fontSize: t.type.scale.body.size,
      lineHeight: t.type.scale.body.lineHeight,
      letterSpacing: t.type.scale.body.letterSpacing,
      fontWeight: t.type.weight.regular,
    },
    body2: {
      fontSize: t.type.scale.bodySmall.size,
      lineHeight: t.type.scale.bodySmall.lineHeight,
      letterSpacing: t.type.scale.bodySmall.letterSpacing,
      fontWeight: t.type.weight.regular,
    },
    button: {
      fontSize: t.type.scale.label.size,
      lineHeight: t.type.scale.label.lineHeight,
      letterSpacing: t.type.scale.label.letterSpacing,
      fontWeight: t.type.weight.semibold,
      textTransform: "none",
    },
    overline: {
      fontSize: t.type.scale.micro.size,
      lineHeight: t.type.scale.micro.lineHeight,
      letterSpacing: t.type.scale.micro.letterSpacing,
      fontWeight: t.type.weight.semibold,
      textTransform: "uppercase",
    },
    caption: {
      fontSize: t.type.scale.micro.size,
      lineHeight: t.type.scale.micro.lineHeight,
      letterSpacing: t.type.scale.micro.letterSpacing,
      fontWeight: t.type.weight.regular,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: t.color.base,
          color: t.color.textPrimary,
          fontFamily: fontStack,
          // Disable mouse cursor on the root TV surface — focus is the
          // interaction model. Cursor still works in dev for clickability,
          // we just hide it visually on the main app shell when desired.
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        "::selection": {
          background: t.color.accentMuted,
          color: t.color.textPrimary,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          borderRadius: t.radius.sm,
          paddingInline: t.space.lg,
          paddingBlock: t.space.sm,
          minHeight: 56,
          fontSize: t.type.scale.label.size,
          fontWeight: t.type.weight.semibold,
          transition: `transform ${t.motion.duration.press}ms ${t.motion.easing.press}, background-color ${t.motion.duration.focus}ms ${t.motion.easing.focus}`,
          "&:active": {
            transform: "scale(0.97)",
          },
        },
        // `contained` = the off-white "Open / More info"-style primary action.
        // For the Netflix-red brand button (Sign In on the Figma auth screen
        // and the Home hero's "Open Discovery"), use the `brand` color prop —
        // see the variants block below.
        contained: {
          backgroundColor: t.color.textPrimary,
          color: t.color.textInverse,
          "&:hover": {
            backgroundColor: t.color.textPrimary,
          },
        },
        outlined: {
          borderColor: t.color.borderStrong,
          borderWidth: 2,
          color: t.color.textPrimary,
          "&:hover": {
            borderColor: t.color.textPrimary,
            backgroundColor: "transparent",
          },
        },
        text: {
          color: t.color.textPrimary,
          "&:hover": {
            backgroundColor: t.color.surfaceMid,
          },
        },
      },
      variants: [
        {
          props: { color: "brand" as never },
          style: {
            backgroundColor: t.color.brand,
            color: t.color.textPrimary,
            "&:hover": { backgroundColor: "#F40612" },
          },
        },
        {
          props: { size: "small" as never },
          style: {
            minHeight: 40,
            paddingInline: t.space.md,
            fontSize: t.type.scale.bodySmall.size,
          },
        },
      ],
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: t.color.surfaceLow,
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "filled",
      },
      styleOverrides: {
        root: {
          // Figma input fields: dark fill, no underline, focus = inner white
          // stroke (not a glow). Error = brand red stroke + helper text below.
          "& .MuiFilledInput-root": {
            backgroundColor: t.color.surfaceMid,
            borderRadius: t.radius.sm,
            fontSize: t.type.scale.body.size,
            border: `2px solid transparent`,
            transition: `border-color ${t.motion.duration.focus}ms ${t.motion.easing.focus}, background-color ${t.motion.duration.focus}ms ${t.motion.easing.focus}`,
            "&:before, &:after": { display: "none" },
            "&:hover": {
              backgroundColor: t.color.surfaceHigh,
            },
            "&.Mui-focused": {
              backgroundColor: t.color.surfaceMid,
              borderColor: t.color.textPrimary,
            },
            "&.Mui-error": {
              borderColor: t.color.errorStroke,
            },
          },
          "& .MuiInputLabel-root": {
            color: t.color.textSecondary,
            fontSize: t.type.scale.bodySmall.size,
          },
          "& .MuiFormHelperText-root": {
            fontSize: t.type.scale.micro.size,
            letterSpacing: t.type.scale.micro.letterSpacing,
            marginTop: t.space.xs,
            "&.Mui-error": { color: t.color.errorStroke },
          },
        },
      },
    },
    MuiChip: {
      // Figma's "Icons and Labels" frame uses small-radius pills for tags,
      // not fully-rounded MUI pill chips. Match that visual.
      styleOverrides: {
        root: {
          borderRadius: t.radius.sm,
          height: 32,
          fontSize: t.type.scale.label.size,
          fontWeight: t.type.weight.semibold,
          paddingInline: t.space.xs,
          backgroundColor: t.color.surfaceMid,
          color: t.color.textPrimary,
          letterSpacing: "0.02em",
        },
        label: {
          paddingInline: t.space.xs,
        },
        outlined: {
          borderColor: t.color.borderStrong,
          backgroundColor: "transparent",
        },
      },
    },
  },
};

export const hawkinsTheme = createTheme(baseTheme);
export { tokens };
