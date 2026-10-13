import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test/utils";
import { ProductCard } from "./ProductCard";

vi.mock("react-hot-toast", () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

const product = {
  id: 7,
  name: "Aurora Wireless Headphones",
  brand: "Sonique",
  price: 2999,
  originalPrice: 4999,
  discountPercent: 40,
  stock: 45,
  inStock: true,
  image: "https://example.com/a.jpg",
  rating: 4.5,
  reviewCount: 12,
  category: { id: 1, name: "Electronics", slug: "electronics" },
};

describe("ProductCard", () => {
  it("shows the name, discounted price, original price and discount", () => {
    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByRole("link", { name: product.name })).toHaveAttribute("href", "/products/7");
    expect(screen.getByText("₹2,999")).toBeInTheDocument();
    expect(screen.getByText("₹4,999")).toBeInTheDocument();
    expect(screen.getByText("40% off")).toBeInTheDocument();
  });

  it("adds the product to the cart when you click the button", async () => {
    const { store } = renderWithProviders(<ProductCard product={product} />);
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(store.getState().cart.items).toHaveLength(1);
    expect(store.getState().cart.items[0]).toMatchObject({ productId: 7, quantity: 1, price: 2999 });
  });

  it("disables the button and shows a label when out of stock", () => {
    renderWithProviders(<ProductCard product={{ ...product, stock: 0, inStock: false }} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unavailable/i })).toBeDisabled();
  });

  it("warns when only a few are left", () => {
    renderWithProviders(<ProductCard product={{ ...product, stock: 3 }} />);
    expect(screen.getByText("Only 3 left")).toBeInTheDocument();
  });

  it("reflects the wishlist from the store", () => {
    renderWithProviders(<ProductCard product={product} />, {
      preloadedState: { wishlist: { ids: [7] } },
    });
    expect(screen.getByRole("button", { name: "Remove from wishlist" })).toHaveAttribute("aria-pressed", "true");
  });
});
