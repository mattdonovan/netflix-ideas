import type { ChannelCategory } from "@/lib/claude";

/**
 * Initial channels visible on first load. These exist to:
 *  1. Demonstrate the row pattern at full visual density.
 *  2. Give the user something to navigate before they author their own.
 *  3. Set expectations for what a well-formed channel looks like.
 */

export type Channel = {
  id: string;
  category: ChannelCategory;
  /**
   * Hand-tuned color palette for the tiles in this channel — used as the
   * fallback artwork. Picked to read as a coherent visual mood at row scale.
   */
  tilePalette: string[];
};

export const seedChannels: Channel[] = [
  {
    id: "seed-warm",
    category: {
      title: "Movies with warm cinematography",
      tags: ["visual-tone", "drama", "atmosphere"],
      tone: ["warm", "intimate", "deliberate", "amber"],
      moodColor: "#D9A45F",
      exemplars: [
        { title: "Lost in Translation", year: 2003, oneLine: "Neon and longing in equal measure." },
        { title: "Call Me by Your Name", year: 2017, oneLine: "Summer light made unbearable." },
        { title: "The Florida Project", year: 2017, oneLine: "Childhood in pastel and bruise." },
        { title: "Moonlight", year: 2016, oneLine: "Color as a way of remembering." },
        { title: "Past Lives", year: 2023, oneLine: "Held breath in low evening." },
        { title: "Aftersun", year: 2022, oneLine: "Memory rendered as a slow exposure." },
      ],
    },
    tilePalette: ["#8B4A2F", "#C97757", "#D9A45F", "#A8693E", "#6B3F2A", "#E2B47C", "#9B5C3D"],
  },
  {
    id: "seed-new-nostalgia",
    category: {
      title: "New nostalgia",
      tags: ["coming-of-age", "retro", "earnest"],
      tone: ["earnest", "tender", "soft-edged"],
      moodColor: "#5B7CB8",
      exemplars: [
        { title: "Stranger Things", year: 2016, oneLine: "Childhood in synth and bicycle gears." },
        { title: "The Wonder Years (2021)", year: 2021, oneLine: "Memory remixed in present tense." },
        { title: "Yellowjackets", year: 2021, oneLine: "Cassette-tape grief, two decades cold." },
        { title: "Pen15", year: 2019, oneLine: "Adolescence drawn at adult magnification." },
        { title: "Master of None S3", year: 2021, oneLine: "Quiet apartments and slow afternoons." },
        { title: "Reservation Dogs", year: 2021, oneLine: "Smalltown summer, in a different key." },
      ],
    },
    tilePalette: ["#3D5A8C", "#5B7CB8", "#7B9DC9", "#2E4670", "#94A8C9", "#456E9F", "#6889B5"],
  },
  {
    id: "seed-monster",
    category: {
      title: "Monster movies with soul",
      tags: ["horror", "creature-feature", "character-driven"],
      tone: ["atmospheric", "earnest", "tactile"],
      moodColor: "#8B3A3A",
      exemplars: [
        { title: "The Shape of Water", year: 2017, oneLine: "A creature loved as a person." },
        { title: "Annihilation", year: 2018, oneLine: "Beauty as the most unsettling form." },
        { title: "Pan's Labyrinth", year: 2006, oneLine: "Fairy tale that bleeds when cut." },
        { title: "Under the Skin", year: 2013, oneLine: "A monster looking back at us." },
        { title: "Nope", year: 2022, oneLine: "Spectacle that watches you watching." },
        { title: "Color Out of Space", year: 2019, oneLine: "Cosmic horror in a chromatic key." },
      ],
    },
    tilePalette: ["#5C2929", "#8B3A3A", "#3D1F1F", "#A04B4B", "#702D2D", "#4D2424", "#933F3F"],
  },
];
