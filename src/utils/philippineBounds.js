export const PH_BOUNDS = {
  minLat: 4.5,
  maxLat: 21.2,
  minLng: 116.5,
  maxLng: 126.6,
};

export const PH_LEAFLET_BOUNDS = [
  [PH_BOUNDS.minLat, PH_BOUNDS.minLng],
  [PH_BOUNDS.maxLat, PH_BOUNDS.maxLng],
];

export function isWithinPhilippines(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= PH_BOUNDS.minLat &&
    lat <= PH_BOUNDS.maxLat &&
    lng >= PH_BOUNDS.minLng &&
    lng <= PH_BOUNDS.maxLng
  );
}
