import { PLACEHOLDER_IMAGE, onImageError } from "./images";

const failEvent = (img) => ({ currentTarget: img });

describe("onImageError", () => {
  it("swaps a broken image for the placeholder", () => {
    const img = document.createElement("img");
    img.setAttribute("src", "https://example.com/missing.jpg");
    onImageError(failEvent(img));
    expect(img.getAttribute("src")).toBe(PLACEHOLDER_IMAGE);
  });

  it("does not loop if the placeholder itself fails", () => {
    const img = document.createElement("img");
    img.setAttribute("src", PLACEHOLDER_IMAGE);
    const spy = vi.spyOn(img, "setAttribute");
    onImageError(failEvent(img));
    expect(spy).not.toHaveBeenCalled();
  });

  it("still works when the SAME element gets a new broken src later (gallery case)", () => {
    const img = document.createElement("img");
    img.setAttribute("src", "https://example.com/one.jpg");
    onImageError(failEvent(img));
    img.setAttribute("src", "https://example.com/two.jpg"); // React swaps the src on the reused element
    onImageError(failEvent(img));
    expect(img.getAttribute("src")).toBe(PLACEHOLDER_IMAGE);
  });
});
