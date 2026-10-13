import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api";
import { cleanParams } from "../lib/format";

// A small data-fetching hook: GET `url`, expose { data, loading, error, refetch }.
// - Cancels the in-flight request when the url or params change (no stale results).
// - Keeps the previous data visible while the next request loads.
export function useApi(url, params, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null, status: null });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(cleanParams(params)); // a string is a stable dependency, unlike an object

  useEffect(() => {
    if (!enabled || !url) return;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    api
      .get(url, { params: JSON.parse(key), signal: controller.signal })
      .then((res) => setState({ data: res.data.data, loading: false, error: null, status: 200 }))
      .catch((error) => {
        if (axios.isCancel(error)) return; // we cancelled it ourselves
        setState({ data: null, loading: false, error: getErrorMessage(error), status: error.response?.status ?? 0 });
      });

    return () => controller.abort();
  }, [url, key, enabled, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refetch };
}
