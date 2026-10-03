import React, { useState } from 'react';
import { X, Radio, CheckCircle2, AlertTriangle, MapPin, ExternalLink, HardDrive, RefreshCw, Cpu } from 'lucide-react';
import { ReceiverStatus } from '../types/aviation.js';

interface LocalAdsbSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverUrl: string;
  onSaveReceiverUrl: (url: string) => void;
  userLat: number;
  userLon: number;
  onUpdateLocation: (lat: number, lon: number, name?: string) => void;
  onRequestGeolocation: () => void;
  isLocating: boolean;
  currentReceiverStatus?: ReceiverStatus;
}

const RECEIVER_PRESETS = [
  { label: 'localhost:8080', url: 'http://localhost:8080' },
  { label: '127.0.0.1:8080', url: 'http://127.0.0.1:8080' },
  { label: 'adsb.local:8080', url: 'http://adsb.local:8080' },
  { label: 'raspberrypi.local:8080', url: 'http://raspberrypi.local:8080' },
  { label: 'localhost:80', url: 'http://localhost' },
];

const CITY_PRESETS = [
  { name: 'San Francisco (SFO)', lat: 37.6188, lon: -122.3754 },
  { name: 'New York (JFK)', lat: 40.6413, lon: -73.7781 },
  { name: 'Los Angeles (LAX)', lat: 33.9416, lon: -118.4085 },
  { name: 'Chicago (ORD)', lat: 41.9742, lon: -87.9073 },
  { name: 'London (LHR)', lat: 51.4700, lon: -0.4543 },
  { name: 'Tokyo (HND)', lat: 35.5494, lon: 139.7798 },
];

export const LocalAdsbSettingsModal: React.FC<LocalAdsbSettingsModalProps> = ({
  isOpen,
  onClose,
  receiverUrl,
  onSaveReceiverUrl,
  userLat,
  userLon,
  onUpdateLocation,
  onRequestGeolocation,
  isLocating,
  currentReceiverStatus,
}) => {
  const [urlInput, setUrlInput] = useState(receiverUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ReceiverStatus | null>(null);
  const [customLat, setCustomLat] = useState(userLat.toString());
  const [customLon, setCustomLon] = useState(userLon.toString());

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const cleanUrl = urlInput.trim();
      const res = await fetch(`/api/receiver/status?receiverUrl=${encodeURIComponent(cleanUrl)}`);
      const data: ReceiverStatus = await res.json();
      setTestResult(data);

      if (data.connected) {
        onSaveReceiverUrl(cleanUrl);
      }
    } catch (err: any) {
      setTestResult({
        connected: false,
        url: urlInput,
        latencyMs: 0,
        aircraftCount: 0,
        error: err.message || 'Network request failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleApplyLocation = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      onUpdateLocation(lat, lon, 'Custom Coordinates');
    }
  };

  const handleUseReceiverGps = (rLat: number, rLon: number) => {
    setCustomLat(rLat.toString());
    setCustomLon(rLon.toString());
    onUpdateLocation(rLat, rLon, 'Receiver Antenna GPS');
  };

  const activeStatus = testResult || currentReceiverStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Local ADS-B Receiver (tar1090)</h2>
              <p className="text-[11px] text-slate-400 font-mono">readsb · dump1090-fa · RTL-SDR</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Receiver URL Configuration */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
            Local tar1090 Web Address / IP
          </label>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Enter the URL of your local tar1090 or readsb installation. Our backend auto-detects <code className="text-cyan-300 font-mono">/data/aircraft.json</code> and <code className="text-cyan-300 font-mono">/tar1090/data/aircraft.json</code>.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setTestResult(null);
              }}
              placeholder="http://localhost:8080"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-500">Presets:</span>
            {RECEIVER_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setUrlInput(p.url);
                  setTestResult(null);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                  urlInput === p.url
                    ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Test Status Banner */}
          {activeStatus && (
            <div
              className={`mt-4 p-4 rounded-xl border text-xs ${
                activeStatus.connected
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {activeStatus.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Connected to tar1090 Receiver ({activeStatus.latencyMs}ms latency)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Receiver Unreachable at {activeStatus.url}</span>
                  </>
                )}
              </div>

              {activeStatus.connected ? (
                <div className="mt-2 space-y-1 text-[11px] font-mono text-emerald-300/90">
                  <div>Active Endpoint: {activeStatus.activeEndpoint}</div>
                  <div>Live Aircraft Received: {activeStatus.aircraftCount} planes</div>
                  {activeStatus.totalMessages && (
                    <div>Transponder Messages: {activeStatus.totalMessages.toLocaleString()} frames</div>
                  )}
                  {activeStatus.receiverLat && activeStatus.receiverLon && (
                    <div className="flex items-center justify-between pt-1">
                      <span>
                        Antenna GPS: {activeStatus.receiverLat.toFixed(4)}°, {activeStatus.receiverLon.toFixed(4)}°
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUseReceiverGps(activeStatus.receiverLat!, activeStatus.receiverLon!)}
                        className="px-2 py-0.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-[10px]"
                      >
                        Set as Radar Center
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-amber-300/80 leading-relaxed">
                  <p>{activeStatus.error || 'Ensure your RTL-SDR dongle is plugged in and readsb/tar1090 is serving HTTP.'}</p>
                  <p className="mt-1 text-slate-400">
                    While offline, AeroProximity will display realistic simulated airspace traffic around your chosen observer location.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Observer Radar Coordinates */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Observer Location (Radar Center)
            </label>
            <button
              type="button"
              onClick={onRequestGeolocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 transition-colors font-mono"
            >
              <MapPin className="w-3 h-3" />
              <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>

          {/* Quick Hub Presets */}
          <div className="mb-3">
            <span className="text-[11px] text-slate-400 font-mono block mb-1.5">Quick Teleport:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CITY_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setCustomLat(p.lat.toString());
                    setCustomLon(p.lon.toString());
                    onUpdateLocation(p.lat, p.lon, p.name);
                  }}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[11px] text-slate-300 hover:text-white transition-colors truncate text-left"
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate manual input */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1">Latitude:</span>
              <input
                type="text"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1">Longitude:</span>
              <input
                type="text"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={handleApplyLocation}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded transition-colors"
            >
              Apply Coordinates
            </button>
          </div>
        </div>

        {/* Modal close */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <a
            href="https://github.com/wiedehopf/tar1090"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1"
          >
            <span>tar1090 documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
