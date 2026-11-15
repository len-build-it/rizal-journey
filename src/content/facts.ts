/**
 * The fact sheet as data. Story copy may only cite facts marked 'ok'.
 * To add a fact: find a source, add it to SOURCES, then add the fact here.
 * IDs follow SPEC.md section 4.3; new ones continue from F27.
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
    id: 'F01',
    text: 'The 1889 Exposition Universelle in Paris opened on May 6, 1889 and marked the centenary of the French Revolution.',
    sources: ['S1', 'S6'],
    confidence: 'ok',
  },
  {
    id: 'F03',
    text: 'On the night of June 12, 1882, his steamer docked at Marseille. He stayed about two and a half days, then took the train toward Spain, reaching Barcelona on June 16, 1882.',
    sources: ['S1'],
    confidence: 'ok',
  },
  {
    id: 'F04',
    text: 'In June 1883, on summer break from Madrid, he entered France at Hendaye and reached Paris on Sunday, June 17, staying at the Hotel de Paris, 37 Rue de Maubeuge, where a plaque marks his stay.',
    sources: ['S1', 'S2', 'S3', 'S4'],
    confidence: 'ok',
  },
  {
    id: 'F05',
    text: 'In 1883 he observed patient care at Laennec Hospital, visited Lariboisiere Hospital, toured Le Bon Marche, and complained that sightseeing was costly because of transport, tickets and tips.',
    sources: ['S2', 'S3', 'S1'],
    confidence: 'ok',
  },
  {
    id: 'F06',
    text: "He specialized in ophthalmology to treat his mother's eyes, working as an assistant to Dr. Louis de Wecker from November 1885 to February 1886. De Wecker's clinic was at 55 Rue du Cherche-Midi.",
    sources: ['S1', 'S4'],
    confidence: 'ok',
  },
  {
    id: 'F07',
    text: 'Juan Luna completed The Blood Compact in 1886, a year after opening his Paris studio. Rizal posed as Sikatuna and Trinidad Pardo de Tavera as Legazpi. It depicts the 1565 pact and hangs in Malacanan Palace.',
    sources: ['S22', 'S23'],
    confidence: 'ok',
  },
  {
    id: 'F08',
    text: 'He left Paris for Germany and arrived in Heidelberg on February 3, 1886.',
    sources: ['S1'],
    confidence: 'ok',
  },
  {
    id: 'F09',
    text: 'Eiffel Tower: foundations began January 28, 1887; iron assembly began July 1, 1887; first floor spring 1888; second floor August 14, 1888; completed and inaugurated March 31, 1889; opened to the public May 15, 1889. In 1889 it was painted Venetian red. About 300 m tall.',
    sources: ['S5', 'S6', 'S7', 'S17'],
    confidence: 'ok',
  },
  {
    id: 'F10',
    text: 'Rizal left London for Paris in March 1889.',
    sources: ['S1', 'S13'],
    confidence: 'ok',
  },
  {
    id: 'F11',
    text: "In Paris he formed the short-lived Kidlat Club (kidlat means lightning). After seeing Buffalo Bill's Wild West show, where Native American performers were admired by large crowds, it became the Indios Bravos, whose members pledged to excel intellectually and physically and to make Indio a name of pride.",
    sources: ['S1', 'S12', 'S13', 'S24'],
    confidence: 'ok',
  },
  {
    id: 'F12',
    text: 'In 1889 Juan Luna and Paz Pardo de Tavera had a daughter, Maria de la Paz, and Rizal was her godfather.',
    sources: ['S1', 'S14'],
    confidence: 'ok',
  },
  {
    id: 'F14',
    text: "He studied Morga's Sucesos de las Islas Filipinas (Mexico, 1609) in London and completed his annotated edition in Paris. Garnier Hermanos printed it with a prologue by Ferdinand Blumentritt, dedicated to the Filipinos. The title page reads 1890; copies came off the press in late 1889.",
    sources: ['S8', 'S9', 'S10', 'S1'],
    confidence: 'ok',
  },
  {
    id: 'F18',
    text: 'On January 28, 1890, he left Paris for Brussels because living there was costly and its social life got in the way of his writing.',
    sources: ['S1'],
    confidence: 'ok',
  },
  {
    id: 'F19',
    text: 'In February 1891 he was a guest of the Boustead family at Villa Eliada in Biarritz. He had met Nellie Boustead in Paris in 1889. The romance did not end in marriage. On March 29, 1891, the eve of leaving Biarritz, he finished the manuscript of El Filibusterismo.',
    sources: ['S1', 'S13', 'S25', 'S26'],
    confidence: 'ok',
  },
  {
    id: 'F20',
    text: 'El Filibusterismo came off the press in Ghent on September 18, 1891. On October 3, 1891 he went to Paris to say goodbye to the Lunas, the Pardo de Taveras and the Venturas, took the train to Marseille, and on October 18, 1891 boarded the steamer Melbourne for Hong Kong, arriving November 20, 1891.',
    sources: ['S1'],
    confidence: 'ok',
  },
  {
    id: 'F21',
    text: 'Place Jose Rizal in Paris (9th arrondissement) faces 55 Rue de Maubeuge.',
    sources: ['S4'],
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
  {
    id: 'F26',
    text: 'After arriving in Spain in 1882, Rizal studied medicine at the Universidad Central de Madrid.',
    sources: ['S1', 'S20'],
    confidence: 'ok',
  },
  {
    id: 'F27',
    text: 'Rizal formed a secret society known by the letters R.D.L.M., mentioned in his 1889 letters; the letters are believed to stand for the redemption of the Malays.',
    sources: ['S1'],
    confidence: 'ok',
  },
  {
    id: 'F30',
    text: 'On March 31, 1889, the day the tower was completed, Gustave Eiffel raised a French flag at its top with some of his collaborators and officials from the government and the City of Paris.',
    sources: ['S5', 'S27'],
    confidence: 'ok',
  },
  {
    id: 'F28',
    text: 'Student notes give March 19, 1889 as the day he both arrived in Paris and founded the Kidlat Club. Not confirmed; say "soon after arriving".',
    sources: ['S1'],
    confidence: 'verify',
  },
  {
    id: 'F29',
    text: 'Textbooks say Rizal posed as an Egyptian priest in Luna\'s "The Death of Cleopatra", but that painting is commonly dated 1881, before Rizal reached Europe. Do not use.',
    sources: ['S1'],
    confidence: 'conflict',
  },
];

export const SOURCES: Record<string, string> = {
  S1: 'Zaide, G. F., & Zaide, S. M. Jose Rizal: Life, works and writings of a genius, writer, scientist and national hero. All-Nations Publishing.',
  S2: 'Philippine Daily Inquirer. Enchanted Rizal falls for Paris at first sight. https://newsinfo.inquirer.net/?p=12116',
  S3: 'Philippine Daily Inquirer. Rizal in Paris. https://opinion.inquirer.net/90428/rizal-in-paris',
  S4: "Philippine Embassy in Paris. (2013). 75 Filipinos trace Rizal's footsteps. https://parispe.dfa.gov.ph/2013/75-filipinos-trace-rizal-s-footseps",
  S5: "Societe d'Exploitation de la Tour Eiffel. 133 years and 1,083 feet. https://www.toureiffel.paris/en/news/history-and-culture/133-years-and-1083-feet",
  S6: 'Wikipedia. Eiffel Tower; Exposition Universelle (1889). https://en.wikipedia.org/wiki/Eiffel_Tower',
  S7: 'Structurae. Eiffel Tower chronology. https://structurae.net/en/structures/20000021',
  S8: 'Wikipedia. Sucesos de las Islas Filipinas. https://en.wikipedia.org/wiki/Sucesos_de_las_Islas_Filipinas',
  S9: 'Morga, A. de. (1890). Sucesos de las islas Filipinas (J. Rizal, Annot.). Garnier Hermanos. University of Michigan scan: https://quod.lib.umich.edu/p/philamer/AHZ9387.0001.001',
  S10: 'Manila Bulletin. (2020, June 19). Rizal survived the 1889-1890 flu epidemic in Europe. https://mb.com.ph/2020/06/19/rizal-survived-the-1889-1890-flu-epidemic-in-europe',
  S12: 'Cristobal, G. (2025). Indios Bravos, 1888-1889. https://geronimocristobal.com/2025/11/15/indios-bravos-1888-1889',
  S13: 'Severino, H. GMA News. Looking for Rizal in Europe, finding a little bad boy. https://gmanetwork.com/news/specials/content/32/who-called-jose-rizal-little-bad-boy',
  S14: 'Wikipedia. Paz Pardo de Tavera. https://en.wikipedia.org/wiki/Paz_Pardo_de_Tavera',
  S15: "Wikipedia. Chateau d'If. https://en.wikipedia.org/wiki/Ch%C3%A2teau_d%27If",
  S17: "Paris Property Group. The Eiffel Tower's 130th birthday. https://parispropertygroup.com/news/the-eiffel-towers-130th-birthday-a-look-back-at-her-creation/",
  S20: 'Wikipedia. Jose Rizal. https://en.wikipedia.org/wiki/Jose_Rizal',
  S21: 'Wikipedia. SS Djemnah. https://en.wikipedia.org/wiki/SS_Djemnah',
  S22: 'Wikipedia. The Blood Compact. https://en.wikipedia.org/wiki/The_Blood_Compact',
  S23: 'Cultural Center of the Philippines. CCP Encyclopedia of Philippine Art: El Pacto de Sangre. https://epa.culturalcenter.gov.ph/3/82/2253',
  S24: 'Popular Science. In 1889, Paris became obsessed with the Wild West. https://www.popsci.com/science/wild-west-paris-history/',
  S25: 'Wikipedia. El filibusterismo. https://en.wikipedia.org/wiki/El_filibusterismo',
  S27: "Societe d'Exploitation de la Tour Eiffel. 1889-2019: 130 years of amazement. https://www.toureiffel.paris/en/news/130-years/1889-2019-130-years-amazement",
  S26: 'Filipinas Heritage Library. The Travels of Rizal. https://www.filipinaslibrary.org.ph/?p=1347',
};

export function factById(id: string): Fact | undefined {
  return FACTS.find((f) => f.id === id);
}
