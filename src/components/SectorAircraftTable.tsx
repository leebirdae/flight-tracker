import React, { useState } from 'react';
import { AircraftInfo } from '../types/aviation.js';
import { Search, ArrowUpDown, ExternalLink, Signal, Eye } from 'lucide-react';
import { AircraftVectorIcon } from './AircraftVectorIcon.tsx';

interface SectorAircraftTableProps {
  aircraftList: AircraftInfo[];
  closestAircraft: AircraftInfo | null;
  selectedAircraft: AircraftInfo | null;
  onSelectAircraft: (ac: AircraftInfo) => void;
}

export const SectorAircraftTable: React.FC<SectorAircraftTableProps> = ({
  aircraftList,
  closestAircraft,
  selectedAircraft,
  onSelectAircraft,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'distance' | 'altitude' | 'speed' | 'rssi'>('distance');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = aircraftList.filter((ac) => {
    const term = searchTerm.toLowerCase();
    return (
      ac.ident.toLowerCase().includes(term) ||
      (ac.registration && ac.registration.toLowerCase().includes(term)) ||
      ac.airline.toLowerCase().includes(term) ||
      ac.aircraftType.toLowerCase().includes(term) ||
      ac.aircraftModel.toLowerCase().includes(term) ||
      ac.destination.code.toLowerCase().includes(term) ||
      ac.origin.code.toLowerCase().includes(term)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortField === 'distance') diff = a.distanceNm - b.distanceNm;
    else if (sortField === 'altitude') diff = a.altitudeFt - b.altitudeFt;
    else if (sortField === 'speed') diff = a.speedKts - b.speedKts;
    else if (sortField === 'rssi') diff = (a.rssi ?? -99) - (b.rssi ?? -99);
    return sortAsc ? diff : -diff;
  });

  const toggleSort = (field: 'distance' | 'altitude' | 'speed' | 'rssi') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rssi' ? false : true); // RSSI stronger is higher
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl mt-6">
      {/* Table Header and Search */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Local Receiver Airspace Sector</h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {aircraftList.length} transponders received by antenna · Sorted by proximity
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter callsign, tail, hex..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Table content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Flight / Tail</th>
              <th className="py-3 px-4">Aircraft Model</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('distance')}>
                <div className="flex items-center gap-1">
                  <span>Proximity</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('altitude')}>
                <div className="flex items-center gap-1">
                  <span>Altitude</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('speed')}>
                <div className="flex items-center gap-1">
                  <span>Speed</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('rssi')}>
                <div className="flex items-center gap-1">
                  <span>Signal</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Sky Angle</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sorted.map((ac) => {
              const isClosest = closestAircraft?.icao24 === ac.icao24;
              const isSelected = selectedAircraft?.icao24 === ac.icao24;

              return (
                <tr
                  key={ac.icao24}
                  onClick={() => onSelectAircraft(ac)}
                  className={`transition-colors cursor-pointer ${
                    isClosest
                      ? 'bg-cyan-950/30 hover:bg-cyan-900/30'
                      : isSelected
                      ? 'bg-slate-800/60 hover:bg-slate-800'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Flight & Tail */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <AircraftVectorIcon
                        headingDeg={ac.headingDeg}
                        size={20}
                        color={isClosest ? '#22d3ee' : '#94a3b8'}
                        category={ac.aircraftCategory}
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-white text-xs">
                          <span>{ac.ident}</span>
                          {isClosest && (
                            <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                              CLOSEST
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {ac.registration ? `Tail: ${ac.registration}` : ac.airline}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Aircraft Type */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono text-cyan-300 font-semibold">{ac.aircraftType}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{ac.aircraftModel}</div>
                  </td>

                  {/* Distance */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                    <div className="font-bold text-white">{ac.distanceNm} NM</div>
                    <div className="text-[11px] text-slate-500">{ac.distanceMiles} mi · {ac.distanceKm} km</div>
                  </td>

                  {/* Altitude */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                    <div className="text-white">{ac.altitudeFt.toLocaleString()} ft</div>
                    <div className="text-[11px] text-slate-500">FL{Math.round(ac.altitudeFt / 100)}</div>
                  </td>

                  {/* Airspeed */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                    <div className="text-white">{ac.speedKts} kts</div>
                    <div className="text-[11px] text-slate-500">{ac.speedMph} mph</div>
                  </td>

                  {/* Signal RSSI */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                    {ac.rssi !== undefined ? (
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <Signal className="w-3 h-3 text-cyan-400" />
                        <span>{ac.rssi} dB</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">--</span>
                    )}
                    {ac.messages && (
                      <div className="text-[11px] text-slate-500">{ac.messages} msgs</div>
                    )}
                  </td>

                  {/* Elevation Angle */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                    <div className="text-slate-200 flex items-center gap-1">
                      <span>{String(ac.bearingDeg).padStart(3, '0')}°</span>
                      <span className="text-cyan-400 font-bold">{ac.cardinalDirection}</span>
                    </div>
                    <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{ac.elevationAngleDeg}° up</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAircraft(ac);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-mono text-[11px]"
                    >
                      Track
                    </button>
                    {ac.tar1090Url && (
                      <a
                        href={ac.tar1090Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in local tar1090"
                        className="inline-block p-1 rounded bg-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
