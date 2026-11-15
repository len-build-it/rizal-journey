# Through Rizal's Eyes: France, 1882-1891

> Status: the project changed from a scroll-driven page to an explorable 3D world.
> The fact sheet and sources (section 4) still apply and now live in `src/content/facts.ts`.
> Sections 1, 5, 6, 7, 8 and 10 are replaced by `HANDOFF.md`.

Project specification for an interactive, scroll-driven Z-fold travel brochure website.

Owner: Lenard (Software Engineering, Aklan State University).
Course output: Chapter 9 Activity, "A Journey Through Rizal's Travels".
Chosen country: France.

---

## 0. How to use this spec (read first)

This document is the single source of truth for the project.
It is written to be executed by an AI coding agent.

Rules for the executing agent:

1. Aesthetics and historical accuracy are the two priorities.
   Development effort and time are not constraints.
2. Never state a historical fact on the site that is not in the fact sheet (section 4.3).
   If you want to add a fact, first find a source for it, add it to the fact sheet with its source and confidence level, then use it.
3. Facts marked `VERIFY` or `CONFLICT` must not ship as written.
   Resolve them first (section 4.4), or use the safe wording given there.
4. Write all site copy in your own words.
   The assignment forbids copying paragraphs from websites or books.
   Short quotes from Rizal's own letters are allowed if clearly marked as quotes and cited.
5. Never use the em dash character (U+2014) anywhere: not in copy, code comments, or commit messages.
   Use a plain hyphen, a colon, or a new sentence instead.
6. Do not add yourself as a co-author in commit messages.
7. Before you report any milestone as done, run the full quality gate in section 12 and review screenshots of every chapter on mobile and desktop.

---

## 1. Summary

A single-page website that tells the story of Jose Rizal's time in France as a scroll-driven narrative.
As the reader scrolls, each chapter enters the screen with purposeful transitions.
The site keeps the assignment's six-panel Z-fold structure: six chapters are the six panels, and the site also prints as a real A4 Z-fold brochure.

The signature element is a 3D wrought-iron Eiffel Tower, built in Three.js, that works as the story's clock.
The tower was under construction from January 1887 to March 1889, and Rizal arrived in Paris for the 1889 World's Fair just as it was finished.
So the tower is absent in the early chapters, rises through an interlude as the years pass, and stands complete when Rizal arrives in 1889.

Audience: the course instructor first, classmates second.
Primary job: make the reader feel they are traveling with Rizal, and show how France shaped him as a patriot.

---

## 2. Assignment requirements and how the site meets them

Source: the Chapter 9 Activity instructions.

| Requirement | How the site satisfies it |
| --- | --- |
| Z-fold brochure, six panels | Six chapters, each labeled as a panel by the fold indicator (section 7.3); print stylesheet outputs a true A4 Z-fold (section 10) |
| A4 paper (8.27 x 11.69 in) | Print layout is A4 landscape, three 99 mm panels per side |
| One country only | France only; other countries appear only as departure or arrival points |
| Brief introduction to the country | Chapter 1 |
| Important places Rizal visited | Chapters 2 to 6, plus the route map in chapter 6 |
| Significant experiences and activities | Chapters 2 to 5 |
| Important people he met | People cards in chapters 3, 4, 5 |
| Events or observations that influenced his ideas and writings | Chapters 4 and 5 (Indios Bravos, Morga, El Filibusterismo) |
| Interesting facts or lessons | Margin facts in each chapter; lessons and quiz in chapter 6 |
| Visually appealing, organized, readable, accurate | Sections 5 to 7 and 11 |
| References | Chapter 6 references block, full list in section 4.7 |
| Tell a story, not just pictures and facts | Narrative thesis (section 4.1) drives every chapter |

Rubric weights to keep in mind: Historical Accuracy 30, Completeness 20, Creativity and Design 20, Organization (six-panel Z-fold) 15, Grammar and Clarity 10, References 5.

---

## 3. Non-negotiable quality rules

- Accuracy: every claim traces to a fact ID in section 4.3.
  The build includes a content test that fails if copy references a missing fact ID (section 12).
