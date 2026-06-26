import type { ChannelCategory } from "@/lib/claude";
import { freshChannels } from "./freshChannels";

/**
 * Initial Channels visible on first load.
 *
 * These mirror the Netflix-standard rows a user sees on the home page —
 * "Top 10", "New on Netflix", "Critically Acclaimed", etc. — so the prototype
 * starts in a recognizable shape. The user then re-categorizes any single row
 * by opening the PromptPanel from the row-level magic icon.
 */

export type Channel = {
  id: string;
  category: ChannelCategory;
  /**
   * Hand-tuned color palette for the tiles in this channel — used as the
   * fallback artwork when TMDB returns no backdrop.
   */
  tilePalette: string[];
};

// Shared palettes — kept here so we don't repeat dark color strings ten times.
const PALETTE = {
  charcoal: ["#2A2A2A", "#1F1F1F", "#3A3A3A", "#252525", "#333333"],
  oxide: ["#1F2A3A", "#283446", "#1A2230", "#33425A", "#0F1620"],
  amber: ["#8B4A2F", "#C97757", "#D9A45F", "#A8693E", "#6B3F2A"],
  steel: ["#3D5A8C", "#5B7CB8", "#2E4670", "#456E9F", "#6889B5"],
  ember: ["#5C2929", "#8B3A3A", "#3D1F1F", "#A04B4B", "#702D2D"],
  fog: ["#444E58", "#2F363D", "#5A6671", "#3A4148", "#262A2E"],
};

