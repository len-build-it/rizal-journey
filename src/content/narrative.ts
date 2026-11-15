/**
 * The narrative layer: chapter title cards, each chapter's goal, and the short captions
 * that play during each stop's scene. Same rules as stories.ts: third person only,
 * no invented dialogue or quotes, every block cites verified facts, no em dashes.
 *
 * The full story card text stays in stories.ts and is shown under "Read more".
 */
import type { AreaId, ParisEra } from './stories';

export interface Chapter {
  number: number;
  area: AreaId;
  era?: ParisEra;
  /** Title card, shown when the chapter begins. */
  title: string;
  place: string;
  /** One line telling the player why they are riding in this chapter. */
  goal: string;
  factIds: string[];
}

export interface SceneCaptions {
  /** The story id from stories.ts this scene belongs to. */
  storyId: string;
  /** Two or three short lines, shown one after another like film subtitles. */
  captions: string[];
  factIds: string[];
}

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    area: 'marseille-1882',
    title: 'First steps',
    place: 'Marseille, June 1882',
    goal: 'Make your way from the harbor to the train for Spain.',
    factIds: ['F03', 'F23'],
  },
  {
    number: 2,
    area: 'paris',
    era: '1883',
    title: 'A summer in Paris',
    place: 'Paris, June 1883',
    goal: 'See how the doctors of Paris work, then head back to medical school.',
    factIds: ['F04', 'F05'],
  },
  {
    number: 3,
    area: 'paris',
    era: '1885',
    title: 'The eye doctor',
    place: 'Paris, 1885 to 1886',
    goal: "Learn eye surgery from one of the best, so you can treat your mother's eyes.",
    factIds: ['F06'],
  },
  {
    number: 4,
    area: 'paris',
    era: '1889',
    title: "The World's Fair",
    place: 'Paris, 1889',
    goal: 'Gather your fellow Filipinos, and give your people back their history.',
    factIds: ['F11', 'F14'],
  },
  {
    number: 5,
    area: 'biarritz-1891',
    title: 'The last page',
    place: 'Biarritz, 1891',
    goal: 'Finish the novel.',
    factIds: ['F19'],
  },
  {
    number: 6,
    area: 'marseille-1891',
    title: 'Farewell to Europe',
    place: 'Marseille, October 1891',
    goal: 'Board the ship that will carry you back toward Asia.',
    factIds: ['F20'],
  },
];

