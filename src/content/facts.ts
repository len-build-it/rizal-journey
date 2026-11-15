/**
 * The fact sheet as data. Copy may only cite facts marked 'ok'.
 * Full source list: SPEC.md section 4.7. Add new facts here with a source before using them.
 */
export type Confidence = 'ok' | 'verify' | 'conflict';

export interface Fact {
  id: string;
  text: string;
  sources: string[];
  confidence: Confidence;
}

export const FACTS: Fact[] = [
  {
    id: 'F03',
    text: 'On the night of June 12, 1882, his steamer docked at Marseille. He stayed about two and a half days, then took the train toward Spain, reaching Barcelona on June 16, 1882.',
    sources: ['S1'],
    confidence: 'ok',
  },
  {
    id: 'F04',
    text: 'In June 1883, on summer break from Madrid, he traveled to Paris, arriving Sunday, June 17.',
    sources: ['S1', 'S2', 'S3', 'S4'],
    confidence: 'ok',
  },
  {
    id: 'F26',
    text: 'After arriving in Spain in 1882, Rizal studied medicine at the Universidad Central de Madrid.',
    sources: ['S1', 'S20'],
    confidence: 'ok',
  },
  {
    id: 'F22',
    text: 'Jose Rizal was born on June 19, 1861, so he was 20 years old in June 1882.',
    sources: ['S20'],
    confidence: 'ok',
  },
  {
    id: 'F23',
    text: 'He sailed to Europe in 1882 aboard the Djemnah, a French passenger steamer of the Messageries Maritimes.',
    sources: ['S21', 'S1'],
    confidence: 'ok',
  },
  {
    id: 'F24',
    text: "The Chateau d'If is the island fortress off Marseille used as a setting in Dumas' The Count of Monte Cristo. It was opened to the public on September 23, 1890.",
    sources: ['S15'],
    confidence: 'ok',
  },
  {
    id: 'F25',
    text: "Student notes say Rizal visited the Chateau d'If in 1882; this conflicts with its 1890 opening.",
    sources: ['S1'],
    confidence: 'conflict',
  },
];

export const SOURCES: Record<string, string> = {
  S1: 'Zaide, G. F., & Zaide, S. M. Jose Rizal: Life, works and writings of a genius, writer, scientist and national hero. All-Nations Publishing.',
  S2: 'Philippine Daily Inquirer. Enchanted Rizal falls for Paris at first sight. https://newsinfo.inquirer.net/?p=12116',
  S3: 'Philippine Daily Inquirer. Rizal in Paris. https://opinion.inquirer.net/90428/rizal-in-paris',
  S4: "Philippine Embassy in Paris. (2013). 75 Filipinos trace Rizal's footsteps. https://parispe.dfa.gov.ph/2013/75-filipinos-trace-rizal-s-footseps",
  S15: "Wikipedia. Chateau d'If. https://en.wikipedia.org/wiki/Ch%C3%A2teau_d%27If",
  S20: 'Wikipedia. Jose Rizal. https://en.wikipedia.org/wiki/Jose_Rizal',
  S21: 'Wikipedia. SS Djemnah. https://en.wikipedia.org/wiki/SS_Djemnah',
};

export function factById(id: string): Fact | undefined {
  return FACTS.find((f) => f.id === id);
}
