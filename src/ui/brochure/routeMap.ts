/**
 * Route map of France for the brochure cover, drawn from a simplified outline
 * projected from real coordinates. Places and years match the fact sheet.
 */
const OUTLINE =
  'M112.7 16.4 L121.6 23.0 L135.4 37.0 L144.4 42.0 L158.8 48.0 L165.7 49.0 L182.2 57.0 L190.5 58.6 L184.3 72.0 L181.5 86.0 L173.3 89.0 L161.6 106.0 L159.5 115.0 L171.2 110.0 L174.0 120.0 L169.1 136.0 L174.6 146.0 L172.6 154.0 L180.8 162.4 L169.1 175.0 L161.6 177.0 L151.9 174.0 L140.9 169.0 L132.7 167.0 L122.3 173.0 L119.6 179.0 L121.0 189.0 L110.6 191.0 L101.0 188.0 L87.2 182.0 L73.5 182.0 L59.7 177.0 L53.1 170.8 L57.6 160.0 L60.4 146.0 L61.1 130.0 L61.8 114.0 L48.7 102.0 L43.2 92.0 L33.5 85.0 L17.7 82.0 L12.2 71.0 L22.5 64.0 L36.3 62.0 L55.6 65.0 L56.2 56.0 L51.4 44.0 L60.4 45.0 L62.4 51.0 L80.3 49.0 L81.7 44.0 L98.2 34.0 L99.6 20.0 L112.7 16.4 Z';

export function routeMapSvg(): string {
  return `<svg viewBox="0 0 200 212" role="img" aria-labelledby="b-map-title b-map-desc" xmlns="http://www.w3.org/2000/svg">
  <title id="b-map-title">Rizal's journeys in France</title>
  <desc id="b-map-desc">Map of France with Marseille, Hendaye, Biarritz and Paris marked. Dotted routes show three of his train journeys: Marseille toward Spain in 1882, Hendaye to Paris in 1883, and Paris to Marseille in 1891. Biarritz is where he stayed in early 1891.</desc>
  <defs>
    <marker id="b-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M1 1 L8 5 L1 9" fill="none" stroke="var(--k-vermilion)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>
  <path d="${OUTLINE}" fill="var(--k-card-sunk)" stroke="var(--k-ink)" stroke-width="1.1" stroke-linejoin="round"/>
  <g fill="none" stroke="var(--k-vermilion)" stroke-width="1.4" stroke-dasharray="2.4 2.6" stroke-linecap="round" marker-end="url(#b-arrow)">
    <path d="M150 175 Q 130 195 113 205"/>
    <path d="M55 167 Q 70 110 106 64"/>
    <path d="M113 64 Q 150 105 150 167"/>
  </g>
  <g fill="var(--k-ink)">
    <circle cx="109.9" cy="60.8" r="3.2"/>
    <circle cx="151.5" cy="172" r="3.2"/>
    <circle cx="56.1" cy="168.4" r="2.6"/>
    <circle cx="53.1" cy="170.8" r="2.2"/>
  </g>
  <g font-family="var(--k-display)" font-size="9.5" fill="var(--k-ink)" style="font-variation-settings: var(--k-display-axes)">
    <text x="116" y="58">Paris</text>
    <text x="156" y="170">Marseille</text>
    <text x="14" y="160">Biarritz</text>
    <text x="22" y="182">Hendaye</text>
  </g>
  <g font-family="var(--k-text)" font-style="italic" font-size="7.4" fill="var(--k-vermilion)">
    <text x="118" y="206">1882, to Spain</text>
    <text x="40" y="118" transform="rotate(-52 70 112)">1883</text>
    <text x="12" y="150">early 1891</text>
    <text x="139" y="110">Oct. 1891</text>
  </g>
</svg>`;
}
