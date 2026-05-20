import { Box } from "@mui/material";
import wordmarkUrl from "@/assets/netflix-wordmark.svg";
import { tokens } from "@/theme/tokens";

/**
 * Netflix wordmark — the canonical NETFLIX brand mark. SVG so it stays crisp
 * at any header size. Used in app headers and anywhere the brand quotation
 * is intentional.
 */

export function NetflixWordmark({
  height = 24,
}: {
  height?: number;
}) {
  return (
    <Box
      component="img"
      src={wordmarkUrl}
      alt="Netflix"
      sx={{
        height,
        width: "auto",
        display: "block",
      }}
    />
  );
}

/**
 * Compact "N" mark for tight spaces (app icon analogs, etc.). Hand-rolled
 * SVG since the Figma N is a layered raster and a clean SVG renders crisply
 * at any size.
 */
export function NetflixN({
  size = 32,
  color = tokens.color.brand,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Box
      component="svg"
      viewBox="0 0 28 50"
      sx={{ width: size * 0.56, height: size, display: "block" }}
      aria-label="Netflix"
    >
      <path d="M 4 0 L 12 0 L 24 32 L 24 0 L 28 0 L 28 50 L 22 50 L 8 14 L 8 50 L 4 50 Z" fill={color} />
    </Box>
  );
}
