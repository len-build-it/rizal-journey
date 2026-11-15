/**
 * Story content for every stop in the brochure. Every block lists the fact IDs from
 * src/content/facts.ts it relies on; tests/content.test.ts fails if any cited fact is
 * missing or not verified.
 *
 * Copy rules: written in our own words, plain and specific, no em dashes, and nothing
 * that is not backed by a fact marked 'ok'.
 */
export type AreaId = 'marseille-1882' | 'paris' | 'biarritz-1891' | 'marseille-1891';

/** Paris is one map shown in three different years. */
export type ParisEra = '1883' | '1885' | '1889';

export type Destination =
  | { area: 'marseille-1882' | 'biarritz-1891' | 'marseille-1891' }
  | { area: 'paris'; era: ParisEra }
  | { area: 'finale' };

export interface Story {
  id: string;
  area: AreaId;
  /** Only for Paris: which year of the city this stop belongs to. */
  era?: ParisEra;
  /** Z-fold brochure panel this stop fills in (1 to 6). */
  panel: 1 | 2 | 3 | 4 | 5 | 6;
  date: string;
  title: string;
  paragraphs: string[];
  /** A short side note, shown in the margin of the card. */
  note?: string;
  factIds: string[];
  /** When present, the card shows a button that travels on. */
  action?: { label: string; to: Destination };
}

