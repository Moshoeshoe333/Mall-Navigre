"use client";

import { useEffect, useState } from "react";
import { findRoute } from "@/domain/routing/route";
import { mallOfAfricaGraph } from "@/data/malls/mall-of-africa/graph";
import { loadActiveParkingSession, saveParkingSession, clearActiveParkingSession, type ParkingLoadResult } from "@/storage/parkingStore";
import type { ParkingSession } from "@/domain/parking/types";
import { authorizeParkingRouting } from "@/domain/parking/routing-authorization";

const MALL_ID = "mall-of-africa";
const START_NODE = "p4-entrance-16";

type HydrationState =
  | { status: "IDLE" }
  | { status: "HYDRATING" }
  | { status: "RESTORED"; session: ParkingSession }
  | { status: "EMPTY" }
  | { status: "CORRUPTED"; error: string }
  | { status: "STORAGE_ERROR"; error: string };

export default function Home() {
  const [hydration, setHydration] = useState<HydrationState>({ status: "IDLE" });
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("Local-first storage ready.");
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeVerified, setRouteVerified] = useState(false);
  const session = hydration.status === "RESTORED" ? hydration.session : null;

  useEffect(() => {
    let mounted = true;
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setHydration({ status: "HYDRATING" });
    loadActiveParkingSession()
      .then((result: ParkingLoadResult) => {
        if (!mounted) return;
        setHydration(result);
        if (result.status === "RESTORED") setMessage("Parking Passport restored from this device.");
        if (result.status === "CORRUPTED" || result.status === "STORAGE_ERROR") setMessage(result.error);
      })
      .catch(() => {
        if (!mounted) return;
        setHydration({ status: "STORAGE_ERROR", error: "Unexpected local storage failure." });
        setMessage("Unexpected local storage failure.");
      });
    return () => {
      mounted = false;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  async function saveCar() {
    const next: ParkingSession = { id: crypto.randomUUID(), mallId: MALL_ID, parkadeId: "parkade-c", levelId: "mofa-parking-4", landmarkId: "p4-start", capturedAt: new Date().toISOString(), source: "manual", confidence: 1, note: "Saved manually — exact bay not claimed." };
    try {
      await saveParkingSession(next);
      setHydration({ status: "RESTORED", session: next });
      setRouteDistance(null);
      setMessage("Parking Passport saved locally. Close and reopen: the passport should still be here.");
    } catch {
      setHydration({ status: "STORAGE_ERROR", error: "Failed to persist offline parking passport." });
      setMessage("Failed to persist offline parking passport.");
    }
  }

  async function clearCar() {
    try { await clearActiveParkingSession(); setHydration({ status: "EMPTY" }); setRouteDistance(null); setMessage("Parking Passport cleared."); }
    catch { setHydration({ status: "STORAGE_ERROR", error: "Failed to clear the local parking passport." }); }
  }

  function routeToCar() {
    if (!session?.landmarkId) return;

    const authorization = authorizeParkingRouting(session);
    if (!authorization.allowed) {
      if (authorization.reason === "low_confidence") {
        setMessage("Confidence is low. Confirm a visible parking landmark before navigating.");
      } else if (authorization.reason === "stale") {
        setMessage("This Parking Passport is stale. Confirm your current parking landmark before navigating.");
      } else if (authorization.reason === "unsupported_source") {
        setMessage("This location source is not authorized for parking routing yet. Confirm a visible parking landmark.");
      } else if (authorization.reason === "invalid_confidence") {
        setMessage("Parking confidence is invalid. Confirm a visible parking landmark before navigating.");
      } else {
        setMessage("A valid parking session is required before navigating.");
      }
      return;
    }

    const route = findRoute(mallOfAfricaGraph, START_NODE, session.landmarkId);
    if (!route) { setMessage("No usable route is available from this point."); return; }
    setRouteDistance(route.distanceMeters); setRouteVerified(route.verified);
    setMessage(route.verified ? "Route ready on verified graph data." : "Route found, but this V1 geometry is unverified. Use it as guidance, not survey-grade positioning.");
  }

  const hydrating = hydration.status === "IDLE" || hydration.status === "HYDRATING";
  return (
    <main className="navigre-shell">
      <header className="navigre-header"><div><p className="eyebrow">Navigre Core 0.1 · Parking Truth Test</p><h1>Never lose your car again.</h1><p className="subtitle">Know where you are. Know where you’re going.</p></div><div className="status">{online ? "● Online" : "○ Offline"} · Local-first</div></header>
      <section className="grid">
        <div className="card map" aria-label="Schematic indoor map"><div className="map-grid" /><div className="map-label"><span>Mall of Africa</span><span>Parking Level 4 · schematic</span></div><div className="route" /><span className="node node-a" title="Saved parking area" /><span className="node node-b" title="Parking connector" /><span className="node node-c" title="Entrance 16" />{routeDistance !== null && <div id="navigation-route" className="map-route-status">{Math.round(routeDistance)} m · {routeVerified ? "verified" : "unverified geometry"}</div>}</div>
        <aside className="card panel"><h2>Parking Passport</h2>
          {hydrating ? <div id="hydration-skeleton" className="saved" aria-label="Restoring parking passport"><strong>Restoring Parking Passport…</strong><div className="meta">Checking this device for a saved parking session.</div></div>
          : hydration.status === "RESTORED" ? <div id="parking-passport" className="saved"><strong>Car location saved</strong><div className="meta">Parkade C · Level 4<br />Manual capture · exact bay not claimed</div><div className="confidence" style={{ marginTop: 12 }}><span>Confidence</span><strong>{Math.round(session!.confidence * 100)}%</strong></div></div>
          : hydration.status === "CORRUPTED" ? <div id="parking-passport" className="saved"><strong id="corrupted-state">Stored parking data could not be restored</strong><div className="meta">{hydration.error}</div></div>
          : hydration.status === "STORAGE_ERROR" ? <div id="parking-passport" className="saved"><strong>Local storage error</strong><div className="meta">{hydration.error}</div></div>
          : <div id="parking-passport" className="saved"><strong>No active parking session</strong><div className="meta">Save a location and Navigre keeps it on this device, including when you go offline.</div></div>}
          <div className="actions"><button id="save-my-car" className="action" onClick={saveCar}>{session ? "Update My Car" : "Save My Car"}</button><button id="find-my-car" className="action secondary" onClick={routeToCar} disabled={!session}>Find My Car</button>{session && <button id="clear-passport" className="action secondary" onClick={clearCar}>Clear Passport</button>}</div>
          <div className="meta">{message}</div><div className="warning">TRUTH MODE: GPS is not treated as an exact indoor bay locator. Localization is replaceable; navigation remains stable. Unverified geometry is disclosed rather than hidden.</div>
        </aside>
      </section>
    </main>
  );
}
