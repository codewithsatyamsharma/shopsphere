import { useApi } from "../../../hooks/useApi";

export const PAGE_SIZE = 12;

export function useProducts(filters) {
  return useApi("/products", { ...filters, limit: PAGE_SIZE });
}