export const STORIES: Story[] = [
  // Marseille, 1882. Panel 2.
  {
    id: 'marseille-landing',
    area: 'marseille-1882',
    panel: 2,
    date: 'June 12, 1882',
    title: 'First steps on French soil',
    paragraphs: [
      'On the night of June 12, 1882, the French steamer Djemnah tied up in the harbor of Marseille.',
      'On board was a 20-year-old Filipino named Jose Rizal, on his way to study medicine in Spain.',
      'Marseille was his first stop in France. He would spend about two and a half days here.',
    ],
    note: 'Rizal crossed France by steamer and train. In this brochure, the horse is just our way of getting around each place.',
    factIds: ['F03', 'F22', 'F23'],
  },
  {
    id: 'marseille-chateau-dif',
    area: 'marseille-1882',
    panel: 2,
    date: 'June 1882',
    title: 'The fortress in the bay',
    paragraphs: [
      "Out in the bay sits the Chateau d'If, a small island fortress.",
      "Readers knew it from Alexandre Dumas' novel The Count of Monte Cristo, where the hero, Edmond Dantes, is locked away for years before his famous escape.",
      'From the harbor, Rizal could see the prison from the story for himself.',
    ],
    note: 'The fortress only opened to visitors in 1890, so in 1882 most people saw it from the shore or from a boat.',
    factIds: ['F03', 'F24'],
  },
  {
    id: 'marseille-station',
    area: 'marseille-1882',
    panel: 2,
    date: 'June 1882',
    title: 'The train to Spain',
    paragraphs: [
      'From Marseille, Rizal boarded a train heading west for the Spanish border.',
      'He reached Barcelona on June 16, 1882, and went on to study medicine in Madrid.',
      'He would come back to France the next summer, this time to see Paris.',
    ],
    factIds: ['F03', 'F04', 'F26'],
    action: { label: 'Ride the train to Paris, 1883', to: { area: 'paris', era: '1883' } },
  },

  // Paris, 1883. Panel 2.
  {
    id: 'paris-1883-hotel',
    area: 'paris',
    era: '1883',
    panel: 2,
    date: 'June 17, 1883',
    title: 'A summer in Paris',
    paragraphs: [
      'During his summer break from medical school in Madrid, Rizal crossed into France at Hendaye and took the train north.',
      'He reached Paris on Sunday, June 17, 1883, and checked into the Hotel de Paris at 37 Rue de Maubeuge.',
    ],
    note: 'A plaque on the building still marks his stay, and a small square nearby is named Place Jose Rizal.',
    factIds: ['F04', 'F21'],
  },
  {
    id: 'paris-1883-hospital',
    area: 'paris',
    era: '1883',
    panel: 2,
    date: 'June 1883',
    title: 'Watching the doctors',
    paragraphs: [
      'Rizal was still a medical student, so he spent part of his holiday in hospitals.',
      'He watched how patients were treated at Laennec Hospital and visited Lariboisiere Hospital.',
      'He also toured Le Bon Marche, one of the first department stores in the world, and complained that sightseeing was expensive because of transport, tickets and tips.',
    ],
    factIds: ['F05'],
  },
  {
    id: 'paris-1883-station',
    area: 'paris',
    era: '1883',
    panel: 2,
    date: 'Summer 1883',
    title: 'Back to Madrid',
    paragraphs: [
      'At the end of the summer he returned to Madrid to finish his medical studies.',
      'When he came back to Paris two years later, he would be a doctor.',
    ],
    factIds: ['F04', 'F06'],
    action: { label: 'Jump ahead to 1885', to: { area: 'paris', era: '1885' } },
  },

  // Paris, 1885 to 1886. Panel 3.
  {
    id: 'paris-1885-clinic',
    area: 'paris',
    era: '1885',
    panel: 3,
    date: 'November 1885 to February 1886',
    title: 'The eye doctor',
    paragraphs: [
      "With his medical degree from Madrid, Rizal came back to Paris to specialize in ophthalmology. He wanted to be able to treat his mother's failing eyesight.",
      'From November 1885 to February 1886 he worked as an assistant to Dr. Louis de Wecker, one of the leading eye surgeons in France, at his clinic on Rue du Cherche-Midi.',
    ],
    note: 'Many Filipino textbooks spell the doctor\'s name "de Weckert." His actual name, also used by the Philippine Embassy in Paris, is Louis de Wecker.',
    factIds: ['F06'],
  },
  {
    id: 'paris-1885-studio',
    area: 'paris',
    era: '1885',
    panel: 3,
    date: '1885 to 1886',
    title: "In Juan Luna's studio",
    paragraphs: [
      'After clinic hours, Rizal often visited the studio of his friend, the Filipino painter Juan Luna.',
      'Luna was working on The Blood Compact, a painting of the 1565 pact between Datu Sikatuna and Miguel Lopez de Legazpi. Rizal posed as Sikatuna, and Trinidad Pardo de Tavera posed as Legazpi.',
    ],
    note: 'Luna finished the painting in 1886. Today it hangs in Malacanan Palace.',
    factIds: ['F07'],
  },
  {
    id: 'paris-1885-station',
    area: 'paris',
    era: '1885',
    panel: 3,
    date: 'February 1886',
    title: 'On to Germany',
    paragraphs: [
      'To keep training as an eye specialist, Rizal left Paris for Germany. He arrived in Heidelberg on February 3, 1886.',
      'While he was away, Paris began building something that would change its skyline.',
    ],
    factIds: ['F08', 'F09'],
    action: { label: 'Watch the years pass to 1889', to: { area: 'paris', era: '1889' } },
  },

  // Paris, 1889 to 1890. Panels 4 and 5.
  {
    id: 'paris-1889-tower',
    area: 'paris',
    era: '1889',
    panel: 4,
    date: 'March 1889',
    title: "Back for the World's Fair",
    paragraphs: [
      'Rizal came back to Paris from London in March 1889.',
      'Days later, on March 31, the Eiffel Tower was finished. In 1889 it was painted a deep Venetian red.',
      "The tower was the centerpiece of the 1889 World's Fair, which opened on May 6 and marked one hundred years since the French Revolution.",
    ],
    factIds: ['F10', 'F09', 'F01'],
  },
  {
    id: 'paris-1889-indios-bravos',
    area: 'paris',
    era: '1889',
    panel: 4,
    date: '1889',
    title: 'From Kidlat to Indios Bravos',
    paragraphs: [
      'Soon after arriving, Rizal gathered young Filipinos in Paris into the Kidlat Club. Kidlat means lightning, and like lightning, the club was meant to be short-lived.',
      'Then the group watched Buffalo Bill\'s Wild West show, where Native American performers were admired by huge crowds. Rizal saw a lesson in it: if they could be admired, Filipinos could take back the word "Indio" too.',
      'The club became the Indios Bravos, the Brave Indians, whose members pledged to excel in both mind and body.',
    ],
    note: 'Rizal also formed a secret society known only by the letters R.D.L.M. Historians believe the letters stood for the redemption of the Malay peoples.',
    factIds: ['F11', 'F27'],
  },
  {
    id: 'paris-1889-godfather',
    area: 'paris',
    era: '1889',
    panel: 4,
    date: '1889',
    title: 'Godfather in Paris',
    paragraphs: [
      'Juan Luna and his wife, Paz Pardo de Tavera, had a daughter in 1889. They named her Maria de la Paz, and Rizal became her godfather.',
      'Paris in these years was home to a close circle of Filipino friends: the Lunas, the Pardo de Taveras and the Venturas.',
    ],
    factIds: ['F12', 'F20'],
  },
  {
    id: 'paris-1889-morga',
    area: 'paris',
    era: '1889',
    panel: 5,
    date: 'Late 1889',
    title: 'A history of his own people',
    paragraphs: [
      'In London, Rizal had studied a rare 1609 history of the Philippines by Antonio de Morga. He added his own notes to show that Filipinos had their own civilization before Spain arrived.',
      'He finished the work in Paris, where Garnier Hermanos printed it with a prologue by his friend, the Austrian scholar Ferdinand Blumentritt. Rizal dedicated it to the Filipinos.',
    ],
    note: 'The title page says 1890, but the first copies came off the press at the end of 1889.',
    factIds: ['F14'],
  },
  {
    id: 'paris-1889-station',
    area: 'paris',
    era: '1889',
    panel: 5,
    date: 'January 28, 1890',
    title: 'Leaving Paris to write',
    paragraphs: [
      'Paris was expensive, and its busy social life kept pulling him away from his writing.',
      'On January 28, 1890, Rizal left for Brussels to work on his second novel, El Filibusterismo.',
    ],
    factIds: ['F18'],
    action: { label: 'Travel to Biarritz, 1891', to: { area: 'biarritz-1891' } },
  },

  // Biarritz, 1891. Panel 5.
  {
    id: 'biarritz-villa',
    area: 'biarritz-1891',
    panel: 5,
    date: 'February 1891',
    title: 'Guest of the Bousteads',
    paragraphs: [
      'In February 1891, Rizal came to Biarritz on the Atlantic coast as a guest of the Boustead family at their winter home, Villa Eliada.',
      'He had met Nellie Boustead in Paris in 1889. Here their friendship became a romance, but it did not lead to marriage, and they parted as friends.',
    ],
    factIds: ['F19'],
  },
  {
    id: 'biarritz-manuscript',
    area: 'biarritz-1891',
    panel: 5,
    date: 'March 29, 1891',
    title: 'The last page',
    paragraphs: [
      'On March 29, 1891, the day before he left Biarritz, Rizal finished the manuscript of El Filibusterismo.',
      'It was printed in Ghent, Belgium, and came off the press on September 18, 1891.',
    ],
    factIds: ['F19', 'F20'],
  },
  {
    id: 'biarritz-station',
    area: 'biarritz-1891',
    panel: 6,
    date: 'October 1891',
    title: 'Goodbye, Paris',
    paragraphs: [
      'After the novel was printed, Rizal decided to leave Europe.',
      'On October 3, 1891, he passed through Paris one last time to say goodbye to the Lunas, the Pardo de Taveras and the Venturas, then took the train south to Marseille.',
    ],
    factIds: ['F20'],
    action: { label: 'Take the train to Marseille', to: { area: 'marseille-1891' } },
  },

  // Marseille, 1891. Panel 6.
  {
    id: 'marseille-1891-melbourne',
    area: 'marseille-1891',
    panel: 6,
    date: 'October 18, 1891',
    title: 'Last port in Europe',
    paragraphs: [
      'On October 18, 1891, Rizal boarded the steamer Melbourne in Marseille, bound for Hong Kong. He arrived there on November 20.',
      'His years in Europe had begun in this harbor in 1882, and they ended here too.',
    ],
    factIds: ['F20', 'F03'],
  },
  {
    id: 'marseille-1891-lessons',
    area: 'marseille-1891',
    panel: 6,
    date: '1882 to 1891',
    title: 'What France gave him',
    paragraphs: [
      'Learn from the best, then bring it home. He trained under a leading eye surgeon so he could care for his mother.',
      'Pride is a choice. The Indios Bravos turned a word used to look down on Filipinos into a name to be proud of.',
      "History is a tool. By reprinting Morga's history with his notes, he gave Filipinos back their past.",
      'Protect the work. He left glittering Paris because it kept him from writing.',
      'Finish what you start. After a hard goodbye in Biarritz, he still finished his novel.',
    ],
    factIds: ['F06', 'F11', 'F14', 'F18', 'F19'],
    action: { label: 'Open your finished brochure', to: { area: 'finale' } },
  },
];

export function storiesFor(area: AreaId, era?: ParisEra): Story[] {
  return STORIES.filter((s) => s.area === area && (era === undefined || s.era === era));
}
