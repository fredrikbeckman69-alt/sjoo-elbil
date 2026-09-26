import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  Search,
  Zap,
  Filter,
  LocateFixed,
  RotateCcw,
  Sparkles,
  Layers,
  BatteryCharging,
  Info,
  Loader2,
} from 'lucide-react';
import { ChargingStation } from '../types';
import {
  getChargingStations,
  getInitialChargingStations,
  getOperatorStats,
  getOperatorColor,
  POPULAR_OPERATORS,
} from '../services/chargingStations';

interface ChargingMapProps {
  onSelectStationAsDestination?: (nameOrAddress: string) => void;
}

export const ChargingMap: React.FC<ChargingMapProps> = ({ onSelectStationAsDestination }) => {
  const [stations, setStations] = useState<ChargingStation[]>(getInitialChargingStations());
  const loading = stations.length === 0;
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFastCharging, setOnlyFastCharging] = useState<boolean>(false);
  const [tileTheme, setTileTheme] = useState<'dark' | 'streets'>('dark');

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);

  // Load charging stations data (sync and fallback)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getChargingStations();
        if (isMounted && data && data.length > 0) {
          setStations(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Laddstationsfel:', err);
          // If already populated with initial stations, don't show error
          if (stations.length === 0) {
            setError(err.message || 'Kunde inte läsa in laddstationsdata.');
          }
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [stations.length]);

  // Compute operator statistics
  const operatorStats = useMemo(() => {
    return getOperatorStats(stations);
  }, [stations]);

  // Filter stations based on operator, search query, and fast charging
  const filteredStations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return stations.filter((station) => {
      // 1. Leverantör / Operatör
      if (selectedOperator !== 'ALL' && station.operator !== selectedOperator) {
        return false;
      }

      // 2. Snabbladdare (CCS eller effekt >= 50kW)
      if (onlyFastCharging) {
        const isFast = (station.maxPowerKw && station.maxPowerKw >= 50) || station.ccs;
        if (!isFast) return false;
      }

      // 3. Fritextsökning (stad, adress, namn, operatör)
      if (q) {
        const matchName = station.name.toLowerCase().includes(q);
        const matchCity = station.city ? station.city.toLowerCase().includes(q) : false;
        const matchStreet = station.street ? station.street.toLowerCase().includes(q) : false;
        const matchOp = station.operator.toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchStreet && !matchOp) {
          return false;
        }
      }

      return true;
    });
  }, [stations, selectedOperator, searchQuery, onlyFastCharging]);

  // Init Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Sweden center: [62.0, 15.5], zoom: 5
    const map = L.map(mapContainerRef.current, {
      center: [62.0, 15.5],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Canvas renderer for high performance with thousands of points
    const canvasRenderer = L.canvas({ padding: 0.5 });
    canvasRendererRef.current = canvasRenderer;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Tile layer: OpenStreetMap (clean, crisp, no watermarks)
    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    if (mapContainerRef.current) {
      mapContainerRef.current.classList.add('dark-map-tiles');
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map dark/light theme class
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (tileTheme === 'dark') {
      mapContainerRef.current.classList.add('dark-map-tiles');
    } else {
      mapContainerRef.current.classList.remove('dark-map-tiles');
    }
  }, [tileTheme]);

  // Render markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    const canvasRenderer = canvasRendererRef.current;
    if (!map || !layerGroup || !canvasRenderer) return;

    layerGroup.clearLayers();

    // Loop through filtered stations and add circle markers
    filteredStations.forEach((station) => {
      const color = getOperatorColor(station.operator);

      const marker = L.circleMarker([station.lat, station.lon], {
        renderer: canvasRenderer,
        radius: selectedOperator !== 'ALL' ? 7 : 5,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      // Construct popup HTML
      const locationText = [station.street, station.city].filter(Boolean).join(', ');
      const powerBadge = station.maxPowerKw
        ? `<span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">${station.maxPowerKw} kW</span>`
        : '';
      const capacityText = station.capacity
        ? `<div class="text-xs text-slate-300">Antal uttag / platser: <strong class="text-white">${station.capacity} st</strong></div>`
        : '';

      const plugs = [];
      if (station.ccs) plugs.push('<span class="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-semibold border border-cyan-800">CCS</span>');
      if (station.type2) plugs.push('<span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">Typ 2</span>');
      if (station.chademo) plugs.push('<span class="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-semibold border border-amber-800">CHAdeMO</span>');
      const plugsHtml = plugs.length > 0
        ? `<div class="flex flex-wrap gap-1 mt-1.5">${plugs.join('')}</div>`
        : '';

      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}`;

      const popupHtml = `
        <div class="p-3.5 max-w-xs text-slate-100">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-white shadow-sm" style="background-color: ${color}">
              ${station.operator}
            </span>
            ${powerBadge}
          </div>

          <h3 class="font-bold text-sm text-white leading-tight mb-1">
            ${station.name}
          </h3>

          ${locationText ? `<p class="text-xs text-slate-400 mb-2 flex items-center gap-1">📍 ${locationText}</p>` : ''}
          ${capacityText}
          ${plugsHtml}

          <div class="mt-3 pt-2.5 border-t border-slate-800 flex flex-col gap-1.5">
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow">
              <span>Navigera med Google Maps</span>
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>

            ${onSelectStationAsDestination ? `
              <button type="button" id="btn-calc-${station.id}"
                class="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition">
                <span>⚡ Använd i resekalkylatorn</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { minWidth: 240, maxWidth: 300 });

      // Handle custom click inside popup for "Använd i kalkylatorn"
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-calc-${station.id}`);
        if (btn && onSelectStationAsDestination) {
          btn.onclick = () => {
            const destTarget = station.city || station.street ? `${station.name}, ${station.city || station.street}` : station.name;
            onSelectStationAsDestination(destTarget);
          };
        }
      });

      layerGroup.addLayer(marker);
    });

    // Auto-fit bounds if a specific operator is selected with results
    if (selectedOperator !== 'ALL' && filteredStations.length > 0) {
      const bounds = L.latLngBounds(filteredStations.map((s) => [s.lat, s.lon]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [filteredStations, selectedOperator, onSelectStationAsDestination]);

  // Handle Locate User
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolokalisering stöds inte i din webbläsare.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current;
        if (!map) return;

        map.setView([latitude, longitude], 12);

        // Add a temporary blue pulse circle for current user position
        const userMarker = L.circleMarker([latitude, longitude], {
          radius: 9,
          fillColor: '#38bdf8',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map);

        userMarker.bindPopup('<div class="p-2 text-xs font-bold text-slate-200">📍 Din position</div>').openPopup();
      },
      (err) => {
        console.warn('Geolokalisering misslyckades:', err);
        alert('Kunde inte fastställa din position. Kontrollera platsbehörighet.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Reset filters
  const handleResetFilters = () => {
    setSelectedOperator('ALL');
    setSearchQuery('');
    setOnlyFastCharging(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([62.0, 15.5], 5);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Quick Controls Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Sveriges Laddstationskarta
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold font-mono-numbers">
                  {stations.length.toLocaleString('sv-SE')} stationer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Filtrera på din favoritleverantör eller sök efter stad, adress och snabbladdare
              </p>
            </div>
          </div>

          {/* Action buttons: Reset & Locate */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleLocateMe}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700/80 transition shadow-sm active:scale-95"
              title="Hitta min position via GPS"
            >
              <LocateFixed className="w-4 h-4 text-cyan-400" />
              <span>Min position</span>
            </button>

            <button
              type="button"
              onClick={() => setTileTheme((prev) => (prev === 'dark' ? 'streets' : 'dark'))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition active:scale-95"
              title="Växla karttema"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>{tileTheme === 'dark' ? 'Mörk karta' : 'Ljus karta'}</span>
            </button>

            {(selectedOperator !== 'ALL' || searchQuery || onlyFastCharging) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30 transition active:scale-95"
                title="Återställ alla filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nollställ</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Filter Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4">
          {/* Main Operator Selector Dropdown */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              Välj laddoperatör / leverantör
            </label>
            <div className="relative">
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="w-full appearance-none bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition shadow-inner"
              >
                <option value="ALL">
                  ⚡ Alla leverantörer ({stations.length.toLocaleString('sv-SE')} stationer)
                </option>
                {operatorStats.map((op) => (
                  <option key={op.name} value={op.name}>
                    {op.name} ({op.count} stationer)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search by City / Location */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Sök ort, adress eller plats
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="T.ex. Sälen, Göteborg, E4..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pl-9 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Fast Charger Toggle */}
          <div className="md:col-span-3 flex items-end">
            <button
              type="button"
              onClick={() => setOnlyFastCharging(!onlyFastCharging)}
              className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                onlyFastCharging
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <BatteryCharging className={`w-4 h-4 ${onlyFastCharging ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>Enbart Snabbladdare (HPC/CCS)</span>
            </button>
          </div>
        </div>

        {/* 3. Popular Operators Quick Chips */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Snabbval bland Sveriges största laddnätverk:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedOperator('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition active:scale-95 ${
                selectedOperator === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Alla
            </button>

            {POPULAR_OPERATORS.map((opName) => {
              const isSelected = selectedOperator === opName;
              const color = getOperatorColor(opName);
              const stat = operatorStats.find((s) => s.name === opName);
              const count = stat ? stat.count : 0;

              return (
                <button
                  key={opName}
                  type="button"
                  onClick={() => setSelectedOperator(isSelected ? 'ALL' : opName)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition active:scale-95 border ${
                    isSelected
                      ? 'bg-slate-800 text-white font-bold border-cyan-400 shadow-md ring-1 ring-cyan-400'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{opName}</span>
                  <span className="text-[10px] text-slate-400 font-mono-numbers">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-slate-300 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm font-semibold">Laddar Sveriges laddstationer...</p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute top-4 left-4 right-4 z-30 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-1 rounded bg-rose-500 text-white text-[11px] font-bold"
            >
              Ladda om
            </button>
          </div>
        )}

        {/* Live Filter Indicator Badge inside Map */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg text-xs text-white">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor:
                  selectedOperator !== 'ALL'
                    ? getOperatorColor(selectedOperator)
                    : '#10b981',
              }}
            />
            <span className="font-semibold">
              {selectedOperator !== 'ALL' ? selectedOperator : 'Alla nätverk'}
            </span>
            <span className="text-slate-400 font-mono-numbers">
              • {filteredStations.length.toLocaleString('sv-SE')} synliga
            </span>
          </div>
        </div>

        {/* The Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          className="w-full h-[580px] sm:h-[650px] lg:h-[720px] z-0"
        />

        {/* Bottom Legend Bar inside Map */}
        <div className="absolute bottom-3 left-3 right-12 z-10 pointer-events-none">
          <div className="inline-flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-md text-[11px] text-slate-400">
            <span className="text-slate-200 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Tips:
            </span>
            <span>Klicka på valfri laddstation för detaljer, ruttkalkyl och vägbeskrivning</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargingMap;
