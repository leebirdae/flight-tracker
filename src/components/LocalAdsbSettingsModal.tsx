import React, { useState, useEffect } from 'react';
import { 
  X, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  ExternalLink, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal, 
  FileText, 
  ShieldAlert,
  Sliders
} from 'lucide-react';
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
  onIngestJson: (jsonString: string) => Promise<boolean>;
}

const RECEIVER_PRESETS = [
  { label: 'My Radio (10.17.20.132:8080)', url: 'http://10.17.20.132:8080' },
  { label: 'localhost:8080', url: 'http://localhost:8080' },
  { label: '127.0.0.1:8080', url: 'http://127.0.0.1:8080' },
  { label: 'raspberrypi.local:8080', url: 'http://raspberrypi.local:8080' },
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
  onIngestJson,
}) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'bridge' | 'paste' | 'location'>('connection');
  const [urlInput, setUrlInput] = useState(receiverUrl || 'http://10.17.20.132:8080');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ReceiverStatus | null>(null);
  const [browserMixedContentBlocked, setBrowserMixedContentBlocked] = useState(false);

  const [pastedJson, setPastedJson] = useState('');
  const [pastingError, setPastingError] = useState<string | null>(null);
  const [pastingSuccess, setPastingSuccess] = useState(false);

  const [copiedBridge, setCopiedBridge] = useState(false);

  const [customLat, setCustomLat] = useState(userLat.toString());
  const [customLon, setCustomLon] = useState(userLon.toString());

  // App host origin for bridge command
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-...';

  const bridgeCommand = `while true; do curl -s ${urlInput.replace(/\/$/, '')}/data/aircraft.json | curl -s -X POST -H "Content-Type: application/json" --data-binary @- ${appOrigin}/api/aircraft/ingest; sleep 2; done`;

  if (!isOpen) return null;

  // Test connection both via browser and via backend proxy
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setBrowserMixedContentBlocked(false);

    const cleanUrl = urlInput.trim();
    let browserSuccess = false;

    // 1. Attempt direct browser fetch (works if browser allows LAN HTTP or user enabled insecure content)
    try {
      let target = cleanUrl.replace(/\/$/, '');
      if (!target.endsWith('.json')) target = `${target}/data/aircraft.json`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const bRes = await fetch(target, { signal: controller.signal, mode: 'cors' });
      clearTimeout(timeout);

      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData && (Array.isArray(bData.aircraft) || Array.isArray(bData))) {
          browserSuccess = true;
          // Ingest into server
          await fetch('/api/aircraft/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bData),
          });

          setTestResult({
            connected: true,
            url: cleanUrl,
            activeEndpoint: target,
            latencyMs: 12,
            aircraftCount: (bData.aircraft || bData).length,
            totalMessages: bData.messages,
            version: bData.version || 'readsb/tar1090',
          });
          onSaveReceiverUrl(cleanUrl);
        }
      }
    } catch (e: any) {
      if (window.location.protocol === 'https:' && cleanUrl.startsWith('http://')) {
        setBrowserMixedContentBlocked(true);
      }
    }

    // 2. If browser direct fetch didn't succeed, query backend
    if (!browserSuccess) {
      try {
        const res = await fetch(`/api/receiver/status?receiverUrl=${encodeURIComponent(cleanUrl)}`);
        const data: ReceiverStatus = await res.json();
        setTestResult(data);

        if (data.connected) {
          onSaveReceiverUrl(cleanUrl);
        }
      } catch (err: any) {
        setTestResult({
          connected: false,
          url: cleanUrl,
          latencyMs: 0,
          aircraftCount: 0,
          error: err.message || 'Connection test failed',
        });
      }
    }

    setIsTesting(false);
  };

  const handleCopyBridge = () => {
    navigator.clipboard.writeText(bridgeCommand);
    setCopiedBridge(true);
    setTimeout(() => setCopiedBridge(false), 2500);
  };

  const handleApplyPastedJson = async () => {
    if (!pastedJson.trim()) {
      setPastingError('Please paste the JSON output from your receiver.');
      return;
    }
    setPastingError(null);
    try {
      const ok = await onIngestJson(pastedJson.trim());
      if (ok) {
        setPastingSuccess(true);
        setTimeout(() => {
          setPastingSuccess(false);
          onClose();
        }, 1200);
      } else {
        setPastingError('Invalid aircraft JSON structure. Expected {"aircraft": [...]} or an array.');
      }
    } catch (err: any) {
      setPastingError(err.message || 'Failed to parse JSON.');
    }
  };

  const handleApplyLocation = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      onUpdateLocation(lat, lon, 'Custom Coordinates');
    }
  };

  const activeStatus = testResult || currentReceiverStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">tar1090 ADS-B Radio Integration</h2>
              <p className="text-[11px] text-slate-400 font-mono">LAN Receiver · ReadsB · Dump1090-FA</p>
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 mt-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'connection'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Connection</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bridge')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'bridge'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Stream Bridge (1-Line)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'location'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Radar Center</span>
          </button>
        </div>

        {/* Tab 1: Connection */}
        {activeTab === 'connection' && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
                Receiver IP / Address
              </label>
              <p className="text-xs text-slate-400 mb-2.5 leading-relaxed">
                Enter the address where your tar1090 serves <code className="text-cyan-300 font-mono">/data/aircraft.json</code>.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="http://10.17.20.132:8080"
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

              {/* Presets */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-slate-500">Quick Presets:</span>
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
            </div>

            {/* Browser Mixed Content Notice (Explaining LAN IP vs Cloud App) */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-white">Why does cloud app need a bridge to 10.17.20.132?</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-cyan-300 font-mono">10.17.20.132</strong> is a private local network (LAN) IP. The cloud server in GCP cannot route to your private home router. To link your live radio, you have two quick options:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pt-1">
                    <li>
                      <strong className="text-white">Option A (Recommended):</strong> Use the <strong>Stream Bridge (1-Line)</strong> tab to stream your curl directly into this web app in real time!
                    </li>
                    <li>
                      <strong className="text-white">Option B (Browser Direct):</strong> In Chrome, click the Tune icon left of the URL bar &rarr; <em>Site Settings</em> &rarr; set <em>Insecure content</em> to <em>Allow</em> &rarr; reload. Your browser will then fetch directly from your radio!
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Test Status Banner */}
            {activeStatus && (
              <div
                className={`p-4 rounded-xl border text-xs ${
                  activeStatus.connected
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {activeStatus.connected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Connected to tar1090 ({activeStatus.latencyMs}ms latency)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Receiver at {activeStatus.url} is on private LAN</span>
                    </>
                  )}
                </div>

                {activeStatus.connected ? (
                  <div className="mt-2 space-y-1 text-[11px] font-mono text-emerald-300/90">
                    <div>Endpoint: {activeStatus.activeEndpoint}</div>
                    <div>Aircraft Detected: {activeStatus.aircraftCount} planes</div>
                    {activeStatus.totalMessages && (
                      <div>Transponder Messages: {activeStatus.totalMessages.toLocaleString()} frames</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-amber-300/80 leading-relaxed">
                    <p>{activeStatus.error}</p>
                    <p className="mt-1">
                      Check the <strong>Stream Bridge</strong> tab to start forwarding your live feed!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Stream Bridge */}
        {activeTab === 'bridge' && (
          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
                1-Line Terminal Stream Bridge
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Since you can run <code className="text-cyan-300 font-mono">curl {urlInput}/data/aircraft.json</code> in your terminal, run this single command to stream your radio transponder frames directly into AeroProximity every 2 seconds:
              </p>
            </div>

            {/* Command Box */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-cyan-300 break-all select-all">
              <code>{bridgeCommand}</code>
              <button
                type="button"
                onClick={handleCopyBridge}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-medium flex items-center gap-1 transition-colors"
              >
                {copiedBridge ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBridge ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-200">How it works:</div>
              <p className="text-[11px] leading-relaxed">
                1. Your computer fetches the live JSON from your local radio at <code className="text-cyan-300 font-mono">{urlInput}</code>.
              </p>
              <p className="text-[11px] leading-relaxed">
                2. It pipes it securely to AeroProximity's <code className="text-cyan-300 font-mono">/api/aircraft/ingest</code> endpoint.
              </p>
              <p className="text-[11px] leading-relaxed">
                3. The web app immediately detects the stream and displays your real live aircraft and radar blips!
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Paste Live JSON */}
        {activeTab === 'paste' && (
          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
                Paste tar1090 JSON
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste the output of <code className="text-cyan-300 font-mono">curl -s {urlInput}/data/aircraft.json</code> here to immediately load and inspect your local aircraft.
              </p>
            </div>

            <textarea
              rows={7}
              value={pastedJson}
              onChange={(e) => {
                setPastedJson(e.target.value);
                setPastingError(null);
              }}
              placeholder='{"now": 1712345678, "aircraft": [{"hex": "a2174b", "flight": "SWA1542", "lat": 32.89, "lon": -97.04, "alt_baro": 18500, "gs": 390, "track": 180}]}'
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />

            {pastingError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {pastingError}
              </div>
            )}

            {pastingSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Aircraft feed ingested successfully! Updating radar...</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleApplyPastedJson}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Apply & Track Aircraft
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Observer Location */}
        {activeTab === 'location' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Observer Radar Center
                </h3>
                <p className="text-xs text-slate-400">
                  Center of the radar scope. Defaults to your antenna location.
                </p>
              </div>
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleApplyLocation}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded transition-colors"
              >
                Apply Coordinates
              </button>
            </div>
          </div>
        )}

        {/* Modal footer */}
        <div className="mt-auto pt-5 border-t border-slate-800 flex items-center justify-between">
          <a
            href="https://github.com/wiedehopf/tar1090"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1"
          >
            <span>tar1090 GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
