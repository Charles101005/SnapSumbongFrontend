import React, { useState, useCallback, useMemo, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { hazardMarkerIcon, reverseGeocode } from "../../../utils/leafletHelpers";
import { isWithinPhilippines, PH_LEAFLET_BOUNDS } from "../../../utils/philippineBounds";
import MapAutoResize from "../../../components/shared/MapAutoResize";
import AddressSuggest from "./AddressSuggest";
import "./PinLocation.css";

// Default Manila coordinates, used when no initial location is provided.
const DEFAULT_COORDS = [14.5818, 120.977];

function RecenterOnCoords({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(coords, map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords[0], coords[1]]);
  return null;
}

function ClickToPlaceMarker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Caps how far the user can zoom out: the deepest allowed zoom is the one
// where the whole Philippine bounding box still fits the current container.
// Recomputed on resize so it holds on both phones and wide desktops.
function LimitZoomToPhilippines() {
  const map = useMap();

  React.useEffect(() => {
    const phBounds = L.latLngBounds(PH_LEAFLET_BOUNDS);

    const updateMinZoom = () => {
      const size = map.getSize();
      if (size.x === 0 || size.y === 0) return;
      const zoom = map.getBoundsZoom(phBounds, true, L.point(24, 24));
      map.setMinZoom(zoom);
    };

    updateMinZoom();
    map.on("resize", updateMinZoom);
    return () => {
      map.off("resize", updateMinZoom);
    };
  }, [map]);

  return null;
}

export default function PinLocationPage({ initialLocation, onConfirm, onBack }) {
  const initialCoords = useMemo(
    () =>
      Array.isArray(initialLocation?.coords) && initialLocation.coords.length === 2
        ? initialLocation.coords
        : DEFAULT_COORDS,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [coords, setCoords] = useState(initialCoords);
  const [address, setAddress] = useState(
    initialLocation?.address || "Rizal Park, Ermita, Manila, 1000 Metro Manila"
  );
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [locateError, setLocateError] = useState("");
  const mapRef = useRef(null);

  // When explicitAddress is provided (a picked search suggestion), use it
  // directly and skip the reverse geocode so the chosen label isn't clobbered.
  const applyCoords = useCallback(async (lat, lng, explicitAddress) => {
    if (!isWithinPhilippines(lat, lng)) {
      setLocateError("Please pin a location within the Philippines.");
      return;
    }
    setLocateError("");
    setCoords([lat, lng]);
    if (explicitAddress) {
      setAddress(explicitAddress);
      return;
    }
    setIsResolvingAddress(true);
    const resolved = await reverseGeocode(lat, lng);
    setIsResolvingAddress(false);
    if (resolved) {
      setAddress(resolved);
    }
  }, []);

  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocateError("Geolocation is not supported on this device.");
      return;
    }

    setLocateError("");
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await applyCoords(latitude, longitude);
        setIsLocating(false);
      },
      () => {
        setLocateError("Couldn't get your location. Please allow location access or pin it manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    const { lat, lng } = marker.getLatLng();
    if (!isWithinPhilippines(lat, lng)) {
      // Leaflet already moved the marker visually, so snap it back to the
      // last valid position and surface the error.
      marker.setLatLng(coords);
      setLocateError("Please pin a location within the Philippines.");
      return;
    }
    applyCoords(lat, lng);
  };

  const handleMapClick = (lat, lng) => {
    applyCoords(lat, lng);
  };

  const handleConfirm = () => {
    // The API stores coordinates as DecimalField(decimal_places=6), so round
    // here rather than sending raw floats with 15+ decimal places (which the
    // backend rejects with a 400).
    const roundedLat = Number(coords[0].toFixed(6));
    const roundedLng = Number(coords[1].toFixed(6));

    if (!isWithinPhilippines(roundedLat, roundedLng)) {
      setLocateError("Please pin a location within the Philippines.");
      return;
    }

    onConfirm({
      coords: [roundedLat, roundedLng],
      latitude: roundedLat,
      longitude: roundedLng,
      address,
    });
  };

  return (
    <div className="pin-location-container">
      {/* Title & Subtitle */}
      <header className="pin-header">
        <h2>Pin the Location</h2>
        <p>Click the map, drag the pin, or use your GPS to pinpoint the hazard.</p>
      </header>

      {/* Interactive Map Wrapper */}
      <div className="pin-map-card">
        <div className="pin-map-viewport">
          <MapContainer
            center={coords}
            zoom={16}
            style={{ width: "100%", height: "100%" }}
            ref={mapRef}
            maxBounds={PH_LEAFLET_BOUNDS}
            maxBoundsViscosity={1.0}
          >
            <LimitZoomToPhilippines />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickToPlaceMarker onPick={handleMapClick} />
            <RecenterOnCoords coords={coords} />
            <Marker
              position={coords}
              draggable
              icon={hazardMarkerIcon}
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
            <MapAutoResize />
          </MapContainer>

          {/* Locate Me Control */}
          <div className="locate-control">
            <button
              type="button"
              className="locate-btn"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              title="Use my current location"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              {isLocating ? "Locating..." : "Use My Location"}
            </button>
          </div>
        </div>
      </div>

      {locateError && <p className="locate-error">{locateError}</p>}

      {/* Selected Location Details Card */}
      <div className="location-card">
        <div className="location-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
        </div>

        <div className="location-details">
          <span className="location-label">SELECTED LOCATION</span>
          {isEditingAddress ? (
            <AddressSuggest
              value={address}
              onChange={setAddress}
              onBlur={() => setIsEditingAddress(false)}
              onSelectOption={(option) =>
                applyCoords(option.lat, option.lon, option.label)
              }
              placeholder="Search for an address..."
              inputClassName="location-input"
              autoFocus
            />
          ) : (
            <div className="location-address">
              {isResolvingAddress ? "Resolving address..." : address}
            </div>
          )}
          <span className="location-coords">
            {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
          </span>
        </div>

        <button
          type="button"
          className="btn-edit-address"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsEditingAddress((editing) => !editing)}
        >
          {isEditingAddress ? "Done" : "Edit Address"}
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="pin-actions">
        <button type="button" className="btn-back" onClick={onBack}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>

        <button type="button" className="btn-confirm" onClick={handleConfirm}>
          Confirm
        </button>
      </div>
    </div>
  );
}