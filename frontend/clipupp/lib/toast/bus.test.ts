import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetToastBus, isToasterWanted, subscribeToasterWanted, toastGone, toastReady, withToast } from "./bus";

type Api = Parameters<typeof toastReady>[0];
const fakeApi = () => ({ custom: vi.fn() }) as unknown as Api;

describe("toast bus", () => {
  beforeEach(() => __resetToastBus());

  it("queues jobs until the toaster is ready, then flushes them in order", () => {
    const seen: string[] = [];
    withToast(() => seen.push("a"));
    withToast(() => seen.push("b"));
    expect(seen).toEqual([]);
    toastReady(fakeApi());
    expect(seen).toEqual(["a", "b"]);
  });

  it("runs jobs immediately once ready", () => {
    const api = fakeApi();
    toastReady(api);
    const job = vi.fn();
    withToast(job);
    expect(job).toHaveBeenCalledWith(api);
  });

  it("asks for the toaster on the first job only", () => {
    const listener = vi.fn();
    subscribeToasterWanted(listener);
    expect(isToasterWanted()).toBe(false);
    withToast(() => {});
    withToast(() => {});
    expect(isToasterWanted()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("queues again and asks for the toaster after it unmounts", () => {
    const first = fakeApi();
    toastReady(first);
    toastGone();
    const listener = vi.fn();
    subscribeToasterWanted(listener);
    const job = vi.fn();
    withToast(job);
    expect(job).not.toHaveBeenCalled();
    expect(isToasterWanted()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    const second = fakeApi();
    toastReady(second);
    expect(job).toHaveBeenCalledWith(second);
  });
});
