/**
 * Copy for the travel interludes shown between areas (train and steamer trips).
 * Same rules as stories.ts: own words, cite verified facts, no em dashes.
 * Keyed by the story whose action button starts the trip.
 */
export interface Journey {
  /** id of the story whose action starts this trip */
  from: string;
  mode: 'train' | 'tower';
  /** Short lines shown one after another during the transition. */
  lines: string[];
  factIds: string[];
}

export const JOURNEYS: Journey[] = [
  {
    from: 'marseille-station',
    mode: 'train',
    lines: [
      'June 1882: by train to Barcelona, then on to Madrid.',
      'A year of medical school.',
      'June 1883: across the border at Hendaye, north to Paris.',
    ],
    factIds: ['F03', 'F04', 'F26'],
  },
  {
    from: 'paris-1883-station',
    mode: 'train',
    lines: [
      'Back to Madrid to finish his studies.',
      'November 1885: Paris again, now as a doctor.',
    ],
    factIds: ['F04', 'F06'],
  },
  {
    from: 'paris-1885-station',
    mode: 'tower',
    lines: [
      'January 1887: work begins on the Champ de Mars.',
      'July 1887: the iron legs start to rise.',
      'August 1888: the second platform is done.',
      'March 31, 1889: the tower is finished.',
    ],
    factIds: ['F09'],
  },
  {
    from: 'paris-1889-station',
    mode: 'train',
    lines: [
      'January 1890: to Brussels, to write.',
      'February 1891: south to Biarritz, on the Atlantic coast.',
    ],
    factIds: ['F18', 'F19'],
  },
  {
    from: 'biarritz-station',
    mode: 'train',
    lines: [
      'September 1891: El Filibusterismo is printed in Ghent.',
      'October 3: goodbyes in Paris.',
      'Then the train south to Marseille.',
    ],
    factIds: ['F20'],
  },
];

export function journeyFrom(storyId: string): Journey | undefined {
  return JOURNEYS.find((j) => j.from === storyId);
}
