import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTOSAVE_DELAY_MS, useAutosave } from "./useAutosave";

describe("useAutosave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = (save: (value: { text: string }) => Promise<unknown>) =>
    renderHook(({ value }) => useAutosave(value, save), {
      initialProps: { value: { text: "loaded" } as { text: string } | null },
    });

  it("does not save the initially loaded value", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    setup(save);
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 2));
    expect(save).not.toHaveBeenCalled();
  });

  it("debounces edits into one save", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = setup(save);
    rerender({ value: { text: "a" } });
    rerender({ value: { text: "ab" } });
    expect(result.current.saveState).toBe("unsaved");
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ text: "ab" });
    expect(result.current.saveState).toBe("saved");
  });

  it("saves pending edits on unmount instead of dropping them", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = setup(save);
    rerender({ value: { text: "typed then navigated away" } });
    unmount();
    await act(() => vi.runAllTimersAsync());
    expect(save).toHaveBeenCalledWith({ text: "typed then navigated away" });
  });

  it("saves immediately on flush", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = setup(save);
    rerender({ value: { text: "now" } });
    await act(() => result.current.flush());
    expect(save).toHaveBeenCalledWith({ text: "now" });
  });

  it("keeps a failed save pending and retries it", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("quota")).mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { rerender, result } = setup(save);
    rerender({ value: { text: "important" } });
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
    expect(result.current.saveState).toBe("error");
    await act(() => result.current.flush());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith({ text: "important" });
    expect(result.current.saveState).toBe("saved");
  });

  it("warns before closing the tab with unsaved changes", () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = setup(save);
    rerender({ value: { text: "unsaved" } });
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
