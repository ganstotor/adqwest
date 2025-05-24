// utils/mapUtils.ts
type GeoFeature = {
  type: string;
  properties: {
    ZCTA5CE10: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
};

export const getBoundingRegion = (features: GeoFeature[]) => {
  if (!features.length) return null;

  let minLat = 90,
    maxLat = -90,
    minLng = 180,
    maxLng = -180;

  features.forEach((feature) => {
    const polygons =
      feature.geometry.type === "Polygon"
        ? (feature.geometry.coordinates as number[][][])
        : (feature.geometry.coordinates as number[][][][]).flat();

    polygons.forEach((polygon) => {
      polygon.forEach(([lng, lat]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    });
  });

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);

  let zoom = 8;
  if (maxDiff < 0.01) zoom = 15;
  else if (maxDiff < 0.05) zoom = 13;
  else if (maxDiff < 0.1) zoom = 11;
  else if (maxDiff < 0.5) zoom = 10;
  else if (maxDiff < 1) zoom = 8;
  else if (maxDiff < 5) zoom = 6;
  else zoom = 4;

  return {
    center: [centerLng, centerLat],
    zoom,
  };
};
