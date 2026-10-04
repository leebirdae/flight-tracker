import React from 'react';
import { AircraftInfo } from '../types/aviation.js';
import { AircraftVectorIcon } from './AircraftVectorIcon.tsx';
import { 
  Compass, 
  ExternalLink, 
  Eye, 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Plane,
  Clock,
  Radio,
  Signal
} from 'lucide-react';

interface ClosestAircraftCardProps {
  aircraft: AircraftInfo | null;
  source: 'tar1090' | 'simulated';
}

export const ClosestAircraftCard: React.FC<ClosestAircraftCardProps> = ({
  aircraft,
  source,
}) => {
  if (!aircraft) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
        <Plane className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-200">Listening to ADS-B Frequencies</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-mono">
          Scanning 1090 MHz transponder frames from local tar1090 receiver...
        </p>
      </div>
    );
  }

  // Calculate Mach number approximation
  const speedSoundKts = Math.max(573, 661 - (aircraft.altitudeFt / 1000) * 2.4);
  const machNum = (aircraft.speedKts / speedSoundKts).toFixed(2);

  const getVerticalRateDisplay = () => {
    if (aircraft.verticalRateFpm > 100) {
      return (
        <span className="flex items-center text-emerald-400 gap-1 text-xs font-mono">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+{aircraft.verticalRateFpm} fpm</span>
        </span>
      );
    } else if (aircraft.verticalRateFpm < -100) {
      return (
        <span className="flex items-center text-amber-400 gap-1 text-xs font-mono">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{aircraft.verticalRateFpm} fpm</span>
        </span>
      );
    }
    return (
      <span className="flex items-center text-slate-400 gap-1 text-xs font-mono">
        <Minus className="w-3.5 h-3.5" />
        <span>Level Flight</span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
      {/* Kicker header & transponder metadata */}
      <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[11px]">Closest Transponder Target</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{aircraft.airline}</span>
          {aircraft.registration && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-cyan-200">Tail: {aircraft.registration}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          {aircraft.rssi !== undefined && (
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Signal className="w-3 h-3" />
              <span>{aircraft.rssi} dBFS</span>
            </span>
          )}
          <span>HEX: {aircraft.icao24.toUpperCase()}</span>
          {aircraft.squawk && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>SQK {aircraft.squawk}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Identity Banner */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white tabular-nums">
                {aircraft.ident}
              </h2>
              <span className="text-sm font-medium text-slate-400">
                {aircraft.callsign}
              </span>
            </div>

            {/* Aircraft Model and Category */}
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
              <span className="font-semibold text-cyan-300">{aircraft.aircraftModel}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400 text-xs font-mono">{aircraft.aircraftType}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{aircraft.aircraftCategory}</span>
            </div>
          </div>

          {/* Silhouette & Distance from user highlight */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
            <div className="w-12 h-12 rounded-lg bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center shrink-0">
              <AircraftVectorIcon
                headingDeg={aircraft.headingDeg}
                size={34}
                category={aircraft.aircraftCategory}
                color="#22d3ee"
              />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Proximity to Observer</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-white tabular-nums">
                  {aircraft.distanceNm}
                </span>
                <span className="text-xs font-mono text-cyan-400 uppercase">NM</span>
                <span className="text-xs text-slate-500 font-mono">
                  ({aircraft.distanceMiles} mi · {aircraft.distanceKm} km)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Route Progress Banner */}
        <div className="py-5 border-b border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Route Origin:</span>
              <span className="font-mono font-bold text-white text-sm">{aircraft.origin.code}</span>
              <span className="text-slate-400 hidden sm:inline">({aircraft.origin.city})</span>
            </div>
            <div className="flex items-center gap-1.5 text-right">
              <span className="text-slate-400 hidden sm:inline">Destination:</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">{aircraft.destination.code}</span>
              <span className="text-slate-400 hidden sm:inline">({aircraft.destination.city})</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${aircraft.routeProgressPct}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{aircraft.origin.name}</span>
            <span>{aircraft.routeProgressPct}% Estimated Track</span>
            <span>{aircraft.destination.name}</span>
          </div>
        </div>

        {/* Primary Avionics Telemetry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-b border-slate-800/60">
          {/* 1. Altitude */}
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/70">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="uppercase tracking-wider font-medium text-[11px]">Altitude</span>
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-white tabular-nums">
                {aircraft.altitudeFt.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-cyan-400">FT</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono">FL{Math.round(aircraft.altitudeFt / 100)} · {aircraft.altitudeM.toLocaleString()} m</span>
              {getVerticalRateDisplay()}
            </div>
          </div>

          {/* 2. Airspeed */}
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/70">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="uppercase tracking-wider font-medium text-[11px]">Groundspeed</span>
              <Plane className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-white tabular-nums">
                {aircraft.speedKts}
              </span>
              <span className="text-xs font-mono text-cyan-400">KTS</span>
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-500">
              <span>{aircraft.speedMph} mph · {aircraft.speedKmh} km/h · Mach {machNum}</span>
            </div>
          </div>

          {/* 3. Bearing & Direction */}
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/70">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="uppercase tracking-wider font-medium text-[11px]">Bearing from You</span>
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-white tabular-nums">
                {String(aircraft.bearingDeg).padStart(3, '0')}°
              </span>
              <span className="text-sm font-mono font-semibold text-cyan-400">{aircraft.cardinalDirection}</span>
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-500">
              <span>Aircraft Heading: {aircraft.headingDeg}°</span>
            </div>
          </div>

          {/* 4. Visual Spotting Angle */}
          <div className="bg-slate-950/50 p-4 rounded-lg border border-cyan-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="uppercase tracking-wider font-medium text-[11px] text-cyan-300">Look-Up Angle</span>
              <Eye className="w-3.5 h-3.5 text-cyan-300" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-cyan-200 tabular-nums">
                {aircraft.elevationAngleDeg}°
              </span>
              <span className="text-xs font-mono text-cyan-400">Above Horizon</span>
            </div>
            <div className="mt-1 text-[11px] font-mono text-cyan-400/80">
              <span>Look {aircraft.cardinalDirection} into the sky</span>
            </div>
          </div>
        </div>

        {/* Spotting Guide and Local tar1090 Link */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-slate-400 font-mono">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              {aircraft.estimatedTimeToCpaMin > 0 ? (
                <span>
                  Closest approach: <strong className="text-white font-mono">{aircraft.estimatedTimeToCpaMin} min</strong>
                </span>
              ) : (
                <span>Aircraft passing closest point of approach</span>
              )}
              {aircraft.messages !== undefined && (
                <span className="ml-2 text-slate-500">· {aircraft.messages} frames received</span>
              )}
              {aircraft.trail && aircraft.trail.length > 1 && (
                <span className="ml-2 text-cyan-400 font-mono">· {aircraft.trail.length}-pt history trail</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {aircraft.tar1090Url && (
              <a
                href={aircraft.tar1090Url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:text-white hover:bg-cyan-900/60 transition-colors font-medium text-xs whitespace-nowrap"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open in Local tar1090</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
