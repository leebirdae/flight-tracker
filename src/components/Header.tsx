import React from 'react';
import { Volume2, VolumeX, Radio, MapPin, RefreshCw, Antenna } from 'lucide-react';
import { ReceiverStatus } from '../types/aviation.js';

interface HeaderProps {
  activeView: 'radar' | 'map';
  setActiveView: (view: 'radar' | 'map') => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  receiverStatus?: ReceiverStatus;
  source: 'tar1090' | 'simulated';
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  audioEnabled,
  setAudioEnabled,
  onOpenSettings,
  onRefresh,
  isLoading,
  receiverStatus,
  source,
}) => {
  const isConnected = receiverStatus?.connected && source === 'tar1090';

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20 animate-pulse" />
          <span>AeroProximity</span>
        </a>

        {/* Zone 2: 4-6 clean text navigation links / view switcher */}
        <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('radar')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'radar'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Radar Scope</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('map')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'map'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Aviation Map</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Mute radar audio' : 'Enable ATC audio chime'}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              audioEnabled
                ? 'bg-slate-900 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh scan button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Scan tar1090 receiver"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* tar1090 Receiver Status & Config Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-2 whitespace-nowrap ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-slate-900 border-amber-500/30 text-slate-300 hover:bg-slate-850 hover:border-amber-500/50'
            }`}
          >
            <Antenna className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">tar1090 Receiver</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-pulse'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