- Spelling of names: use "Louis de Wecker" (the doctor's actual name, also used by the Philippine Embassy in Paris).
  Many Filipino textbooks spell it "de Weckert"; mention this once in a margin note so the instructor sees it was deliberate.
- Copy voice: plain, warm, specific, active voice, sentence case.
  No filler, no hype.
- Quotes: only real, sourced quotes, marked as quotes, with the letter and date cited.
  Passages in Rizal's imagined voice are not allowed, because they could be mistaken for real quotes.
- No em dashes anywhere.

---

## 4. Story and content

### 4.1 Narrative thesis

France was where Rizal first touched Europe and where he finally left it.
In between, he went from a curious student tourist, to a trainee eye surgeon, to a historian and novelist who used Europe's knowledge to argue for his own people.
Paris did not just impress him.
It gave him tools, and he turned them toward the Philippines.

Every chapter should advance this arc: seeing, learning, belonging, arguing, leaving.

### 4.2 Chapter plan (six chapters = six Z-fold panels)

Each chapter lists its beats, the fact IDs it may use, its visual, and its interaction.
Web copy target: 80 to 160 words of body text per chapter, plus captions and margin facts.
Print copy is a shorter cut of the same text (section 10).

#### Panel 1 - Cover and introduction: "Through Rizal's Eyes"

- Title, subtitle "France, 1882-1891", student name and course.
- One short paragraph introducing France in Rizal's time: the Third Republic, Paris in its Belle Epoque, and the 1889 World's Fair that marked one hundred years since the French Revolution (F01).
- One line on why France matters to Rizal: he visited Paris five times (F02), and France was both his first and last stop in Europe (F03, F20).
- Visual: night over the empty Champ de Mars in 3D, gas lights along the Seine, a faint outline of where the tower will stand.
- Interaction: the page-load sequence (the single orchestrated intro moment, section 7.1).

#### Panel 2 - First steps: Marseille 1882 and Paris 1883

- 1882: his ship docks at Marseille, his first time on French soil; the Chateau d'If from "The Count of Monte Cristo"; train onward to Barcelona (F03, use the safe wording in 4.4).
- 1883: summer break from medical school in Madrid; first stop in France at Hendaye; arrives in Paris on Sunday, June 17; stays at the Hotel de Paris, 37 Rue de Maubeuge, then moves somewhere cheaper (F04).
- What he did: observed doctors at Laennec and Lariboisiere hospitals, visited Le Bon Marche, the first department store, and complained about how expensive everything was (F05).
- Margin fact: a plaque on 37 Rue de Maubeuge marks his 1883 stay, and a square near it is named Place Jose Rizal (F04, F21).
- Visual: daylight version of the city; a hand-drawn style route line from Marseille to Paris on a period-style map of France.
- Interaction: the route line draws itself with scroll.

#### Panel 3 - The eye doctor: Paris 1885-1886

- After finishing his medical degree in Madrid, he returns to Paris to specialize in ophthalmology, because he wants to treat his mother's failing eyesight (F06).
- He works as an assistant to Dr. Louis de Wecker, a leading French eye surgeon, from November 1885 to February 1886, at the clinic on Rue du Cherche-Midi (F06).
- After hours: Juan Luna's studio, where he models as Sikatuna in "The Blood Compact" (F07); sketches "The Monkey and the Turtle" in Paz Pardo de Tavera's album (F07).
- People cards: Louis de Wecker, Juan Luna, Paz Pardo de Tavera.
- He leaves for Heidelberg, Germany, arriving February 3, 1886 (F08).
- Visual: palette shifts to the clinic blue-grey.
  A lens ring frames the chapter.
- Interaction: the focus effect (section 7.4): text and images start blurred and sharpen as they reach the reading position, like a lens being adjusted.

#### Interlude - The tower rises, 1887-1889 (between panels 3 and 4)

Not a panel; a full-screen scroll passage of about two viewport heights.
- A year counter runs from January 1887 to March 1889 as the tower assembles from the ground up, keyed to real construction milestones (F09): foundations begin, iron assembly begins, first platform, second platform, summit.
- One line of copy: Rizal is away (Germany, home to the Philippines, then Japan, the United States and London), while Paris builds the tallest structure on Earth.
- Visual: the camera slowly orbits the rising tower.
  Venetian red iron, work lights.

#### Panel 4 - The World's Fair: Paris 1889

- He arrives from London in March 1889, days before the tower is finished (F10, F09).
- The Exposition Universelle opens on May 6, 1889; he takes in the fair with compatriots (F01, F17).
- He forms the Kidlat Club ("lightning", meant to be short-lived like the fair stay), which becomes the Indios Bravos after the group sees Buffalo Bill's Wild West show: they will reclaim the word "Indio" with pride and excel in mind and body (F11).
- The secret society R.D.L.M. (F11).
- He becomes godfather to Juan Luna's daughter, Maria de la Paz, born June 24, 1889 (F12).
- People cards: Juan Luna, Valentin Ventura, the Pardo de Tavera brothers.
- Visual: the climax.
  The finished tower at night, the fair lit around it.
- Interaction: the "fair lights" moment (section 7.5), the one place where many lights animate at once.

#### Panel 5 - The historian and the novelist: Paris 1889-90 and Biarritz 1891

- In Paris he publishes his annotated edition of Antonio de Morga's 1609 history, "Sucesos de las Islas Filipinas", researched in London's British Museum and printed by Garnier Hermanos, with a prologue by Ferdinand Blumentritt (F14).
  Why it mattered: it argued that Filipinos had their own civilization before Spain arrived.
- He writes for La Solidaridad, including "Filipinas dentro de cien anos" (The Philippines a Century Hence) (F15), and the satire "Por Telefono" (F16).
- January 28, 1890: he leaves for Brussels because Paris is expensive and its social life distracts him from writing (F18).
- February to March 1891: guest of the Boustead family in Biarritz on the French coast; his romance with Nellie Boustead does not lead to marriage; on March 29, 1891, he finishes the manuscript of El Filibusterismo (F19).
- People cards: Ferdinand Blumentritt (by correspondence), Nellie Boustead.
- Visual: the title page of the 1890 Morga edition as an object on a desk, then the Atlantic coast at Biarritz.
- Interaction: the Morga title page can be inspected (zoom on tap or hover), with a translated caption.

#### Panel 6 - Farewell, lessons and sources

- October 1891: after El Filibusterismo is printed in Ghent, he passes through Paris to say goodbye to the Lunas, the Pardo de Taveras and the Venturas, takes the train to Marseille, and on October 18 boards the steamer Melbourne for Hong Kong (F20).
  France is where his years in Europe began and ended.
- Route map: all five French places on one map (Marseille, Hendaye, Paris, Biarritz, Marseille again) with dates.
- Lessons (section 4.6).
- Quiz: five questions (section 4.5).
- References block (section 4.7), plus image credits.
- Visual: the camera pulls back from the tower to the whole of France at night, then to a calm closing frame.

### 4.3 Fact sheet

Confidence levels:
- `OK`: supported by a reliable source.
- `VERIFY`: supported only by course notes or a weak source; confirm against Zaide or a primary source before shipping.
- `CONFLICT`: sources disagree, or the claim is contradicted; see section 4.4.

Source keys are listed in section 4.7.

| ID | Fact | Sources | Confidence |
| --- | --- | --- | --- |
| F01 | The 1889 Exposition Universelle in Paris marked the centenary of the storming of the Bastille and the French Revolution. It opened May 6, 1889 and closed October 31, 1889. | S6, S1 | OK (confirm dates on the Exposition article) |
| F02 | After his first stay in 1883, Rizal would visit Paris four more times (five visits in all). | S2 | OK |
| F03 | On the night of June 12, 1882, his ship docked at Marseille. He stayed about two and a half days, went to see the Chateau d'If, where Edmond Dantes is imprisoned in Dumas' novel, then took the train to Spain, reaching Barcelona on June 16, 1882. | S1 | CONFLICT (see 4.4) |
| F04 | In June 1883, on summer break from Madrid, he traveled to Paris. His first stop in France was Hendaye. He arrived in Paris on Sunday, June 17, and stayed at the Hotel de Paris, 37 Rue de Maubeuge, later moving to a cheaper hotel at 124 Rue de Rennes. He was back in Madrid by August 20, 1883. A plaque at 37 Rue de Maubeuge marks his stay. | S2, S3, S4, S1 | OK (Aug 20 date VERIFY) |
| F05 | In 1883 he observed patient care at Laennec Hospital and visited Lariboisiere Hospital, toured Le Bon Marche, and complained that sightseeing was costly because of transport, tickets and tips. | S2, S3, S1 | OK |
| F06 | He specialized in ophthalmology to treat his mother's eyes. He worked as an assistant to Dr. Louis de Wecker from November 1885 to February 1886. De Wecker's clinic was at 55 Rue du Cherche-Midi. | S1, S4 | OK |
| F07 | In Paris he spent time in Juan Luna's studio and posed as Sikatuna in Luna's "The Blood Compact" (1886), with Trinidad Pardo de Tavera posing as Legazpi. He drew sketches of "The Monkey and the Turtle" in Paz Pardo de Tavera's album. | S1 | VERIFY (do not use the "Death of Cleopatra" claim, see 4.4) |
| F08 | He left Paris for Germany and arrived in Heidelberg on February 3, 1886. | S1 | OK |
| F09 | Eiffel Tower: foundation work began January 28, 1887; iron assembly began July 1, 1887; the first floor was finished in spring 1888; the second floor on August 14, 1888; assembly was completed and the tower inaugurated on March 31, 1889; it opened to the public on May 15, 1889. In 1889 it was painted Venetian red. It was the tallest structure in the world, about 300 m. | S5, S6, S7, S17 | OK (first floor date: say "spring 1888", sources differ between April 1 and April 29) |
| F10 | Rizal left London for Paris in March 1889, around March 19. | S1 | VERIFY (exact day) |
| F11 | In Paris he formed the Kidlat Club ("kidlat" means lightning), a short-lived social club for young Filipinos at the fair. After seeing Buffalo Bill's Wild West show, it was replaced by the Indios Bravos, whose members pledged to excel intellectually and physically and to make "Indio" a name of pride. He also founded the secret society R.D.L.M., which is mentioned in his letters to Jose Ma. Basa (September 21, 1889) and Marcelo H. del Pilar (November 4, 1889). | S1, S13 | OK (R.D.L.M. meaning VERIFY, see 4.4) |
| F12 | Juan Luna and Paz Pardo de Tavera's daughter, Maria de la Paz, was born June 24, 1889, and Rizal was her godfather. She died at age three. | S1, S14 | OK (birth date VERIFY) |
| F13 | Filipino artists including Felix Resurreccion Hidalgo and Juan Luna took part in the art competition of the 1889 Exposition; Rizal entered a sculpted bust that won no prize. | S1 | VERIFY (prize levels) |
| F14 | Rizal studied Morga's "Sucesos de las Islas Filipinas" (Mexico, 1609) at the British Museum in London and completed his annotated edition in Paris. It was printed by Garnier Hermanos in Paris with a prologue by Ferdinand Blumentritt, and Rizal dedicated it to the Filipinos. The title page reads 1890, but copies came off the press in late 1889. | S8, S9, S10, S1 | CONFLICT on the exact release date, see 4.4 |
| F15 | His essay "Filipinas dentro de cien anos" appeared in La Solidaridad in installments around late 1889 and early 1890. | S10, S1 | VERIFY (exact months) |
| F16 | In 1889 he wrote "Por Telefono", a satire answering Fr. Salvador Font, published as a booklet in Barcelona. | S1 | VERIFY |
| F17 | In May 1889 he lived at 10 Rue de Louvois and visited the fair with compatriots including Juan Luna and Valentin Ventura. Earlier he had stayed briefly with Valentin Ventura. | S12, S1 | VERIFY (address via One Hundred Letters, p. 366-368) |
| F18 | On January 28, 1890, he left Paris for Brussels because living in Paris was costly and its social life got in the way of his writing. | S1 | OK |
| F19 | In February 1891 he went to Biarritz as a guest of the Boustead family (Villa Eliada). He had met Nellie Boustead in Paris in 1889 through their circle of friends, who fenced at Juan Luna's studio. Their romance did not end in marriage, and they parted as friends. On March 29, 1891, the eve of his departure for Paris, he finished the manuscript of El Filibusterismo. | S1, S13 | OK (March 28 vs 29, use March 29 per Zaide) |
| F20 | On October 3, 1891, after El Filibusterismo came off the press in Ghent (September 18, 1891), he went to Paris to say goodbye to the Lunas, the Pardo de Taveras and the Venturas, took the train to Marseille, and on October 18, 1891 boarded the steamer Melbourne for Hong Kong, arriving November 20, 1891. | S1 | OK |
| F21 | Place Jose Rizal in Paris (9th arrondissement) faces 55 Rue de Maubeuge. | S4 | OK |

### 4.4 Conflicts and how to handle them

1. Chateau d'If (F03).
   Student notes say Rizal "visited" the Chateau d'If in 1882, but the fortress was only opened to the public on September 23, 1890 (S15).
   Check Zaide and Rizal's June 1882 letters for his exact words.
   Until confirmed, use the safe wording: "From Marseille's harbor he saw the Chateau d'If, the island fortress from The Count of Monte Cristo."
2. "The Death of Cleopatra" (F07).
   Textbooks say Rizal posed as an Egyptian priest in Luna's "The Death of Cleopatra", but that painting is commonly dated 1881, before Rizal reached Europe.
   Leave it out of the site unless a reliable source resolves the date.
3. Morga release date (F14).
   The title page says 1890; letters show copies were out in late 1889.
   Use: "Printed in Paris at the end of 1889, though its title page says 1890."
   This works well as a margin fact.
4. R.D.L.M. (F11).
   Commonly expanded as "Redencion de los Malayos" (Redemption of the Malays), but historians treat this as a probable reading.
   Use: "a secret society known by the letters R.D.L.M., believed to stand for the redemption of the Malay peoples."
5. Kidlat Club date (F10, F11).
   Some notes say he left London and founded the club on the same day, March 19.
   Unless Zaide or the Rizal-Blumentritt letters confirm it, say "soon after arriving in March 1889".
6. Spelling "de Wecker" vs "de Weckert": use de Wecker (see section 3).

### 4.5 Quiz (chapter 6)

Five multiple-choice questions.
Show feedback and the correct answer with a one-sentence explanation after each answer.
Show a final score with a "Try again" button.

1. Why did Rizal choose to specialize in ophthalmology in Paris? Answer: to treat his mother's eyes (F06).
2. Which group replaced the Kidlat Club? Answer: the Indios Bravos (F11).
3. What did Rizal publish in Paris to show that Filipinos had a civilization before Spanish rule? Answer: his annotated edition of Morga's "Sucesos de las Islas Filipinas" (F14).
4. Where did Rizal finish the manuscript of El Filibusterismo? Answer: Biarritz, France (F19).
5. Why did Rizal leave Paris for Brussels in 1890? Answer: Paris was costly and its social life distracted him from writing (F18).

Write three plausible distractors per question, drawn from real facts elsewhere in the story so the quiz also teaches.

### 4.6 Lessons (chapter 6)

Each lesson is one short sentence plus one sentence tying it to a chapter.

- Learn from the best, then bring it home: he trained under a leading eye surgeon so he could heal his mother.
- Pride is a choice: the Indios Bravos turned an insult into a badge.
- History is a tool: by reprinting Morga with his notes, he gave Filipinos back their past.
- Protect the work: he left glittering Paris because it was keeping him from writing.
- Finish what you start: heartbroken in Biarritz, he still completed El Filibusterismo.

### 4.7 References and sources

Format: APA 7 in the site's references block.
Before shipping, fetch each URL, confirm it supports the facts that cite it, and fill in the author and date fields from the page.

| Key | Source | Notes |
| --- | --- | --- |
| S1 | Zaide, G. F., & Zaide, S. M. Jose Rizal: Life, Works and Writings of a Genius, Writer, Scientist and National Hero. All-Nations Publishing. | Standard course textbook. Cite the edition Lenard's class uses. Most `VERIFY` items should be checked here. |
| S2 | Philippine Daily Inquirer, "Enchanted Rizal falls for Paris at first sight". https://newsinfo.inquirer.net/?p=12116 | Written by the shrine curator of the National Historical Commission of the Philippines. |
| S3 | Philippine Daily Inquirer (Opinion), "Rizal in Paris". https://opinion.inquirer.net/90428/rizal-in-paris | |
| S4 | Philippine Embassy in Paris (DFA), "75 Filipinos trace Rizal's footsteps" (2013). https://parispe.dfa.gov.ph/2013/75-filipinos-trace-rizal-s-footseps | Addresses, de Wecker clinic, Place Jose Rizal. |
| S5 | Societe d'Exploitation de la Tour Eiffel, "133 years and 1,083 feet". https://www.toureiffel.paris/en/news/history-and-culture/133-years-and-1083-feet | Official site. Completion date, Venetian red color. |
| S6 | Wikipedia, "Eiffel Tower" and "Exposition Universelle (1889)". https://en.wikipedia.org/wiki/Eiffel_Tower | Use for orientation, confirm key dates with S5 and S7. |
| S7 | Structurae, "Eiffel Tower" chronology. https://structurae.net/en/structures/20000021 | Construction milestones. |
| S8 | Wikipedia, "Sucesos de las Islas Filipinas". https://en.wikipedia.org/wiki/Sucesos_de_las_Islas_Filipinas | |
| S9 | University of Michigan Library, Philippine collection: Morga, Sucesos de las islas Filipinas, annotated by Jose Rizal (Paris: Garnier hermanos, 1890). https://quod.lib.umich.edu/p/philamer/AHZ9387.0001.001 | Primary source scan, also a candidate image of the title page. |
| S10 | Manila Bulletin, "Rizal survived the 1889-1890 flu epidemic in Europe" (June 19, 2020). https://mb.com.ph/2020/06/19/rizal-survived-the-1889-1890-flu-epidemic-in-europe | Morga print date, Garnier address, La Solidaridad essays. |
| S11 | Craig, A. (1913). Lineage, Life and Labors of Jose Rizal, Philippine Patriot. Project Gutenberg #6867. https://www.gutenberg.org/ebooks/6867 | Public domain, includes period photographs and quotes from letters. |
| S12 | Geronimo Cristobal, "Jose Rizal's visit to the Javanese Village at the 1889 Paris Exposition" (2025). https://geronimocristobal.com/2025/11/13/jose-rizal-and-the-kampung-javanais-at-the-1889-paris-exposition | Secondary; cites One Hundred Letters of Rizal (NHI, 1959). Use only for leads to primary sources. |
| S13 | GMA News, Howie Severino, "Looking for Rizal in Europe, finding a little bad boy". https://gmanetwork.com/news/specials/content/32/who-called-jose-rizal-little-bad-boy | Kidlat Club, Buffalo Bill, Nellie Boustead in Paris. |
| S14 | Wikipedia, "Paz Pardo de Tavera". https://en.wikipedia.org/wiki/Paz_Pardo_de_Tavera | |
| S15 | Wikipedia, "Chateau d'If". https://en.wikipedia.org/wiki/Ch%C3%A2teau_d%27If | Opened to the public in 1890. |
| S16 | Wikipedia, "Juan Luna". https://en.wikipedia.org/wiki/Juan_Luna | |
| S17 | Paris Property Group, "The Eiffel Tower's 130th birthday". https://parispropertygroup.com/news/the-eiffel-towers-130th-birthday-a-look-back-at-her-creation/ | Floor completion dates. |
| S18 | National Historical Institute (1959). One Hundred Letters of Jose Rizal to His Parents, Brothers, Sisters, Relatives. | Primary source for letters; use for any quote. |
| S19 | The Rizal-Blumentritt Correspondence. National Historical Institute. | Primary source for 1889-1891 letters. |

The references block on the site lists only sources actually used in the final copy.
Image credits are listed separately (section 9).

---

## 5. Art direction

### 5.1 Concept

"1889 Paris at night, seen by an eye doctor."
The world is the Exposition at night: deep indigo sky, iron painted Venetian red, warm gaslight.
The one bold element is the 3D tower.
Everything around it is quiet, disciplined typography with generous space.

### 5.2 Color tokens

| Token | Hex | Role |
| --- | --- | --- |
| `--night` | `#1C2340` | Fair-night indigo; main background |
| `--night-deep` | `#121729` | Deepest sky, vignette, footer |
| `--iron` | `#9C3B2A` | Venetian red; the tower, key rules and accents |
| `--gaslight` | `#E2B04A` | Lights, highlights, active states, focus ring |
| `--zinc` | `#D9DEE0` | Primary text on night |
| `--clinic` | `#AFC0C6` | Chapter 3 (eye clinic) palette base |
| `--daylight` | `#C9CED6` | Chapter 2 daytime sky tone |

Rules:
- Body text is `--zinc` on `--night` or `--night-deep`; verify WCAG AA contrast with an automated check.
- `--gaslight` is for light, not decoration: lit windows, the year counter, focus states, the active fold indicator.
- `--iron` never carries body text.
- Each chapter can shift the scene's ambient color (daylight in 2, clinic in 3, night in 4 to 6), animated with scroll, not snapped.

### 5.3 Typography

- Display: Bodoni Moda (Google Fonts, variable, with optical size).
  A Didone serif, the typographic tradition of the Didot family, who were printers in Paris.
  Use it big, with high contrast; use optical size so small sizes stay legible.
- Body: Instrument Sans (Google Fonts).
  Clean and quiet, clearly distinct from the display face.
- Self-host both fonts (subset to Latin and Latin Extended, for Spanish and French accents).
- Type scale: a modular scale with ratio 1.333 from a 18 px body on desktop (17 px on mobile).
  Line length at most 70 characters for body text.
  Body line-height 1.6.
- The year is the main typographic device.
  Each chapter opens with its year set very large in Bodoni Moda, partially behind the 3D scene, so the dates read as part of the world.
- Avoid: all-caps labels, small tracked-out eyebrows over headings, accenting a single word in a headline with italic or a different color, middle-dot meta strings, arrows appended to button text, monospace data labels.

### 5.4 Layout

- Content is left-aligned in a narrow reading column on the left third of the screen on desktop, with the 3D scene filling the viewport behind and to the right.
- On mobile, the scene sits behind the text with a gradient scrim for legibility, and the column fills the width with 24 px margins.
- Margin facts sit in a narrow side column on desktop, inline (indented, with a thin `--iron` rule) on mobile.
- People cards are small portrait-free cards: name in Bodoni Moda, role in one line, one sentence on why they mattered.
  Do not use photographs of people.

Desktop wireframe for a chapter:

```
+--------------------------------------------------------------+
| [fold indicator]                                  3D scene   |
|                                                   behind     |
|  1889                         (huge year, partly             |
|                                behind the tower)             |
|  The World's Fair                                            |
|  Body text column,         | margin fact                     |
|  max 70 characters wide    |                                 |
|  ...                       |                                 |
|                                                              |
|  [people cards in a row]                                     |
+--------------------------------------------------------------+
```

### 5.5 Principles

1. The tower is the clock; time in the story is shown by the city, not by labels.
2. Motion has meaning: it shows time passing, focus, or light, never decoration.
3. One bold thing at a time; when the tower is moving, the text is still, and the other way around.
4. Restraint over ornament: no textures, badges or icons unless they carry information.

---

## 6. The 3D tower and scene

### 6.1 Geometry

Generate the tower procedurally in code; do not download a model.

- Base: square footprint, 125 m per side, four legs on concrete piers.
- Legs curve inward following the tower's well-known profile; approximate it with a smooth exponential-like curve fitted to these heights: first platform about 57 m, second about 115 m, top platform about 276 m, top of the 1889 structure about 300 m (with flagpole about 312 m).
- Each leg is a lattice box girder: four corner chords with diagonal cross-bracing, built from thin box beams.
- The decorative arches between the legs at the base (they were part of the 1889 design).
- Platforms as lattice frames with railings.
- Use `InstancedMesh` for beams so the full tower stays within the draw-call budget.
- Store each beam's normalized construction order (roughly by height, with the four legs rising separately until they join at the first platform) so the build can be revealed by a single progress value from 0 to 1.

### 6.2 Construction timeline mapping

The interlude's scroll progress maps to calendar time from January 28, 1887 to March 31, 1889.
Progress keyframes (fraction of build revealed):

| Date | Event | Build progress |
| --- | --- | --- |
| Jan 28, 1887 | Foundation work begins | 0.00 (piers appear) |
| Jul 1, 1887 | Iron assembly begins | 0.05 |
| Spring 1888 | First platform | 0.30 (legs join) |
| Aug 14, 1888 | Second platform | 0.55 |
| Mar 31, 1889 | Completion | 1.00 |

Before the interlude (chapters 1 to 3) the Champ de Mars is empty.
After it (chapters 4 to 6) the tower is complete.
The year counter in the interlude shows month and year, interpolated between keyframes.

### 6.3 Look

- Material: Venetian red (`--iron`), slightly metallic and rough, with a subtle painted-iron feel.
- Lighting: cool moonlight key, warm gaslight fill from below; in chapter 4 add many small warm point lights or emissive sprites for the fair.
  Before stating anything about how the tower itself was lit in 1889, add that fact to the fact sheet with a source.
- Atmosphere: light distance fog in `--night`, a soft vignette, a few slow-moving clouds.
- Ground: a simple Champ de Mars plane with paths, and a stylized Seine.
- Postprocessing: gentle bloom on lights only; no film grain, no chromatic aberration.

### 6.4 Camera path

A single spline camera path driven by overall scroll progress, with an eased segment per chapter:
- Chapters 1 to 3: low and wide over the empty field, drifting slowly.
- Interlude: a slow half-orbit around the rising tower.
- Chapter 4: rises to look up at the finished tower among the fair lights.
- Chapter 5: settles to a quieter angle; the tower recedes as the Biarritz coast scene fades in.
- Chapter 6: pulls back high and far, then to a calm closing frame.

### 6.5 Performance and fallbacks

- Target 60 fps on a mid-range Android phone (for example an Infinix Note 12 class device) and on desktop.
- Cap device pixel ratio at 2 on desktop and 1.5 on mobile.
- Pause rendering when the canvas is off screen or the tab is hidden.
- Detect weak GPUs or WebGL failure: fall back to pre-rendered still images of each tower stage (render them from the same scene at build time or capture them during development) and crossfade them with scroll.
- With `prefers-reduced-motion: reduce`, do not move the camera with scroll; show still frames per chapter and keep text fully readable without animation.

---

## 7. Scroll choreography

Use GSAP ScrollTrigger for scroll-linked timelines and Lenis for smooth scrolling.
Lenis must not break native keyboard scrolling, anchor links, or the browser's find-in-page.

### 7.1 Page-load sequence (the one orchestrated intro)

1. Night sky fades up from `--night-deep`.
2. Gas lights along the Seine come on one after another, left to right.
3. Title sets in, then the subtitle.
4. A single scroll cue appears after a short delay.
Total under 3 seconds; skippable by scrolling; disabled under reduced motion.

### 7.2 Chapter entrances

Do not fade-and-slide every element.
Each chapter has one entrance idea:
- Chapter 2: the route line draws from Marseille to Paris; text simply appears as it scrolls in.
- Chapter 3: the focus effect (7.4).
- Interlude: the tower builds; the year counter runs.
- Chapter 4: the fair lights (7.5).
- Chapter 5: the Morga title page slides onto the desk like an object being set down.
- Chapter 6: the route map assembles stop by stop; the quiz and references are static.

Margin facts and people cards appear without animation, or with a quick opacity change only.

### 7.3 Fold indicator

A small fixed icon of a Z-folded sheet, top left on desktop, bottom center on mobile.
It shows six panels; the current panel is lit in `--gaslight`.
Clicking or tapping a panel scrolls to that chapter.
It must be keyboard accessible, with labels like "Panel 3 of 6: The eye doctor".
A "Print brochure" control sits next to it.

### 7.4 Focus effect (chapter 3)

As each paragraph and image reaches the reading position, its blur goes from 6 px to 0 and its opacity from 0.4 to 1, scrubbed with scroll.
Implement with CSS filter on elements that are not too large, and check performance on mobile; if it drops frames, apply the blur to a single overlay instead.
Under reduced motion, show everything sharp.

### 7.5 Fair lights (chapter 4)

As chapter 4 scrolls in, the fair's lights come on in a wave spreading out from the tower.
This is the single moment where many things animate at once.

---

## 8. Tech stack and architecture

- Build: Vite, TypeScript (strict).
- 3D: Three.js.
- Scroll: GSAP with ScrollTrigger, Lenis.
- No UI framework is needed; use plain TypeScript modules.
  If the agent prefers a framework, it must justify it in the README.
- Styling: plain CSS with custom properties (tokens from section 5), organized by layer (tokens, base, layout, components, chapters, print).
- Content: all copy lives in `src/content/` as typed data, separate from layout, so it can be reviewed and fact-checked in one place.
  Each block of copy lists the fact IDs it relies on.

Suggested structure:

```
rizal-journey/
  SPEC.md
  README.md
  index.html
  public/
    fonts/
    images/            licensed images only, with credits in content
  src/
    main.ts            bootstraps scene, scroll, UI
    content/
      facts.ts         the fact sheet as data (id, text, sources, confidence)
      sources.ts       reference list
      chapters.ts      copy per chapter, each block tagged with fact IDs
      quiz.ts
    scene/
      renderer.ts
      tower.ts         procedural geometry and build-progress reveal
      environment.ts   ground, Seine, sky, fog, lights
      cameraPath.ts
      fallback.ts      still-frame fallback
    scroll/
      lenis.ts
      timelines.ts     ScrollTrigger timelines per chapter
    ui/
      foldIndicator.ts
      quiz.ts
      peopleCards.ts
      morgaViewer.ts
    styles/
      tokens.css
      base.css
      layout.css
      components.css
      chapters.css
      print.css
  tests/
    content.test.ts    every fact ID used exists; no VERIFY or CONFLICT facts used; no em dashes in copy
    e2e/               Playwright tests and screenshot specs
```

---

## 9. Images and media

- Use only public-domain or openly licensed images, mainly from Wikimedia Commons or library scans (S9, S11).
  For each image, record title, creator, date, source URL and license in a credits list shown in chapter 6.
- Candidate subjects (no photographs of people):
  - The 1890 Morga title page (S9).
  - Juan Luna, "The Blood Compact" (1886).
  - Construction photographs of the Eiffel Tower, 1887-1889.
  - Views of the 1889 Exposition Universelle.
  - A period map of France and a period map of Paris.
  - The Chateau d'If and Marseille harbor in the 19th century.
- Treat all images in the same way so they sit in the world: a consistent tone curve toward the palette, no heavy filters.
- Serve modern formats (AVIF or WebP with fallback) at responsive sizes; lazy-load everything below the first screen.

---

## 10. Print: A4 Z-fold brochure

A "Print brochure" control opens the browser print dialog with a dedicated print stylesheet (or a dedicated `/print` route if that produces a cleaner result).

- Sheet: A4 landscape (297 x 210 mm), printed on both sides, flipping on the long edge.
- Each side has three panels of 99 x 210 mm.
- Side A, left to right: Panel 1 (cover), Panel 2, Panel 3.
- Side B, left to right: Panel 4, Panel 5, Panel 6.
- When folded as a Z, Panel 1 is the front cover, the reader unfolds Side A to read Panels 1 to 3, then flips the sheet to read Panels 4 to 6 (Panel 4 sits behind Panel 3).
- Safe margin of 6 mm inside each panel; nothing crosses a fold line.
- Print copy is a shorter cut of the web copy, in the same typefaces, using light paper colors for ink economy, with the tower shown as a still render from the matching chapter.
- The references and image credits must fit in Panel 6 at a minimum of 7 pt.
- Acceptance: print to PDF, check page size and panel boundaries, then print and fold a physical test copy to confirm the order.

---

## 11. Accessibility and quality floor

- Semantic HTML: one `h1`, chapters as `section` elements with `h2` headings, a skip link to the content.
- Every chapter's full content is readable with JavaScript disabled or WebGL unavailable (the 3D scene is an enhancement).
- Visible focus states in `--gaslight`; full keyboard support for the fold indicator, quiz and Morga viewer.
- Text alternatives for every image; the canvas has an accessible label and a short description per chapter.
- Contrast at least WCAG AA for all text.
- Respect `prefers-reduced-motion` everywhere.
- Responsive from 360 px wide to large desktop; test 360, 390, 768, 1280 and 1920 px widths.
- Performance budget: Largest Contentful Paint under 2.5 s on a mid-range phone over 4G; total JavaScript under 400 KB gzipped excluding fonts and images.

---

## 12. Quality gate

All of these must pass before any milestone is reported done:

- ESLint and Prettier clean, `tsc --noEmit` clean, zero warnings.
- Unit tests (Vitest):
  - every fact ID referenced in `chapters.ts` exists in `facts.ts`;
  - no shipped copy references a fact marked `VERIFY` or `CONFLICT`;
  - no U+2014 (em dash) appears in any content, HTML or source file;
  - every image has a credit entry.
- End-to-end tests (Playwright) on Chromium, WebKit and Firefox, mobile and desktop viewports:
  - the page loads without console errors;
  - the fold indicator navigates to each chapter;
  - the quiz can be completed and shows a score;
  - the reduced-motion and no-WebGL fallbacks render all content.
- Visual review: capture a screenshot of every chapter at 390 px and 1440 px, then review them closely.
  Fix anything that looks off: alignment, overflow, clipped text, awkward line breaks, uneven spacing, contrast, jank.
- Lighthouse: Performance at least 85 on mobile, Accessibility 100, Best Practices at least 95.
- No flaky tests: run the end-to-end suite three times in a row; it must pass every time.

---

## 13. Deployment

- Host on GitHub Pages from the `main` branch through a GitHub Actions workflow that builds and deploys the Vite output.
- Set Vite's `base` to the repository path.
- The README explains how to run, test, build and print.

---

## 14. Acceptance criteria

1. All six panels and the interlude are complete, in the order in section 4.2.
2. Every factual sentence traces to a fact with confidence `OK`.
3. The tower build follows the timeline in section 6.2, and the tower is absent before 1887 and complete from March 1889.
4. The site is beautiful and smooth on a mid-range Android phone and on desktop, and fully readable without WebGL or with reduced motion.
5. The print output folds into a correct A4 Z-fold with Panel 1 as the cover.
6. The quiz works, and the references and image credits are complete.
7. The quality gate in section 12 passes.

---

## 15. Milestones

1. Fact verification: resolve every `VERIFY` and `CONFLICT` item, update `facts.ts`, and report what changed and which sources were used.
2. Scaffold: Vite, TypeScript, lint, tests, CI, fonts and tokens; a static, readable version of all six chapters with final copy and no 3D.
3. Scene: procedural tower with build progress, environment, camera path, fallbacks.
4. Choreography: Lenis, ScrollTrigger timelines, page-load sequence, focus effect, fair lights, fold indicator.
5. Interactions: quiz, Morga viewer, route map, people cards.
6. Print stylesheet and physical fold test.
7. Polish pass: full visual review at every breakpoint, performance tuning, Lighthouse, final accuracy read-through of every sentence against the fact sheet.
8. Deploy to GitHub Pages.
