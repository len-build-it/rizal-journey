/**
 * A round city postmark, like the passport stamps in the game's progress bar.
 * The city runs along the top arc and the year sits in the middle.
 */
export function postmarkSvg(city: string, year: string, uid: string): string {
  const id = `b-arc-${uid}`;
  return `<svg viewBox="0 0 60 60" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <defs><path id="${id}" d="M 13 31 A 17 17 0 0 1 47 31"/></defs>
  <g fill="none" stroke="currentColor">
    <circle cx="30" cy="30" r="27.5" stroke-width="1.6"/>
    <circle cx="30" cy="30" r="23.2" stroke-width="0.7"/>
    <path d="M 9 33.6 H 51" stroke-width="0.7"/>
  </g>
  <text class="b-postmark__city" fill="currentColor" text-anchor="middle"><textPath href="#${id}" startOffset="50%">${city}</textPath></text>
  <text class="b-postmark__year" x="30" y="45" fill="currentColor" text-anchor="middle">${year}</text>
</svg>`;
}
