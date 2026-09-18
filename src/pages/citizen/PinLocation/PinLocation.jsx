import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { hazardMarkerIcon, reverseGeocode } from "../../../utils/leafletHelpers";
import MapAutoResize from "../../../components/shared/MapAutoResize";
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

  const applyCoords = useCallback(async (lat, lng) => {
    setCoords([lat, lng]);
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
          >
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
            <input
              type="text"
              className="location-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setIsEditingAddress(false)}
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
          onClick={() => setIsEditingAddress(!isEditingAddress)}
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