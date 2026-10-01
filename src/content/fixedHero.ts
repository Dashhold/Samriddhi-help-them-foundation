import { HeroContent } from "../cms/types";

/**
 * The homepage hero is intentionally fixed in code. Administrators manage the
 * dedicated Fund Raising section below About, not the organisation's primary
 * identity statement.
 */
export const fixedHero: HeroContent = {
  eyebrow: "Samriddhi Help Team Foundation",
  title: "Together, we can create a",
  highlight: "better tomorrow",
  body: "We turn compassion into responsible, community-focused action through transparent support, meaningful collaboration and care.",
  imageUrl: "https://images.unsplash.com/photo-1524069290683-0457abfe42c3?auto=format&fit=crop&w=2000&q=88",
  imageAlt: "Children smiling together in a community setting",
  primaryCta: { label: "Donate now", href: "/donate" },
  secondaryCta: { label: "Explore our work", href: "/#work" },
};
