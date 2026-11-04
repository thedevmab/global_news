/** Local editorial fallbacks. Never hotlink a third-party photo CDN. */
export const editorial = {
  skyline: "/images/editorial/skyline-dusk.jpg",
  city: "/images/editorial/city-night.jpg",
  globe: "/images/editorial/globe-editorial.jpg",
} as const;

const cycle = [editorial.skyline, editorial.city, editorial.globe] as const;

export function editorialFallback(index = 0) {
  return cycle[index % cycle.length] ?? editorial.skyline;
}
