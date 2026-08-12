import { Box, Typography, IconButton } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { tokens } from "@/theme/tokens";

/**
 * Page footer — quotes Netflix's actual home footer: a row of four social
 * icons, four columns of muted links, and the copyright line. Sits at the
 * bottom of the page on the same dark surface as the rest of Channels.
 */
export function Footer() {
  const columns: string[][] = [
    ["Audio Description", "Investor Relations", "Privacy", "Contact Us"],
    ["Help Center", "Jobs", "Legal Notices", "Do Not Sell or Share My Personal Information"],
    ["Gift Cards", "Netflix Shop", "Cookie Preferences", "Ad Choices"],
    ["Media Center", "Terms of Use", "Corporate Information"],
  ];
  const socials = [
    { Icon: FacebookIcon, label: "Facebook" },
    { Icon: InstagramIcon, label: "Instagram" },
    { Icon: TwitterIcon, label: "Twitter" },
    { Icon: YouTubeIcon, label: "YouTube" },
  ];
  return (
    <Box
      component="footer"
      sx={{
        // Footer sits below the rows on the same page surface; add generous
        // top padding so it doesn't crowd the last row's hover bloom.
        marginTop: `${tokens.space["2xl"]}px`,
        paddingBottom: `${tokens.space.xl}px`,
        color: tokens.color.textSecondary,
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${tokens.space.md}px`,
          mb: `${tokens.space.md}px`,
        }}
      >
        {socials.map(({ Icon, label }) => (
          <IconButton
            key={label}
            aria-label={label}
            sx={{
              padding: 0,
              color: tokens.color.textPrimary,
              "&:hover": { color: tokens.color.textSecondary, backgroundColor: "transparent" },
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </IconButton>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          columnGap: `${tokens.space.md}px`,
          rowGap: `${tokens.space.xs}px`,
          mb: `${tokens.space.md}px`,
        }}
      >
        {columns.map((col, ci) => (
          <Box key={ci} sx={{ display: "flex", flexDirection: "column", gap: `${tokens.space.xs}px` }}>
            {col.map((link) => (
              <Typography
                key={link}
                component="a"
                href="#"
                sx={{
                  fontSize: 13,
                  color: tokens.color.textSecondary,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  textDecorationColor: "rgba(168,168,168,0.4)",
                  cursor: "pointer",
                  "&:hover": { color: tokens.color.textPrimary },
                }}
              >
                {link}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>

      <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary }}>
        © 1997-{new Date().getFullYear()} Netflix, Inc.
      </Typography>
    </Box>
  );
}
