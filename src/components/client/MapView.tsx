import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useGeolocation } from '../../hooks/useGeolocation';
import { usePublicServices } from '../../hooks/useServices';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function MapAutoFocus({
  me,
  targets,
}: {
  me: { latitude: number; longitude: number } | null;
  targets: Array<{ latitude: number; longitude: number }>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!me) return;

    // Focus to user and nearest services if available.
    if (targets.length > 0) {
      const pts: [number, number][] = [
        [me.latitude, me.longitude],
        ...targets.map((t) => [t.latitude, t.longitude] as [number, number]),
      ];
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
      return;
    }

    // Otherwise just zoom to user location.
    map.setView([me.latitude, me.longitude], 13, { animate: true });
  }, [map, me, targets]);

  return null;
}

function MapInvalidateOnResize({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const map = useMap();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const fix = () => {
      map.invalidateSize({ animate: false });
    };

    fix();
    requestAnimationFrame(() => {
      fix();
      requestAnimationFrame(fix);
    });

    const ro = new ResizeObserver(() => fix());
    ro.observe(el);

    window.addEventListener("resize", fix);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fix);
    };
  }, [map, containerRef]);

  return null;
}

function MapPanTo({
  value,
}: {
  value: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!value) return;
    map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 13), {
      animate: true,
    });
  }, [map, value]);
  return null;
}

