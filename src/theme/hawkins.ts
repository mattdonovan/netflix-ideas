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
          "& .MuiFilledInput-root": {
            backgroundColor: t.color.surfaceMid,
            borderRadius: t.radius.sm,
            fontSize: t.type.scale.body.size,
            "&:before, &:after": { display: "none" },
            "&:hover, &.Mui-focused": {
              backgroundColor: t.color.surfaceHigh,
            },
          },
          "& .MuiInputLabel-root": {
            color: t.color.textSecondary,
            fontSize: t.type.scale.bodySmall.size,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: t.radius.pill,
          height: 40,
          fontSize: t.type.scale.label.size,
          paddingInline: t.space.sm,
          backgroundColor: t.color.surfaceMid,
        },
      },
    },
  },
};

export const hawkinsTheme = createTheme(baseTheme);
export { tokens };
