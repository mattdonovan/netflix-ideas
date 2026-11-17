import { Box } from "@mui/material";
import wordmarkUrl from "@/assets/netflix-wordmark.svg";
import nUrl from "@/assets/image.png";

/**
 * Netflix wordmark — the canonical NETFLIX brand mark. SVG so it stays crisp
 * at any header size. Used in app headers and anywhere the brand quotation
 * is intentional.
 */

export function NetflixWordmark({
  height = 24,
}: {
  // Accepts a raw number (px) or any CSS length string (e.g., a clamp()
  // expression) so the wordmark can scale fluidly with viewport width.
  height?: number | string;
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
 * The Netflix "N" (src/assets/image.png): the ribbon mark with its fold
 * shading. Height drives size; width follows the image's aspect.
 */
export function NetflixN({
  size = 32,
}: {
  // Number (px) or any CSS length (e.g. clamp()).
  size?: number | string;
  color?: string;
}) {
  return <Box component="img" src={nUrl} alt="Netflix" sx={{ height: size, width: "auto", display: "block" }} />;
}
