import React, { useState } from 'react';
import { AircraftInfo } from '../types/aviation.js';
import { AircraftVectorIcon } from './AircraftVectorIcon.tsx';
import { ZoomIn, ZoomOut, Compass, Navigation } from 'lucide-react';
import { calculateDistanceKm, kmToNm, calculateBearingDeg } from '../utils/geo.ts';

interface RadarScopeProps {
  userLocation: { lat: number; lon: number };
  closestAircraft: AircraftInfo | null;
  allAircraft: AircraftInfo[];
  selectedAircraft: AircraftInfo | null;
  onSelectAircraft: (ac: AircraftInfo) => void;
  radiusNm: number;
  onRadiusChange: (newRadius: number) => void;
}

export const RadarScope: React.FC<RadarScopeProps> = ({
  userLocation,
  closestAircraft,
  allAircraft,
  selectedAircraft,
  onSelectAircraft,
  radiusNm,
  onRadiusChange,
}) => {
  const [hoveredAircraft, setHoveredAircraft] = useState<AircraftInfo | null>(null);

  // Radar scope geometry
  const size = 520;
  const center = size / 2;
  const scopeRadius = center - 36;

  // Ring distances relative to radiusNm
  const rings = [0.25, 0.5, 0.75, 1.0].map((frac) => ({
    nm: Math.round(radiusNm * frac),
    r: scopeRadius * frac,
  }));

  // Azimuth ticks (every 30 degrees)
  const azimuths = [
    { deg: 0, label: '000° N' },
    { deg: 30, label: '030°' },
    { deg: 60, label: '060°' },
    { deg: 90, label: '090° E' },
    { deg: 120, label: '120°' },
    { deg: 150, label: '150°' },
    { deg: 180, label: '180° S' },
    { deg: 210, label: '210°' },
    { deg: 240, label: '240°' },
    { deg: 270, label: '270° W' },
    { deg: 300, label: '300°' },
    { deg: 330, label: '330°' },
  ];

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-xl flex flex-col items-center">
      {/* Scope Controls & Range Header */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800/60 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Tactical Airspace Radar</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono">True North Aligned</span>
        </div>

        {/* Range selectors */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 px-1.5">Range:</span>
          {[20, 40, 60, 100].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRadiusChange(r)}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                radiusNm === r
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}NM
            </button>
          ))}
        </div>
      </div>

      {/* Main Radar SVG Canvas */}
      <div className="relative w-full max-w-[520px] aspect-square flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full select-none"
        >
          <defs>
            {/* Phosphor sweep gradient */}
            <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
              <stop offset="60%" stopColor="rgba(6, 182, 212, 0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Scope Bezel */}
          <circle
            cx={center}
            cy={center}
            r={scopeRadius + 14}
            fill="#050811"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <circle
            cx={center}
            cy={center}
            r={scopeRadius}
            fill="#030712"
            stroke="rgba(6, 182, 212, 0.25)"
            strokeWidth="1.5"
          />

          {/* Concentric Range Rings */}
          {rings.map((ring) => (
            <g key={ring.nm}>
              <circle
                cx={center}
                cy={center}
                r={ring.r}
                fill="none"
                stroke="rgba(30, 41, 59, 0.8)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Range label */}
              <text
                x={center + 6}
                y={center - ring.r + 12}
                fill="rgba(148, 163, 184, 0.5)"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {ring.nm} NM
              </text>
            </g>
          ))}

          {/* Crosshairs */}
          <line
            x1={center - scopeRadius}
            y1={center}
            x2={center + scopeRadius}
            y2={center}
            stroke="rgba(30, 41, 59, 0.7)"
            strokeWidth="1"
          />
          <line
            x1={center}
            y1={center - scopeRadius}
            x2={center}
            y2={center + scopeRadius}
            stroke="rgba(30, 41, 59, 0.7)"
            strokeWidth="1"
          />

          {/* Azimuth tick labels */}
          {azimuths.map(({ deg, label }) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const textR = scopeRadius + 10;
            const tx = center + textR * Math.cos(rad);
            const ty = center + textR * Math.sin(rad) + 3;
            return (
              <text
                key={deg}
                x={tx}
                y={ty}
                textAnchor="middle"
                fill={deg % 90 === 0 ? '#38bdf8' : '#64748b'}
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fontWeight={deg % 90 === 0 ? 'bold' : 'normal'}
              >
                {label}
              </text>
            );
          })}

          {/* Rotating Radar Sweep Line */}
          <g className="animate-radar-sweep pointer-events-none">
            {/* Trailing wedge */}
            <path
              d={`M ${center} ${center} L ${center} ${center - scopeRadius} A ${scopeRadius} ${scopeRadius} 0 0 1 ${
                center + scopeRadius * Math.sin((38 * Math.PI) / 180)
              } ${center - scopeRadius * Math.cos((38 * Math.PI) / 180)} Z`}
              fill="url(#sweepGradient)"
            />
            {/* Leading ray */}
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - scopeRadius}
              stroke="#22d3ee"
              strokeWidth="1.5"
            />
          </g>

          {/* User's Center Location Beacon */}
          <g>
            <circle
              cx={center}
              cy={center}
              r="6"
              fill="rgba(6, 182, 212, 0.2)"
              className="animate-ping origin-center"
            />
            <circle cx={center} cy={center} r="3.5" fill="#38bdf8" />
            <circle cx={center} cy={center} r="1.5" fill="#ffffff" />
            <text
              x={center}
              y={center + 14}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              YOUR RADAR
            </text>
          </g>

          {/* Vector connection line to closest aircraft */}
          {closestAircraft && (
            (() => {
              const bearingRad = ((closestAircraft.bearingDeg - 90) * Math.PI) / 180;
              const distFrac = Math.min(1, closestAircraft.distanceNm / radiusNm);
              const targetX = center + distFrac * scopeRadius * Math.cos(bearingRad);
              const targetY = center + distFrac * scopeRadius * Math.sin(bearingRad);
              return (
                <line
                  x1={center}
                  y1={center}
                  x2={targetX}
                  y2={targetY}
                  stroke="rgba(6, 182, 212, 0.4)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              );
            })()
          )}

          {/* History Path Trail Polyline for Selected / Closest Aircraft */}
          {(() => {
            const targetAircraft = selectedAircraft || closestAircraft;
            if (!targetAircraft || !targetAircraft.trail || targetAircraft.trail.length === 0) return null;

            // Map each historical point in the trail to radar scope (x, y)
            const historicalCoords = targetAircraft.trail.map((p) => {
              const dKm = calculateDistanceKm(userLocation.lat, userLocation.lon, p.lat, p.lon);
              const dNm = kmToNm(dKm);
              const bDeg = calculateBearingDeg(userLocation.lat, userLocation.lon, p.lat, p.lon);
              const bRad = ((bDeg - 90) * Math.PI) / 180;
              const frac = Math.min(1.08, dNm / radiusNm);
              return {
                x: center + frac * scopeRadius * Math.cos(bRad),
                y: center + frac * scopeRadius * Math.sin(bRad),
              };
            });

            // Head of the trail is the current target position
            const headBearingRad = ((targetAircraft.bearingDeg - 90) * Math.PI) / 180;
            const headDistFrac = Math.min(1.08, targetAircraft.distanceNm / radiusNm);
            const headCoord = {
              x: center + headDistFrac * scopeRadius * Math.cos(headBearingRad),
              y: center + headDistFrac * scopeRadius * Math.sin(headBearingRad),
            };

            const fullPolyline = [...historicalCoords, headCoord];

            return (
              <g className="pointer-events-none">
                {/* Connecting Polyline */}
                {fullPolyline.length >= 2 && (
                  <polyline
                    points={fullPolyline.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                )}

                {/* Historical position breadcrumbs */}
                {historicalCoords.map((pt, idx) => {
                  const progress = (idx + 1) / (historicalCoords.length + 1);
                  const opacity = 0.25 + progress * 0.65;
                  const r = 2 + progress * 1.5;
                  return (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={r}
                      fill="#22d3ee"
                      opacity={opacity}
                    />
                  );
                })}
              </g>
            );
          })()}

          {/* Aircraft Blips and Data Tags */}
          {allAircraft.map((ac) => {
            const isClosest = closestAircraft?.icao24 === ac.icao24;
            const isSelected = selectedAircraft?.icao24 === ac.icao24;
            const bearingRad = ((ac.bearingDeg - 90) * Math.PI) / 180;
            const distFrac = Math.min(1.05, ac.distanceNm / radiusNm);
            const x = center + distFrac * scopeRadius * Math.cos(bearingRad);
            const y = center + distFrac * scopeRadius * Math.sin(bearingRad);

            // Velocity vector leader line (heading direction for 20px)
            const headingRad = ((ac.headingDeg - 90) * Math.PI) / 180;
            const vectorLen = Math.max(12, Math.min(28, (ac.speedKts / 500) * 24));
            const vx = x + vectorLen * Math.cos(headingRad);
            const vy = y + vectorLen * Math.sin(headingRad);

            return (
              <g
                key={ac.icao24}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => onSelectAircraft(ac)}
                onMouseEnter={() => setHoveredAircraft(ac)}
                onMouseLeave={() => setHoveredAircraft(null)}
              >
                {/* Velocity line */}
                <line
                  x1={x}
                  y1={y}
                  x2={vx}
                  y2={vy}
                  stroke={isClosest ? '#22d3ee' : '#64748b'}
                  strokeWidth="1.5"
                />

                {/* Target marker */}
                {isClosest ? (
                  // Closest aircraft glowing ring
                  <g>
                    <circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="4.5"
                      fill="#22d3ee"
                      filter="url(#glow)"
                    />
                    <circle cx={x} cy={y} r="2" fill="#ffffff" />
                  </g>
                ) : (
                  // Standard blip
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? '4.5' : '3'}
                    fill={isSelected ? '#38bdf8' : '#38bdf8'}
                    stroke={isSelected ? '#ffffff' : 'none'}
                    strokeWidth="1"
                  />
                )}

                {/* Avionics data tag label */}
                <g transform={`translate(${x + 7}, ${y - 4})`} className="pointer-events-none">
                  <rect
                    x="-2"
                    y="-8"
                    width="62"
                    height="18"
                    fill="rgba(3, 7, 18, 0.75)"
                    rx="2"
                    stroke={isClosest ? 'rgba(6, 182, 212, 0.4)' : 'rgba(30, 41, 59, 0.6)'}
                    strokeWidth="0.5"
                  />
                  <text
                    x="1"
                    y="-1"
                    fill={isClosest ? '#67e8f9' : '#f1f5f9'}
                    fontSize="7.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                  >
                    {ac.ident}
                  </text>
                  <text
                    x="1"
                    y="7"
                    fill="#94a3b8"
                    fontSize="6.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {Math.round(ac.altitudeFt / 100)} {ac.speedKts}k
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Hover inspection tooltip */}
        {hoveredAircraft && (
          <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-800 p-2.5 rounded-lg text-xs font-mono text-slate-300 pointer-events-none shadow-lg z-20">
            <div className="font-bold text-cyan-300">{hoveredAircraft.ident} · {hoveredAircraft.airline}</div>
            <div className="text-[11px] text-slate-400">
              {hoveredAircraft.aircraftModel} ({hoveredAircraft.aircraftType})
            </div>
            <div className="text-[11px] text-slate-400">
              Alt: {hoveredAircraft.altitudeFt.toLocaleString()} ft · Spd: {hoveredAircraft.speedKts} kts · Dist: {hoveredAircraft.distanceNm} NM
            </div>
          </div>
        )}
      </div>

      {/* Legend & Sector Status */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 w-full flex items-center justify-between text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Closest Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-slate-400">Airborne Traffic</span>
          </span>
        </div>
        <div>
          <span>Sweep Cycle: 4.0s</span>
        </div>
      </div>
    </div>
  );
};
