import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AircraftInfo } from '../types/aviation.js';

interface AviationMapProps {
  userLocation: { lat: number; lon: number };
  closestAircraft: AircraftInfo | null;
  allAircraft: AircraftInfo[];
  selectedAircraft: AircraftInfo | null;
  onSelectAircraft: (ac: AircraftInfo) => void;
  radiusNm: number;
}

export const AviationMap: React.FC<AviationMapProps> = ({
  userLocation,
  closestAircraft,
  allAircraft,
  selectedAircraft,
  onSelectAircraft,
  radiusNm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Helper to build CartoDB tile URL with optional API key
  const getTileUrl = (apiKey?: string) => {
    const cleanKey = (apiKey || '').trim();
    if (cleanKey) {
      return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(cleanKey)}`;
    }
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lon],
      zoom: 9,
      zoomControl: true,
      attributionControl: true,
    });

    // Check for compile-time or client environment variable
    const initialApiKey = (import.meta.env.VITE_CARTODB_API_KEY as string | undefined) || '';
    const initialUrl = getTileUrl(initialApiKey);

    // Dark CartoDB basemap tiles for avionics tactical look
    const tileLayer = L.tileLayer(initialUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Also fetch runtime .env CARTODB_API_KEY from server /api/config
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => {
        if (cfg?.cartodbApiKey && cfg.cartodbApiKey.trim() !== initialApiKey.trim()) {
          const runtimeUrl = getTileUrl(cfg.cartodbApiKey);
          tileLayer.setUrl(runtimeUrl);
        }
      })
      .catch(() => {
        // Fallback to default public basemap
      });

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center and markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. User Location marker and radius ring
    const radiusMeters = radiusNm * 1852;
    L.circle([userLocation.lat, userLocation.lon], {
      radius: radiusMeters,
      color: '#0ea5e9',
      weight: 1,
      fillColor: '#0ea5e9',
      fillOpacity: 0.04,
      dashArray: '4 4',
    }).addTo(layerGroup);

    // User pin
    const userIcon = L.divIcon({
      className: 'custom-user-icon',
      html: `
        <div style="position: relative; width: 24px; height: 24px; transform: translate(-50%, -50%);">
          <div style="position: absolute; inset: 0; background: rgba(56, 189, 248, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 4px; background: #38bdf8; border: 2px solid #ffffff; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
      .bindTooltip('Your Location', { permanent: false, direction: 'top', className: 'bg-slate-900 text-white font-mono text-xs' })
      .addTo(layerGroup);

    // 2. Flight lines and Aircraft markers
    allAircraft.forEach((ac) => {
      const isClosest = closestAircraft?.icao24 === ac.icao24;
      const isSelected = selectedAircraft?.icao24 === ac.icao24;
      const color = isClosest ? '#22d3ee' : '#38bdf8';

      // Closest connection line
      if (isClosest) {
        L.polyline(
          [
            [userLocation.lat, userLocation.lon],
            [ac.lat, ac.lon],
          ],
          {
            color: '#22d3ee',
            weight: 1.5,
            dashArray: '5 5',
            opacity: 0.7,
          }
        ).addTo(layerGroup);

        // Optional flight route line from origin to destination if coordinates available
        if (ac.origin && ac.destination && ac.origin.lat && ac.destination.lat) {
          L.polyline(
            [
              [ac.origin.lat, ac.origin.lon],
              [ac.lat, ac.lon],
              [ac.destination.lat, ac.destination.lon],
            ],
            {
              color: 'rgba(148, 163, 184, 0.35)',
              weight: 1,
              dashArray: '3 6',
            }
          ).addTo(layerGroup);
        }
      }

      // Aircraft DivIcon
      const planeIcon = L.divIcon({
        className: 'custom-plane-icon',
        html: `
          <div style="position: relative; width: 34px; height: 34px; transform: translate(-50%, -50%); cursor: pointer;">
            ${
              isClosest
                ? `<div style="position: absolute; inset: -4px; border: 1.5px dashed #22d3ee; border-radius: 50%;"></div>`
                : ''
            }
            <div style="transform: rotate(${ac.headingDeg}deg); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
              <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
                <path d="M32 5 C33.2 5 34.5 7.5 34.5 15 L34.5 24 L58 37 L58 40.5 L34.5 34.5 L34.5 50 L42 56 L42 59 L32 56 L22 59 L22 56 L29.5 50 L29.5 34.5 L6 40.5 L6 37 L29.5 24 L29.5 15 C29.5 7.5 30.8 5 32 5 Z" fill="${color}" />
              </svg>
            </div>
            <div style="position: absolute; left: 34px; top: 0; background: rgba(3, 7, 18, 0.85); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 3px; padding: 1px 4px; font-family: monospace; font-size: 10px; color: ${
              isClosest ? '#67e8f9' : '#e2e8f0'
            }; white-space: nowrap; pointer-events: none;">
              ${ac.ident} ${Math.round(ac.altitudeFt / 100)}FL
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([ac.lat, ac.lon], { icon: planeIcon });
      marker.on('click', () => onSelectAircraft(ac));
      marker.addTo(layerGroup);
    });

    // 3. Historical trail polyline for selected / closest aircraft
    const targetAircraft = selectedAircraft || closestAircraft;
    if (targetAircraft && targetAircraft.trail && targetAircraft.trail.length > 0) {
      const latLngs: [number, number][] = targetAircraft.trail.map((p) => [p.lat, p.lon]);

      // Ensure the aircraft's current position is connected at the head
      const lastPoint = targetAircraft.trail[targetAircraft.trail.length - 1];
      if (Math.abs(lastPoint.lat - targetAircraft.lat) > 0.00008 || Math.abs(lastPoint.lon - targetAircraft.lon) > 0.00008) {
        latLngs.push([targetAircraft.lat, targetAircraft.lon]);
      }

      if (latLngs.length >= 2) {
        L.polyline(latLngs, {
          color: '#06b6d4',
          weight: 3,
          opacity: 0.85,
          dashArray: '5 4',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layerGroup);
      }

      // Render historical breadcrumb dots with graduated fading
      targetAircraft.trail.forEach((p, idx) => {
        const progress = (idx + 1) / (targetAircraft.trail!.length + 1);
        const opacity = 0.25 + progress * 0.65;
        L.circleMarker([p.lat, p.lon], {
          radius: 3.5,
          color: '#0891b2',
          fillColor: '#22d3ee',
          fillOpacity: opacity,
          weight: 1.5,
        })
          .bindTooltip(
            `${targetAircraft.ident} Trail (${idx + 1}/5)${p.altitudeFt ? ` · ${p.altitudeFt.toLocaleString()} ft` : ''}`,
            { className: 'bg-slate-900 text-cyan-300 font-mono text-[10px]' }
          )
          .addTo(layerGroup);
      });
    }
  }, [userLocation, closestAircraft, allAircraft, selectedAircraft, radiusNm]);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl flex flex-col h-[520px]">
      <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-200">Aviation Navigation Chart</span>
        <span className="text-slate-400 font-mono">Real-time GPS / ADS-B Overlay</span>
      </div>
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />
    </div>
  );
};
