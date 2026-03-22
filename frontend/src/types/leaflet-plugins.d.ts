import * as L from 'leaflet';

declare module 'leaflet.heat';
declare module 'leaflet.markercluster';

declare module 'leaflet' {
  function heatLayer(latlngs: Array<[number, number, number?]>, options?: Record<string, unknown>): Layer;
  function markerClusterGroup(options?: Record<string, unknown>): LayerGroup;
}

export {};