export function MapView() {
  const [searchDraft, setSearchDraft] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [selectedBorough, setSelectedBorough] = useState('all');
  const mapShellRef = useRef<HTMLDivElement>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [panTarget, setPanTarget] = useState<{ latitude: number; longitude: number } | null>(null);

  const servicesQuery = usePublicServices({
    borough: selectedBorough,
    search: searchApplied,
  });

  const geo = useGeolocation({ enableHighAccuracy: true });
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  useEffect(() => {
    // Auto-request location on page open and gate map rendering on a real position.
    void geo.requestPermission().then((ok) => {
      if (!ok) return;
      void geo.getCurrentPosition().catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        // Permissions API isn't available everywhere; treat as unknown.
        if (!('permissions' in navigator)) return;
        const p = await navigator.permissions.query({ name: 'geolocation' });
        if (cancelled) return;
        setPermissionState((p.state as any) ?? 'unknown');
        p.onchange = () => {
          if (cancelled) return;
          setPermissionState((p.state as any) ?? 'unknown');
        };
      } catch {
        if (!cancelled) setPermissionState('unknown');
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const boroughs = useMemo(() => {
    const rows = servicesQuery.data ?? [];
    return Array.from(new Set(rows.map((s) => s.organization?.borough))).filter(Boolean) as string[];
  }, [servicesQuery.data]);

  const servicesWithDistance = useMemo(() => {
    const rows = (servicesQuery.data ?? []).filter(
      (s) =>
        s.latitude != null &&
        s.longitude != null &&
        (!onlyAvailable || s.is_available),
    );
    const pos = geo.position;
    if (!pos) return rows.map((s) => ({ s, meters: null as number | null }));
    const here = { lat: pos.latitude, lng: pos.longitude };
    return rows
      .map((s) => ({
        s,
        meters: haversineMeters(here, { lat: s.latitude as number, lng: s.longitude as number }),
      }))
      .sort((a, b) => (a.meters ?? 1e18) - (b.meters ?? 1e18));
  }, [geo.position, onlyAvailable, servicesQuery.data]);

  const hasResults = servicesWithDistance.length > 0;

  if (servicesQuery.isLoading) return <div className="py-20 text-center text-gray-500">Loading map...</div>;
  if (servicesQuery.isError) return <div className="py-20 text-center text-red-600">Failed to load services map.</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search services or organizations..."
            className="h-10 border border-gray-200 rounded-lg px-3 w-full"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchApplied(searchDraft.trim());
              }
            }}
          />
          <button
            type="button"
            onClick={() => setSearchApplied(searchDraft.trim())}
            className="h-10 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60 whitespace-nowrap"
            disabled={servicesQuery.isFetching}
          >
            {servicesQuery.isFetching ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchDraft("");
              setSearchApplied("");
            }}
            className="h-10 px-4 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 whitespace-nowrap"
            disabled={servicesQuery.isFetching}
          >
            Clear
          </button>
          <select
            value={selectedBorough}
            onChange={(e) => setSelectedBorough(e.target.value)}
            className="h-10 border border-gray-200 rounded-lg px-3 lg:w-56 bg-white"
          >
            <option value="all">All Boroughs</option>
            {boroughs.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
            />
            Only available services
          </label>
          <div className="flex-1" />
          <p className="text-sm text-gray-500">
            {geo.position
              ? `Location: ${geo.position.latitude.toFixed(4)}, ${geo.position.longitude.toFixed(4)}`
              : geo.error
                ? geo.error.message
                : permissionState === 'denied'
                  ? 'Location permission is blocked for this site.'
                  : permissionState === 'prompt'
                    ? 'Allow location access to view the map.'
                    : geo.loading
                      ? 'Locating…'
                      : 'Requesting location…'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            value={addressQuery}
            onChange={(e) => setAddressQuery(e.target.value)}
            placeholder="Search an address to jump the map (e.g. Times Square)"
            className="h-10 border border-gray-200 rounded-lg px-3 w-full"
          />
          <button
            type="button"
            disabled={addressLoading || !addressQuery.trim()}
            onClick={async () => {
              try {
                setAddressLoading(true);
                setAddressError(null);
                const q = encodeURIComponent(addressQuery.trim());
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
                  { headers: { 'Accept-Language': 'en' } },
                );
                if (!res.ok) throw new Error('Search failed');
                const json = (await res.json()) as any[];
                const first = json?.[0];
                if (!first) {
                  setAddressError('No results found.');
                  return;
                }
                const lat = Number(first.lat);
                const lon = Number(first.lon);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
                  setAddressError('Invalid coordinates returned.');
                  return;
                }
                setPanTarget({ latitude: lat, longitude: lon });
              } catch (e: any) {
                setAddressError(e?.message || 'Failed to search address.');
              } finally {
                setAddressLoading(false);
              }
            }}
            className="h-10 px-4 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 whitespace-nowrap"
          >
            {addressLoading ? 'Searching…' : 'Search location'}
          </button>
        </div>
        {addressError && <p className="text-sm text-red-600">{addressError}</p>}

        {!servicesQuery.isFetching && searchApplied && !hasResults && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
            No services found for “{searchApplied}”. Try a different search or clear filters.
          </div>
        )}
      </div>

      {!geo.position ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-gray-900">
            Enable location to view the map
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {geo.error
              ? geo.error.message
              : permissionState === 'denied'
                ? 'Location permission is blocked for this site. Please allow it in your browser settings and refresh.'
                : geo.loading
                  ? 'Locating…'
                  : 'We need your location to show nearby services.'}
          </p>
          {permissionState !== 'denied' && (
            <button
              type="button"
              className="mt-4 h-10 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
              disabled={!geo.supported || geo.loading}
              onClick={() => void geo.getCurrentPosition().catch(() => {})}
            >
              {geo.loading ? 'Locating…' : 'Retry location'}
            </button>
          )}
        </div>
      ) : (
        <div
          ref={mapShellRef}
          className="relative z-0 w-full min-w-0 h-[560px] rounded-xl border border-gray-200 overflow-hidden bg-gray-100 isolate"
        >
          <MapContainer
            center={[geo.position.latitude, geo.position.longitude]}
            zoom={13}
            className="relative z-0 h-full w-full min-h-0 rounded-xl"
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <MapInvalidateOnResize containerRef={mapShellRef} />
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <MapAutoFocus
              me={{ latitude: geo.position.latitude, longitude: geo.position.longitude }}
              targets={servicesWithDistance
                .slice(0, 10)
                .map(({ s }) => ({
                  latitude: s.latitude as number,
                  longitude: s.longitude as number,
                }))}
            />
            <MapPanTo value={panTarget} />

            <CircleMarker
              key="me"
              center={[geo.position.latitude, geo.position.longitude]}
              radius={10}
              pathOptions={{
                color: "#0D9488",
                fillColor: "#14B8A6",
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <p className="font-semibold">You are here</p>
              </Popup>
            </CircleMarker>

            {servicesWithDistance.slice(0, 80).map(({ s, meters }) => (
              <Marker
                key={s.id}
                position={[s.latitude as number, s.longitude as number]}
                icon={defaultIcon}
              >
                <Popup>
                  <div className="space-y-1 min-w-56">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-gray-600">
                      Organization: {s.organization?.name || "Organization"}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      Category: {String(s.category).replace("_", " ")}
                    </p>
                    <p className="text-xs text-gray-600">
                      Borough: {s.organization?.borough || "—"}
                    </p>
                    <p className="text-xs text-gray-600">Hours: {s.hours || "N/A"}</p>
                    {meters != null && (
                      <p className="text-xs text-teal-700 font-semibold">
                        {(meters / 1609.34).toFixed(1)} mi away
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
