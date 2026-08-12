import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import GitHubIcon from "@mui/icons-material/GitHub";
import ScienceIcon from "@mui/icons-material/Science";
import mattAvatarUrl from "@/assets/matt-avatar.png";
import { tokens } from "@/theme/tokens";

/**
 * Avatar + profile dropdown. Quotes the Netflix avatar-menu position (top-right
 * of the header) but the card itself is a "made by" credit for this prototype:
 * a portrait, role, short bio, and links out to the author's site, repo, and
 * the experiments landing page.
 */
export function ProfileMenu({ align = "right" }: { align?: ProfileCardAlign } = {}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on click-outside and on Escape so the menu behaves like a real popover.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <Box ref={wrapperRef} sx={{ position: "relative", marginLeft: `${tokens.space.sm}px` }}>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: 0,
          border: 0,
          background: "transparent",
          cursor: "pointer",
          color: tokens.color.textPrimary,
          "&:hover .avatar-chevron, &[aria-expanded='true'] .avatar-chevron": {
            transform: "rotate(180deg)",
          },
        }}
      >
        <Box
          component="img"
          src={mattAvatarUrl}
          alt="Matt Donovan"
          sx={{
            width: 32,
            height: 32,
            borderRadius: `${tokens.radius.sm}px`,
            objectFit: "cover",
            display: "block",
          }}
        />
        <ArrowDropDownIcon
          className="avatar-chevron"
          sx={{
            color: tokens.color.textPrimary,
            transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
          }}
        />
      </Box>

      {open && <ProfileCard onClose={() => setOpen(false)} align={align} />}
    </Box>
  );
}

/**
 * Which edge of the card pins to the avatar. "right" hangs the card down and
 * to the left (correct when the avatar is at the right of the header, as in
 * the web variant); "left" hangs it down and to the right, which is what the
 * TV nav needs now that the avatar sits in the top-left corner. "center"
 * straddles the trigger.
 */
export type ProfileCardAlign = "left" | "right" | "center";

export function ProfileCard({ onClose, align = "right" }: { onClose: () => void; align?: ProfileCardAlign }) {
  const links: Array<{
    href?: string;
    to?: string;
    label: string;
    sub: string;
    icon: ReactNode;
    external?: boolean;
  }> = [
    {
      href: "https://mattdonovan.me",
      label: "mattdonovan.me",
      sub: "Portfolio & contact",
      icon: <OpenInNewIcon sx={{ fontSize: 16 }} />,
      external: true,
    },
    {
      href: "https://github.com/mattdonovan/netflix-ideas",
      label: "GitHub repo",
      sub: "Source for this prototype",
      icon: <GitHubIcon sx={{ fontSize: 16 }} />,
      external: true,
    },
    {
      to: "/",
      label: "More experiments",
      sub: "Back to the landing page",
      icon: <ScienceIcon sx={{ fontSize: 16 }} />,
    },
  ];

  const isCenter = align === "center";
  const isLeft = align === "left";
  // Which edge pins to the trigger. Anchoring the card's right edge to a
  // left-hand avatar would push the whole 300px card off the left of the
  // viewport, so a left-hand avatar pins the card's left edge instead and the
  // card opens down-and-right.
  const pin = isCenter
    ? { left: "50%", right: "auto", transform: "translateX(-50%)" }
    : isLeft
      ? { left: 0, right: "auto", transform: "none" }
      : { left: "auto", right: 0, transform: "none" };
  const caretPin = isCenter
    ? { left: "50%", right: "auto", transform: "translateX(-50%) rotate(45deg)" }
    : isLeft
      ? { left: 12, right: "auto", transform: "rotate(45deg)" }
      : { left: "auto", right: 12, transform: "rotate(45deg)" };
  return (
    <Box
      role="menu"
      sx={{
        position: "absolute",
        top: "calc(100% + 14px)",
        ...pin,
        width: 300,
        backgroundColor: tokens.color.surfaceMid,
        border: `1px solid ${tokens.color.borderStrong}`,
        borderRadius: `${tokens.radius.md}px`,
        boxShadow: tokens.shadow.lg,
        padding: `${tokens.space.sm}px`,
        zIndex: 1000,
        // Small caret pointing back up at the avatar.
        "&::before": {
          content: '""',
          position: "absolute",
          top: -7,
          ...caretPin,
          width: 12,
          height: 12,
          backgroundColor: tokens.color.surfaceMid,
          borderTop: `1px solid ${tokens.color.borderStrong}`,
          borderLeft: `1px solid ${tokens.color.borderStrong}`,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: `${tokens.space.sm}px`, padding: `${tokens.space.xs}px` }}>
        <Box
          component="img"
          src={mattAvatarUrl}
          alt="Matt Donovan"
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: tokens.type.weight.semibold, color: tokens.color.textPrimary, lineHeight: 1.2 }}>
            Matt Donovan
          </Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary, lineHeight: 1.3, mt: "2px" }}>
            Product Designer · Expert design help for startups and small teams
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: 1, backgroundColor: tokens.color.border, marginBlock: `${tokens.space.xs}px` }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {links.map((link) => {
          const inner = (
            <Box
              role="menuitem"
              onClick={onClose}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: `${tokens.space.sm}px`,
                paddingInline: `${tokens.space.xs}px`,
                paddingBlock: "10px",
                borderRadius: `${tokens.radius.sm}px`,
                cursor: "pointer",
                color: tokens.color.textPrimary,
                textDecoration: "none",
                transition: `background-color ${tokens.motion.duration.press}ms ${tokens.motion.easing.press}`,
                "&:hover": { backgroundColor: tokens.color.surfaceHigh },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", color: tokens.color.textSecondary }}>{link.icon}</Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: tokens.type.weight.semibold, lineHeight: 1.2 }}>
                  {link.label}
                </Typography>
                <Typography sx={{ fontSize: 11, color: tokens.color.textTertiary, lineHeight: 1.3, mt: "1px" }}>
                  {link.sub}
                </Typography>
              </Box>
            </Box>
          );
          if (link.external && link.href) {
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {inner}
              </a>
            );
          }
          if (link.to) {
            return (
              <RouterLink
                key={link.label}
                to={link.to}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {inner}
              </RouterLink>
            );
          }
          return null;
        })}
      </Box>
    </Box>
  );
}
