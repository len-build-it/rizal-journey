import type { PersonOptions } from '../story/figures';

const WAITERS_BY_STORY: Record<string, readonly PersonOptions[]> = {
  'marseille-landing': [
    { coat: 'work', hat: 'bowler' },
    { coat: 'work', hat: 'none' },
  ],
  'marseille-chateau-dif': [
    { coat: 'frock', hat: 'top' },
    { coat: 'work', hat: 'flatcap' },
  ],
  'marseille-station': [{ coat: 'work', hat: 'flatcap' }],
  'paris-1883-hotel': [{ coat: 'frock', hat: 'top' }],
  'paris-1883-hospital': [
    { coat: 'frock', hat: 'bowler' },
    { coat: 'frock', hat: 'top' },
  ],
  'paris-1883-station': [{ coat: 'work', hat: 'flatcap' }],
  'paris-1885-clinic': [
    { coat: 'smock', hat: 'none' },
    { coat: 'frock', hat: 'bowler', eyeBandage: true },
  ],
  'paris-1885-studio': [
    { coat: 'smock', hat: 'none' },
    { coat: 'frock', hat: 'none' },
  ],
  'paris-1885-station': [{ coat: 'work', hat: 'flatcap' }],
  'paris-1889-tower': [
    { coat: 'frock', hat: 'top' },
    { coat: 'dress', hat: 'small', skirt: true },
  ],
  'paris-1889-indios-bravos': [
    { coat: 'frock', hat: 'top' },
    { coat: 'frock', hat: 'bowler' },
  ],
  'paris-1889-godfather': [
    { coat: 'dress', hat: 'small', skirt: true, baby: true },
    { coat: 'frock', hat: 'top' },
  ],
  'paris-1889-morga': [
    { coat: 'work', hat: 'none' },
    { coat: 'frock', hat: 'bowler' },
  ],
  'paris-1889-station': [{ coat: 'work', hat: 'flatcap' }],
  'biarritz-villa': [
    { coat: 'dress', hat: 'small', skirt: true },
    { coat: 'dress', hat: 'none', skirt: true },
  ],
  'biarritz-manuscript': [{ coat: 'frock', hat: 'none' }],
  'biarritz-station': [{ coat: 'work', hat: 'flatcap' }],
  'marseille-1891-melbourne': [
    { coat: 'work', hat: 'bowler' },
    { coat: 'work', hat: 'none' },
  ],
  'marseille-1891-lessons': [
    { coat: 'frock', hat: 'top' },
    { coat: 'frock', hat: 'bowler' },
  ],
};

export function waitersForStory(storyId: string): readonly PersonOptions[] {
  return WAITERS_BY_STORY[storyId] ?? [{ coat: 'frock', hat: 'bowler' }];
}
