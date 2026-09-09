"use client";

import { useEffect, useState } from "react";
import { findRoute } from "@/domain/routing/route";
import { mallOfAfricaGraph } from "@/data/malls/mall-of-africa/graph";
import { loadActiveParkingSession, saveParkingSession } from "@/storage/parkingStore";
import type { ParkingSession } from "@/domain/parking/types";

export default function Home() {
  const [session, setSession] = useState<ParkingSession | null>(null);
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("Local-first storage ready.");

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    loadActiveParkingSession().then(setSession).catch(() => setMessage("Local storage unavailable on this device."));
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  async function saveCar() {
    const next: ParkingSession = {
      id: crypto.randomUUID(), mallId: "mall-of-africa", parkadeId: "parkade-c", levelId: "mofa-parking-4",
      landmarkId: "p4-start", capturedAt: new Date().toISOString(), source: "manual", confidence: 1,
      note: "Saved manually — exact bay not claimed.",
    };
    await saveParkingSession(next);
    setSession(next);
    setMessage("Parking Passport saved locally.");
  }

  function routeToCar() {
    if (!session?.landmarkId) return;
    const route = findRoute(mallOfAfricaGraph, "p4-entrance-16", session.landmarkId);
    setMessage(route ? `Route ready — ${Math.round(route.distanceMeters)} m to your saved area.` : "No verified route is available from this point.");
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
        </div>
        <aside className="card panel">
          <h2>Parking Passport</h2>
          {session ? <div className="saved"><strong>Car location saved</strong><div className="meta">Parkade C · Level 4<br />Manual capture · exact bay not claimed</div><div className="confidence" style={{ marginTop: 12 }}><span>Confidence</span><strong>100%</strong></div></div> : <div className="saved"><strong>No active parking session</strong><div className="meta">Save a location and Navigre keeps it on this device, including when you go offline.</div></div>}
          <div className="actions"><button className="action" onClick={saveCar}>Save My Car</button><button className="action secondary" onClick={routeToCar} disabled={!session}>Find My Car</button></div>
          <div className="meta">{message}</div>
          <div className="warning">TRUTH MODE: This V1 schematic does not pretend GPS can identify an exact indoor bay. Localization sources remain replaceable; navigation remains stable.</div>
        </aside>
      </section>
    </main>
  );
}
