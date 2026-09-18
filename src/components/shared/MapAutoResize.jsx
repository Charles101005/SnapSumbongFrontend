import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Leaflet measures its container once, on mount, to lay out map tiles.
// If that container is inside a CSS grid/flex layout that hasn't reached
// its final size yet (e.g. a responsive card that reflows right after the
// map mounts, or a map that mounts while its parent is still 0px during a
// route/tab switch), Leaflet locks in the wrong tile positions — the map
// then renders oversized/offset and visually "floats" over the rest of the
// page instead of staying confined to its small preview box. Calling
// map.invalidateSize() after layout settles, and again on any later resize
// (breakpoint change, orientation change), is the standard fix.
//
// Usage: render <MapAutoResize /> as a child of <MapContainer>.
export default function MapAutoResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    // Wait a frame so the surrounding grid/flex layout has finished
    // sizing the container before Leaflet re-measures it.
    const raf = requestAnimationFrame(() => map.invalidateSize());

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}