const baseChannels: Channel[] = [
  {
    id: "your-next-watch",
    category: {
      title: "New on Netflix",
      tags: ["personalized", "recommendations"],
      tone: ["intimate", "considered", "varied"],
      moodColor: "#D9A45F",
      exemplars: [
        { title: "Past Lives", year: 2023, oneLine: "Held breath in low evening." },
        { title: "The Bear", year: 2022, oneLine: "Kitchen as a place where you are loved." },
        { title: "Severance", year: 2022, oneLine: "Office building as a moral fork." },
        { title: "Aftersun", year: 2022, oneLine: "Memory rendered as a slow exposure." },
        { title: "Atlanta", year: 2016, oneLine: "City as character, in a different key." },
        { title: "Drive My Car", year: 2021, oneLine: "Grief on a cassette deck." },
        { title: "Fleabag", year: 2016, oneLine: "Confession as a comic timing exercise." },
        { title: "Lost in Translation", year: 2003, oneLine: "Neon and longing in equal measure." },
      ],
    },
    tilePalette: PALETTE.amber,
  },
  {
    id: "new-on-netflix",
    category: {
      title: "Your Next Watch",
      tags: ["new", "recent"],
      tone: ["fresh", "current", "varied"],
      moodColor: "#E50914",
      exemplars: [
        { title: "House of Ninjas", year: 2024, oneLine: "A retired clan dragged back in." },
        { title: "3 Body Problem", year: 2024, oneLine: "Physics as a slow-motion war." },
        { title: "Ripley", year: 2024, oneLine: "Black-and-white envy in widescreen." },
        { title: "Baby Reindeer", year: 2024, oneLine: "A stalker story told by the prey." },
        { title: "Shōgun", year: 2024, oneLine: "Power, courtesy, and the long view." },
        { title: "Rebel Ridge", year: 2024, oneLine: "A small town that doesn't let go." },
        { title: "Hit Man", year: 2024, oneLine: "Identity as a series of guesses." },
        { title: "Carry-On", year: 2024, oneLine: "TSA as a one-man hostage situation." },
      ],
    },
    tilePalette: PALETTE.charcoal,
  },
  {
    id: "top-10-tv-us",
    category: {
      title: "Top 10 TV Shows in the U.S. Today",
      tags: ["top-10", "trending-tv"],
      tone: ["popular", "current"],
      moodColor: "#FFFFFF",
      exemplars: [
        { title: "Stranger Things", year: 2016, oneLine: "Childhood in synth and bicycle gears." },
        { title: "Wednesday", year: 2022, oneLine: "Boarding school as a haunted house." },
        { title: "Bridgerton", year: 2020, oneLine: "Regency drama with a soundtrack." },
        { title: "Squid Game", year: 2021, oneLine: "Children's games at adult stakes." },
        { title: "The Crown", year: 2016, oneLine: "Power as a series of quiet rooms." },
        { title: "Avatar: The Last Airbender", year: 2024, oneLine: "Worldbuilding at live-action scale." },
        { title: "The Diplomat", year: 2023, oneLine: "Foreign service as marriage counseling." },
        { title: "Cobra Kai", year: 2018, oneLine: "Karate as midlife reckoning." },
        { title: "Lupin", year: 2021, oneLine: "A gentleman thief with a long memory." },
        { title: "One Piece", year: 2023, oneLine: "Pirates as found family." },
      ],
    },
    tilePalette: PALETTE.fog,
  },
  {
    id: "critically-acclaimed-tv",
    category: {
      title: "Critically Acclaimed TV Shows",
      tags: ["prestige-tv", "acclaimed"],
      tone: ["considered", "rigorous", "earned"],
      moodColor: "#5B7CB8",
      exemplars: [
        { title: "Succession", year: 2018, oneLine: "Inheritance as combat sport." },
        { title: "Severance", year: 2022, oneLine: "Office building as a moral fork." },
        { title: "The Bear", year: 2022, oneLine: "Kitchen as a place where you are loved." },
        { title: "Atlanta", year: 2016, oneLine: "City as character, in a different key." },
        { title: "Better Call Saul", year: 2015, oneLine: "Moral drift in slow motion." },
        { title: "Breaking Bad", year: 2008, oneLine: "A chemistry teacher's long fall." },
        { title: "Beef", year: 2023, oneLine: "Road rage as a long conversation." },
        { title: "True Detective", year: 2014, oneLine: "Detective story as theology." },
        { title: "Mindhunter", year: 2017, oneLine: "Interviews with the unspeakable." },
        { title: "The Queen's Gambit", year: 2020, oneLine: "Genius as a kind of solitude." },
      ],
    },
    tilePalette: PALETTE.steel,
  },
  {
    id: "todays-top-picks",
    category: {
      title: "Today's Top Picks for You",
      tags: ["personalized", "top-picks"],
      tone: ["curated", "varied", "high-signal"],
      moodColor: "#8B3A3A",
      exemplars: [
        { title: "Dune: Part Two", year: 2024, oneLine: "Empire on the surface of a planet." },
        { title: "Glass Onion", year: 2022, oneLine: "A whodunit that knows the genre." },
        { title: "The Killer", year: 2023, oneLine: "Routine as a discipline." },
        { title: "Maestro", year: 2023, oneLine: "Bernstein in close and oblique angles." },
        { title: "All Quiet on the Western Front", year: 2022, oneLine: "War as a slow erosion of the self." },
        { title: "Leave the World Behind", year: 2023, oneLine: "A house at the end of certainty." },
        { title: "Society of the Snow", year: 2023, oneLine: "Survival as a kind of remembering." },
        { title: "Damsel", year: 2024, oneLine: "Fairytale flipped by the dragon." },
      ],
    },
    tilePalette: PALETTE.ember,
  },
  {
    id: "documentaries",
    category: {
      title: "Documentaries",
      tags: ["documentary", "nonfiction"],
      tone: ["observational", "rigorous", "earned"],
      moodColor: "#444E58",
      exemplars: [
        { title: "Our Planet", year: 2019, oneLine: "The earth at its rare scales." },
        { title: "The Social Dilemma", year: 2020, oneLine: "Platforms told on themselves." },
        { title: "Wild Wild Country", year: 2018, oneLine: "Utopia and its discontents." },
        { title: "Making a Murderer", year: 2015, oneLine: "Process as a kind of horror." },
        { title: "Tiger King", year: 2020, oneLine: "American eccentricity at its tail end." },
        { title: "13th", year: 2016, oneLine: "An amendment's long shadow." },
        { title: "Free Solo", year: 2018, oneLine: "Risk reasoned out in real time." },
        { title: "American Murder: The Family Next Door", year: 2020, oneLine: "A family as a crime scene." },
      ],
    },
    tilePalette: PALETTE.fog,
  },
  {
    id: "international-hits",
    category: {
      title: "International Hits",
      tags: ["international", "global"],
      tone: ["worldly", "varied"],
      moodColor: "#5B7CB8",
      exemplars: [
        { title: "Money Heist", year: 2017, oneLine: "Robbery as performance art." },
        { title: "Dark", year: 2017, oneLine: "A town that keeps folding into itself." },
        { title: "Squid Game", year: 2021, oneLine: "Children's games at adult stakes." },
        { title: "Lupin", year: 2021, oneLine: "A gentleman thief with a long memory." },
        { title: "Berlin", year: 2023, oneLine: "A heist before the heist." },
        { title: "Shōgun", year: 2024, oneLine: "Power, courtesy, and the long view." },
        { title: "House of Ninjas", year: 2024, oneLine: "A retired clan dragged back in." },
        { title: "All Quiet on the Western Front", year: 2022, oneLine: "War as a slow erosion of the self." },
      ],
    },
    tilePalette: PALETTE.oxide,
  },
  {
    id: "award-winners",
    category: {
      title: "Award-Winning Films",
      tags: ["awards", "acclaimed"],
      tone: ["earned", "considered", "rigorous"],
      moodColor: "#D9A45F",
      exemplars: [
        { title: "Roma", year: 2018, oneLine: "A childhood remembered in long takes." },
        { title: "The Irishman", year: 2019, oneLine: "Loyalty as a long, quiet ending." },
        { title: "Marriage Story", year: 2019, oneLine: "Divorce as duet." },
        { title: "CODA", year: 2021, oneLine: "Family as a song you choose to leave." },
        { title: "Nomadland", year: 2020, oneLine: "The country at its dispersed edge." },
        { title: "The Trial of the Chicago 7", year: 2020, oneLine: "A courtroom turned into a stage." },
        { title: "Mank", year: 2020, oneLine: "Hollywood writing itself into history." },
        { title: "Tár", year: 2022, oneLine: "Power as a closed acoustic." },
      ],
    },
    tilePalette: PALETTE.amber,
  },
];

/**
 * Hand-authored seed rows above, plus live "what's on Netflix US right now"
 * rows (recent movies + series via TMDB Discover, games via RAWG) generated by
 * scripts/enrich-catalog.mjs into freshChannels.ts. Re-run that script to
 * refresh the fresh rows.
 */
export const seedChannels: Channel[] = [...baseChannels, ...freshChannels];
