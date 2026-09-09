"use client";

import { useEffect, useState } from "react";
import { findRoute } from "@/domain/routing/route";
import { mallOfAfricaGraph } from "@/data/malls/mall-of-africa/graph";
import { loadActiveParkingSession, saveParkingSession, clearActiveParkingSession } from "@/storage/parkingStore";
import type { ParkingSession } from "@/domain/parking/types";
import { shouldRequestLandmarkConfirmation } from "@/domain/parking/state";

const MALL_ID = "mall-of-africa";
const START_NODE = "p4-entrance-16";

export default function Home() {
  const [session, setSession] = useState<ParkingSession | null>(null);
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("Local-first storage ready.");
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeVerified, setRouteVerified] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline); window.addEventListener("offline", onOffline);
    loadActiveParkingSession().then(setSession).catch(() => setMessage("Local storage unavailable on this device."));
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  async function saveCar() {
    const next: ParkingSession = {
      id: crypto.randomUUID(), mallId: MALL_ID, parkadeId: "parkade-c", levelId: "mofa-parking-4",
      landmarkId: "p4-start", capturedAt: new Date().toISOString(), source: "manual", confidence: 1,
      note: "Saved manually — exact bay not claimed.",
    };
    await saveParkingSession(next); setSession(next); setRouteDistance(null);
    setMessage("Parking Passport saved locally. Close and reopen: the passport should still be here.");
  }

  async function clearCar() {
    await clearActiveParkingSession(); setSession(null); setRouteDistance(null); setMessage("Parking Passport cleared.");
  }

  function routeToCar() {
    if (!session?.landmarkId) return;
    if (shouldRequestLandmarkConfirmation(session.confidence)) { setMessage("Confidence is low. Confirm a visible parking landmark before navigating."); return; }
    const route = findRoute(mallOfAfricaGraph, START_NODE, session.landmarkId);
    if (!route) { setMessage("No usable route is available from this point."); return; }
    setRouteDistance(route.distanceMeters); setRouteVerified(route.verified);
    setMessage(route.verified ? "Route ready on verified graph data." : "Route found, but this V1 geometry is unverified. Use it as guidance, not survey-grade positioning.");
  }

  return (
    <main className="navigre-shell">
      <header className="navigre-header">
        <div><p className="eyebrow">Navigre Core 0.1 · Parking Truth Test</p><h1>Never lose your car again.</h1><p className="subtitle">Know where you are. Know where you’re going.</p></div>
        <div className="status">{online ? "● Online" : "○ Offline"} · Local-first</div>
      </header>
      <section className="grid">
        <div className="card map" aria-label="Schematic indoor map">
          <div className="map-grid" /><div className="map-label"><span>Mall of Africa</span><span>Parking Level 4 · schematic</span></div>
          <div className="route" /><span className="node node-a" title="Saved parking area" /><span className="node node-b" title="Parking connector" /><span className="node node-c" title="Entrance 16" />
          {routeDistance !== null && <div className="map-route-status">{Math.round(routeDistance)} m · {routeVerified ? "verified" : "unverified geometry"}</div>}
        </div>
        <aside className="card panel">
          <h2>Parking Passport</h2>
          {session ? <div className="saved"><strong>Car location saved</strong><div className="meta">Parkade C · Level 4<br />Manual capture · exact bay not claimed</div><div className="confidence" style={{ marginTop: 12 }}><span>Confidence</span><strong>{Math.round(session.confidence * 100)}%</strong></div></div> : <div className="saved"><strong>No active parking session</strong><div className="meta">Save a location and Navigre keeps it on this device, including when you go offline.</div></div>}
          <div className="actions"><button className="action" onClick={saveCar}>{session ? "Update My Car" : "Save My Car"}</button><button className="action secondary" onClick={routeToCar} disabled={!session}>Find My Car</button>{session && <button className="action secondary" onClick={clearCar}>Clear Passport</button>}</div>
          <div className="meta">{message}</div>
          <div className="warning">TRUTH MODE: GPS is not treated as an exact indoor bay locator. Localization is replaceable; navigation remains stable. Unverified geometry is disclosed rather than hidden.</div>
        </aside>
      </section>
    </main>
  );
}
