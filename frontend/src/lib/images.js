// Shown when a product photo fails to load (offline, blocked network, or a bad URL),
// so the layout never shows a broken-image icon.
const svg =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>" +
  "<rect width='400' height='400' fill='#e2e8f0'/>" +
  "<g fill='none' stroke='#94a3b8' stroke-width='14' stroke-linecap='round' stroke-linejoin='round'>" +
  "<path d='M120 160h160l-14 130a20 20 0 0 1-20 18H154a20 20 0 0 1-20-18z'/>" +
  "<path d='M165 160v-20a35 35 0 0 1 70 0v20'/></g></svg>";

export const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export function onImageError(event) {
  const img = event.currentTarget;
  // Stop only if the placeholder itself failed. Do NOT remember "this element failed before":
  // a gallery reuses one <img> for several pictures, and each new picture needs its own fallback.
  if (img.getAttribute("src") === PLACEHOLDER_IMAGE) return;
  img.setAttribute("src", PLACEHOLDER_IMAGE);
}
