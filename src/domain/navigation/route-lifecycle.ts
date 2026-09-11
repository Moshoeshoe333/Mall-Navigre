import type { RouteViewModel } from "@/domain/navigation/presentation";

export type RouteInvalidationReason =
  | "ROUTE_NODE_UNAVAILABLE"
  | "ROUTE_EDGE_UNAVAILABLE"
  | "ROUTE_NODE_STATUS_CHANGED"
  | "ROUTE_EDGE_STATUS_CHANGED"
  | "PARKING_SESSION_STALE"
  | "PARKING_AUTHORIZATION_REJECTED"
  | "POLICY_CHANGED";

export type RouteFailureReason = "NO_USABLE_ROUTE" | "CALCULATION_REJECTED";

export type RouteLifecycleState =
  | { status: "EMPTY" }
  | { status: "CALCULATING"; calculationId: string }
  | { status: "ACTIVE"; calculationId: string; route: RouteViewModel }
  | { status: "INVALIDATED"; reason: RouteInvalidationReason }
  | { status: "RE_ROUTING"; calculationId: string; reason: RouteInvalidationReason }
  | { status: "FAILED_CLOSED"; reason: RouteFailureReason };

const EMPTY: RouteLifecycleState = { status: "EMPTY" };

/**
 * Temporal boundary for a presented route.
 *
 * This class owns lifecycle state only. It does not calculate routes, mutate
 * graph state, or bypass the presentation contract. Calculation results are
 * committed only when their generation is still authoritative.
 */
export class RouteLifecycle {
  private stateValue: RouteLifecycleState = EMPTY;
  private generation = 0;

  get state(): RouteLifecycleState {
    return this.stateValue;
  }

  get currentRoute(): RouteViewModel | null {
    return this.stateValue.status === "ACTIVE" ? this.stateValue.route : null;
  }

  get guidanceAllowed(): boolean {
    return this.stateValue.status === "ACTIVE" && this.stateValue.route.isGuidanceAllowed;
  }

  beginCalculation(): string {
    const calculationId = this.nextGeneration();
    this.stateValue = { status: "CALCULATING", calculationId };
    return calculationId;
  }

  completeCalculation(calculationId: string, route: RouteViewModel | null): boolean {
    if (!this.isCurrentCalculation(calculationId)) return false;

    if (!route || route.mode === "FAILED_CLOSED") {
      this.stateValue = { status: "FAILED_CLOSED", reason: "NO_USABLE_ROUTE" };
      return true;
    }

    this.stateValue = { status: "ACTIVE", calculationId, route };
    return true;
  }

  invalidate(reason: RouteInvalidationReason): void {
    if (this.stateValue.status !== "ACTIVE") {
      throw new Error("Only an active route can be invalidated.");
    }

    this.generation += 1;
    this.stateValue = { status: "INVALIDATED", reason };
  }

  beginRerouting(): string {
    if (this.stateValue.status !== "INVALIDATED") {
      throw new Error("Re-routing requires an invalidated route.");
    }

    const reason = this.stateValue.reason;
    const calculationId = this.nextGeneration();
    this.stateValue = { status: "RE_ROUTING", calculationId, reason };
    return calculationId;
  }

  clear(): void {
    this.generation += 1;
    this.stateValue = EMPTY;
  }

  private nextGeneration(): string {
    this.generation += 1;
    return `route-generation-${this.generation}`;
  }

  private isCurrentCalculation(calculationId: string): boolean {
    return (this.stateValue.status === "CALCULATING" || this.stateValue.status === "RE_ROUTING") &&
      this.stateValue.calculationId === calculationId;
  }
}
