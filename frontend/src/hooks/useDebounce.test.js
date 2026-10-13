import { act, renderHook } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the first value immediately", () => {
    const { result } = renderHook(() => useDebounce("a", 400));
    expect(result.current).toBe("a");
  });

  it("only updates after the delay", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), { initialProps: { value: "a" } });
    rerender({ value: "ab" });
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(399));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("ab");
  });

  it("restarts the timer on every change, so only the last value wins", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), { initialProps: { value: "k" } });
    rerender({ value: "ke" });
    act(() => vi.advanceTimersByTime(300));
    rerender({ value: "key" });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("k"); // 600ms passed in total, but never 400ms of quiet
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("key");
  });
});
