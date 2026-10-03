import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { ClosestAircraftCard } from './components/ClosestAircraftCard.tsx';
import { RadarScope } from './components/RadarScope.tsx';
import { AviationMap } from './components/AviationMap.tsx';
import { SectorAircraftTable } from './components/SectorAircraftTable.tsx';
import { LocalAdsbSettingsModal } from './components/LocalAdsbSettingsModal.tsx';
import { RadarDataResponse, AircraftInfo } from './types/aviation.js';
import { radarAudio } from './utils/audio.ts';
import { Antenna, MapPin, AlertCircle, Radio, Activity, ExternalLink } from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [activeView, setActiveView] = useState<'radar' | 'map'>('radar');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Observer coordinates
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; name?: string }>({
    lat: 37.6188,
    lon: -122.3754,
    name: 'San Francisco (SFO)',
  });
  const [isLocating, setIsLocating] = useState(false);
  const [radiusNm, setRadiusNm] = useState(40);

  // Local tar1090 receiver URL (defaults to http://localhost:8080)
  const [receiverUrl, setReceiverUrl] = useState<string>(() => {
    return localStorage.getItem('local_adsb_url') || 'http://localhost:8080';
  });

  // Telemetry data
  const [radarData, setRadarData] = useState<RadarDataResponse | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const prevClosestIdentRef = useRef<string | null>(null);

  // Fetch live closest airplane data from local tar1090 receiver via our backend
  const fetchRadarData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lon: userLocation.lon.toString(),
        radius: radiusNm.toString(),
        receiverUrl: receiverUrl.trim(),
      });

      const res = await fetch(`/api/aircraft/closest?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data: RadarDataResponse = await res.json();
      setRadarData(data);
      setErrorMsg(null);

      // Play audio chirp when closest aircraft changes or locks in
      if (data.closestAircraft) {
        if (prevClosestIdentRef.current !== data.closestAircraft.ident) {
          prevClosestIdentRef.current = data.closestAircraft.ident;
          radarAudio.playLockChirp();
        } else {
          radarAudio.playRadarPing();
        }
      }
    } catch (err: any) {
      console.error('Error fetching radar data:', err);
      setErrorMsg(err.message || 'Failed to connect to local tar1090 receiver');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [userLocation.lat, userLocation.lon, radiusNm, receiverUrl]);

  // Request browser geolocation
  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: 'My GPS Location',
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Try initial geolocation on load once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            name: 'My GPS Location',
          });
        },
        () => {
          // Fallback location already set
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // Sync audio enabled state
  useEffect(() => {
    radarAudio.setEnabled(audioEnabled);
  }, [audioEnabled]);

  // Fetch immediately on coordinates, radius, or receiverUrl change
  useEffect(() => {
    fetchRadarData(true);
  }, [fetchRadarData]);

  // Real-time polling loop (every 2.5 seconds for snappy local ADS-B reception)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRadarData(false);
    }, 2500);
    return () => clearInterval(timer);
  }, [fetchRadarData]);

  const handleSaveReceiverUrl = (url: string) => {
    setReceiverUrl(url);
    localStorage.setItem('local_adsb_url', url);
    fetchRadarData(true);
  };

  const activeAircraft = selectedAircraft || radarData?.closestAircraft || null;
  const isConnected = radarData?.receiver.connected && radarData?.source === 'tar1090';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Strict Top Bar Contract Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={() => fetchRadarData(true)}
        isLoading={isLoading}
        receiverStatus={radarData?.receiver}
        source={radarData?.source || 'simulated'}
      />

      {/* Telemetry Status Ribbon */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Observer Location */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-medium">{userLocation.name || 'Observer Radar Center'}</span>
              <span className="text-slate-500 font-mono">
                ({userLocation.lat.toFixed(4)}°, {userLocation.lon.toFixed(4)}°)
              </span>
            </button>

            <span aria-hidden="true" className="text-slate-700 hidden sm:inline">·</span>

            {/* Radar Radius */}
            <span className="text-slate-400 font-mono">
              Scan Radius: <strong className="text-slate-200">{radiusNm} NM</strong>
            </span>

            <span aria-hidden="true" className="text-slate-700 hidden sm:inline">·</span>

            {/* Total Air Traffic Count */}
            <span className="text-slate-400 font-mono">
              Tracked Transponders: <strong className="text-cyan-300">{radarData?.totalTracked ?? 0}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            {/* Receiver Connection State */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-slate-300">{receiverUrl}</span>
              {radarData?.receiver.latencyMs ? (
                <span className="text-slate-500">({radarData.receiver.latencyMs}ms)</span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      {/* Receiver Connection Notification if offline */}
      {!isConnected && (
        <div className="border-b border-amber-900/50 bg-amber-950/20 px-4 sm:px-6 py-2 text-xs text-amber-300 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Antenna className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Local tar1090 receiver at <strong className="font-mono">{receiverUrl}</strong> is not responding. Showing simulated traffic.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="underline hover:text-amber-100 font-medium shrink-0"
            >
              Configure Receiver
            </button>
          </div>
        </div>
      )}

      {/* Main Airspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dual Primary Zone: Closest Airplane Showcase (Left) + Tactical Radar / Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Closest Airplane Detailed Card */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4">
            <ClosestAircraftCard
              aircraft={activeAircraft}
              source={radarData?.source || 'simulated'}
            />

            {/* Quick Inspection Switcher if user selected another aircraft */}
            {selectedAircraft && radarData?.closestAircraft && selectedAircraft.icao24 !== radarData.closestAircraft.icao24 && (
              <div className="p-3 bg-slate-900/60 border border-cyan-800/40 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  Tracking target <strong className="text-cyan-300 font-mono">{selectedAircraft.ident}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAircraft(null)}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-mono transition-colors"
                >
                  Return to Closest ({radarData.closestAircraft.ident})
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Tactical Radar Scope OR Aviation Map */}
          <div className="lg:col-span-6 xl:col-span-6">
            {activeView === 'radar' ? (
              <RadarScope
                userLocation={userLocation}
                closestAircraft={radarData?.closestAircraft || null}
                allAircraft={radarData?.allAircraft || []}
                selectedAircraft={selectedAircraft}
                onSelectAircraft={(ac) => setSelectedAircraft(ac)}
                radiusNm={radiusNm}
                onRadiusChange={(r) => setRadiusNm(r)}
              />
            ) : (
              <AviationMap
                userLocation={userLocation}
                closestAircraft={radarData?.closestAircraft || null}
                allAircraft={radarData?.allAircraft || []}
                selectedAircraft={selectedAircraft}
                onSelectAircraft={(ac) => setSelectedAircraft(ac)}
                radiusNm={radiusNm}
              />
            )}
          </div>
        </div>

        {/* Airspace Sector Aircraft Table */}
        <SectorAircraftTable
          aircraftList={radarData?.allAircraft || []}
          closestAircraft={radarData?.closestAircraft || null}
          selectedAircraft={selectedAircraft}
          onSelectAircraft={(ac) => setSelectedAircraft(ac)}
        />
      </main>

      {/* Local ADS-B / tar1090 Settings & Diagnostics Modal */}
      <LocalAdsbSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        receiverUrl={receiverUrl}
        onSaveReceiverUrl={handleSaveReceiverUrl}
        userLat={userLocation.lat}
        userLon={userLocation.lon}
        onUpdateLocation={(lat, lon, name) => {
          setUserLocation({ lat, lon, name });
          setIsSettingsOpen(false);
        }}
        onRequestGeolocation={handleRequestGeolocation}
        isLocating={isLocating}
        currentReceiverStatus={radarData?.receiver}
      />

      {/* Quiet, Clean Editorial Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">AeroProximity</span>
            <span aria-hidden="true">·</span>
            <span>Local ADS-B Receiver & Closest Aircraft Spotter</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Integrated with tar1090 / readsb / dump1090</span>
            <a
              href="https://github.com/wiedehopf/tar1090"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              <span>tar1090 GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
