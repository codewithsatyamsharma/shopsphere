import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../../../lib/api";

// Accumulates pages for infinite scrolling. Remount it (with a `key`) to start over for a new filter.
export function useOrders(status) {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ orders: [], pagination: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get("/orders/my", { params: { page, limit: 6, ...(status && { status }) }, signal: controller.signal })
      .then((res) => {
        const { orders, pagination } = res.data.data;
        setState((s) => ({
          // de-duplicate by id: Strict Mode runs effects twice in development
          orders: [...s.orders, ...orders.filter((o) => !s.orders.some((x) => x.id === o.id))],
          pagination,
          loading: false,
          error: null,
        }));
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        setState((s) => ({ ...s, loading: false, error: getErrorMessage(error) }));
      });
    return () => controller.abort();
  }, [status, page]);

  const hasMore = state.pagination ? state.pagination.page < state.pagination.totalPages : false;
  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const retry = useCallback(() => setPage((p) => p), []);
  return { ...state, hasMore, loadMore, retry };
}
