/**
 * Story content for each stop. Every block lists the fact IDs from SPEC.md section 4.3
 * it relies on, so the content test can check that nothing unverified ships.
 */
export type AreaId = 'marseille-1882' | 'paris' | 'biarritz-1891' | 'marseille-1891';

export interface Story {
  id: string;
  area: AreaId;
  /** Z-fold brochure panel this stop fills in (1 to 6). */
  panel: 1 | 2 | 3 | 4 | 5 | 6;
  date: string;
  title: string;
  paragraphs: string[];
  /** A short side note, shown in the margin of the card. */
  note?: string;
  factIds: string[];
  /** Label for the action button when the stop leads somewhere else. */
  action?: { label: string; to: AreaId | 'coming-soon' };
}

export const STORIES: Story[] = [
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
    action: { label: 'Board the train', to: 'coming-soon' },
  },
];

export function storiesFor(area: AreaId): Story[] {
  return STORIES.filter((s) => s.area === area);
}
