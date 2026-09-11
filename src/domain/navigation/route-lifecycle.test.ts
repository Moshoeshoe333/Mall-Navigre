import { describe, expect, it } from "vitest";
import { RouteLifecycle, type RouteLifecycleRoute } from "@/domain/navigation/route-lifecycle";

const activeRoute: RouteLifecycleRoute = {
  mode: "ACTIVE_GUIDANCE",
  isGuidanceAllowed: true,
};

const previewRoute: RouteLifecycleRoute = {
  mode: "UNVERIFIED_PREVIEW",
  isGuidanceAllowed: false,
};

describe("Seam Hardening 2: Route Lifecycle Contract", () => {
  it("starts empty and enters calculating without exposing guidance", () => {
    const lifecycle = new RouteLifecycle();
    expect(lifecycle.state.status).toBe("EMPTY");

    const token = lifecycle.beginCalculation();
    expect(lifecycle.state).toEqual({ status: "CALCULATING", calculationId: token });
  });

  it("commits a verified route as active guidance", () => {
    const lifecycle = new RouteLifecycle();
    const token = lifecycle.beginCalculation();

    lifecycle.completeCalculation(token, activeRoute);

    expect(lifecycle.state).toMatchObject({ status: "ACTIVE", route: activeRoute });
    expect(lifecycle.guidanceAllowed).toBe(true);
  });

  it("preserves unverified routes as preview-only active state", () => {
    const lifecycle = new RouteLifecycle();
    const token = lifecycle.beginCalculation();

    lifecycle.completeCalculation(token, previewRoute);

    expect(lifecycle.state).toMatchObject({ status: "ACTIVE", route: previewRoute });
    expect(lifecycle.guidanceAllowed).toBe(false);
  });

  it("invalidates an active route immediately when infrastructure changes", () => {
    const lifecycle = new RouteLifecycle();
    const token = lifecycle.beginCalculation();
    lifecycle.completeCalculation(token, activeRoute);

    lifecycle.invalidate("ROUTE_EDGE_UNAVAILABLE");

    expect(lifecycle.state).toEqual({
      status: "INVALIDATED",
      reason: "ROUTE_EDGE_UNAVAILABLE",
    });
    expect(lifecycle.guidanceAllowed).toBe(false);
    expect(lifecycle.currentRoute).toBeNull();
  });

  it("moves invalidated state into re-routing with a new calculation generation", () => {
    const lifecycle = new RouteLifecycle();
    const first = lifecycle.beginCalculation();
    lifecycle.completeCalculation(first, activeRoute);
    lifecycle.invalidate("ROUTE_EDGE_UNAVAILABLE");

    const second = lifecycle.beginRerouting();

    expect(second).not.toBe(first);
    expect(lifecycle.state).toEqual({
      status: "RE_ROUTING",
      calculationId: second,
      reason: "ROUTE_EDGE_UNAVAILABLE",
    });
  });

  it("accepts an alternate route after invalidation", () => {
    const lifecycle = new RouteLifecycle();
    const first = lifecycle.beginCalculation();
    lifecycle.completeCalculation(first, activeRoute);
    lifecycle.invalidate("ROUTE_EDGE_UNAVAILABLE");
    const second = lifecycle.beginRerouting();

    const alternate: RouteLifecycleRoute = { ...activeRoute };
    lifecycle.completeCalculation(second, alternate);

    expect(lifecycle.state).toMatchObject({ status: "ACTIVE", route: alternate });
    expect(lifecycle.guidanceAllowed).toBe(true);
  });

  it("fails closed when re-routing produces no usable presentation", () => {
    const lifecycle = new RouteLifecycle();
    const first = lifecycle.beginCalculation();
    lifecycle.completeCalculation(first, activeRoute);
    lifecycle.invalidate("ROUTE_EDGE_UNAVAILABLE");
    const second = lifecycle.beginRerouting();

    lifecycle.completeCalculation(second, null);

    expect(lifecycle.state).toEqual({
      status: "FAILED_CLOSED",
      reason: "NO_USABLE_ROUTE",
    });
    expect(lifecycle.guidanceAllowed).toBe(false);
    expect(lifecycle.currentRoute).toBeNull();
  });

  it("rejects a late result from an older calculation generation after legitimate invalidation", () => {
    const lifecycle = new RouteLifecycle();
    const first = lifecycle.beginCalculation();
    lifecycle.completeCalculation(first, activeRoute);
    lifecycle.invalidate("PARKING_SESSION_STALE");
    const second = lifecycle.beginRerouting();

    expect(lifecycle.completeCalculation(first, activeRoute)).toBe(false);
    expect(lifecycle.state).toEqual({
      status: "RE_ROUTING",
      calculationId: second,
      reason: "PARKING_SESSION_STALE",
    });
    expect(lifecycle.currentRoute).toBeNull();
  });

  it("rejects a slower older calculation when a newer generation finishes first", () => {
    const lifecycle = new RouteLifecycle();
    const first = lifecycle.beginCalculation();
    const second = lifecycle.beginCalculation();

    expect(lifecycle.completeCalculation(second, activeRoute)).toBe(true);
    expect(lifecycle.completeCalculation(first, previewRoute)).toBe(false);

    expect(lifecycle.state).toEqual({
      status: "ACTIVE",
      calculationId: second,
      route: activeRoute,
    });
  });

  it("cannot resurrect a cleared route with a late calculation result", () => {
    const lifecycle = new RouteLifecycle();
    const token = lifecycle.beginCalculation();
    lifecycle.clear();

    expect(lifecycle.completeCalculation(token, activeRoute)).toBe(false);

    expect(lifecycle.state).toEqual({ status: "EMPTY" });
    expect(lifecycle.currentRoute).toBeNull();
    expect(lifecycle.guidanceAllowed).toBe(false);
  });

  it("cannot overwrite a newer route with a superseded result", () => {
    const lifecycle = new RouteLifecycle();
    const first = lifecycle.beginCalculation();
    lifecycle.completeCalculation(first, activeRoute);
    lifecycle.invalidate("ROUTE_NODE_UNAVAILABLE");
    const second = lifecycle.beginRerouting();
    const newerRoute: RouteLifecycleRoute = { ...activeRoute };

    lifecycle.completeCalculation(second, newerRoute);
    expect(lifecycle.completeCalculation(first, activeRoute)).toBe(false);

    expect(lifecycle.state).toMatchObject({ status: "ACTIVE", route: newerRoute });
  });

  it("rejects invalidation when no active route exists", () => {
    const lifecycle = new RouteLifecycle();

    expect(() => lifecycle.invalidate("ROUTE_EDGE_UNAVAILABLE")).toThrow();
    expect(lifecycle.state).toEqual({ status: "EMPTY" });
  });
});