export const SCENES: SceneCaptions[] = [
  {
    storyId: 'marseille-landing',
    captions: [
      'June 12, 1882. The steamer Djemnah reaches Marseille at night.',
      'On board is a 20-year-old student from the Philippines, bound for Spain.',
      'It is his first step onto French soil.',
    ],
    factIds: ['F03', 'F22', 'F23'],
  },
  {
    storyId: 'marseille-chateau-dif',
    captions: [
      "Across the bay stands the Chateau d'If.",
      'It is the island prison from The Count of Monte Cristo.',
      'In 1882 it is not yet open to visitors.',
    ],
    factIds: ['F24'],
  },
  {
    storyId: 'marseille-station',
    captions: [
      'A train west, to the Spanish border.',
      'Barcelona on June 16, then medical school in Madrid.',
    ],
    factIds: ['F03', 'F26'],
  },
  {
    storyId: 'paris-1883-hotel',
    captions: [
      'Sunday, June 17, 1883.',
      'A summer break from medical school, and his first look at Paris.',
      'He stays at the Hotel de Paris, 37 Rue de Maubeuge.',
    ],
    factIds: ['F04'],
  },
  {
    storyId: 'paris-1883-hospital',
    captions: [
      'Still a student, he spends part of his holiday watching how doctors treat patients.',
      'First Laennec Hospital, then Lariboisiere.',
      'Paris is expensive: transport, tickets and tips add up.',
    ],
    factIds: ['F05'],
  },
  {
    storyId: 'paris-1883-station',
    captions: ['Back to Madrid, to finish his degree.', 'When he returns, he will be a doctor.'],
    factIds: ['F04', 'F06'],
  },
  {
    storyId: 'paris-1885-clinic',
    captions: [
      'November 1885. Rizal is now a doctor.',
      "He has come to learn eye surgery, hoping to treat his mother's eyes.",
      'He works as an assistant to Dr. Louis de Wecker, one of the leading eye surgeons in France.',
    ],
    factIds: ['F06'],
  },
  {
    storyId: 'paris-1885-studio',
    captions: [
      'In the studio of his friend Juan Luna, a large painting is taking shape.',
      'It shows the blood compact of 1565.',
      'Rizal poses as Datu Sikatuna. Trinidad Pardo de Tavera poses as Legazpi.',
    ],
    factIds: ['F07'],
  },
  {
    storyId: 'paris-1885-station',
    captions: [
      'February 1886. On to Heidelberg, to keep training.',
      'Behind him, Paris is about to build something new.',
    ],
    factIds: ['F08', 'F09'],
  },
  {
    storyId: 'paris-1889-tower',
    captions: [
      'March 1889. Rizal is back in Paris, from London.',
      'On March 31, Gustave Eiffel raises a French flag at the top of his finished tower.',
      "It is painted Venetian red, and it will be the centerpiece of the World's Fair.",
    ],
    factIds: ['F10', 'F09', 'F30', 'F01'],
  },
  {
    storyId: 'paris-1889-indios-bravos',
    captions: [
      'Rizal gathers young Filipinos in Paris into the Kidlat Club.',
      "At Buffalo Bill's Wild West show, they see performers admired by huge crowds.",
      'They take a new name with pride: the Indios Bravos.',
    ],
    factIds: ['F11'],
  },
  {
    storyId: 'paris-1889-godfather',
    captions: [
      'Juan Luna and Paz Pardo de Tavera welcome a daughter, Maria de la Paz.',
      'Rizal becomes her godfather.',
    ],
    factIds: ['F12'],
  },
  {
    storyId: 'paris-1889-morga',
    captions: [
      'Late 1889. His edition of a 1609 history of the Philippines comes off the press.',
      'His notes argue that Filipinos had their own civilization before Spain arrived.',
      'He dedicates it to the Filipinos.',
    ],
    factIds: ['F14'],
  },
  {
    storyId: 'paris-1889-station',
    captions: [
      'January 28, 1890. Paris is costly and full of distractions.',
      'He leaves for Brussels, to write.',
    ],
    factIds: ['F18'],
  },
  {
    storyId: 'biarritz-villa',
    captions: [
      'February 1891. Rizal is a guest of the Boustead family at Villa Eliada.',
      'A romance with Nellie Boustead begins, and ends in friendship.',
    ],
    factIds: ['F19'],
  },
  {
    storyId: 'biarritz-manuscript',
    captions: [
      'March 29, 1891.',
      'The manuscript of El Filibusterismo is finished.',
      'It will be printed in Ghent that September.',
    ],
    factIds: ['F19', 'F20'],
  },
  {
    storyId: 'biarritz-station',
    captions: ['October 1891. Last goodbyes to his friends in Paris.', 'Then south, to Marseille.'],
    factIds: ['F20'],
  },
  {
    storyId: 'marseille-1891-melbourne',
    captions: [
      'October 18, 1891. The steamer Melbourne, bound for Hong Kong.',
      'His years in Europe began in this harbor. They end here too.',
    ],
    factIds: ['F20', 'F03'],
  },
  {
    storyId: 'marseille-1891-lessons',
    captions: [
      'Nine years after he first landed here, Rizal leaves France for good.',
      'He came to study medicine, and he left with the tools to work for his country.',
    ],
    factIds: ['F03', 'F20', 'F06', 'F14', 'F19'],
  },
];

export function chapterFor(area: AreaId, era?: ParisEra): Chapter | undefined {
  return CHAPTERS.find((c) => c.area === area && (c.era === undefined || c.era === era));
}

export function scenesFor(storyId: string): SceneCaptions | undefined {
  return SCENES.find((s) => s.storyId === storyId);
}
