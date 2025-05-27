/**
 * Получает список ZIP-кодов в заданном радиусе от указанных координат.
 *
 * 1. Определяет, в каком штате находятся заданные координаты.
 * 2. Находит список близлежащих штатов, включая текущий (с учётом радиуса).
 * 3. Загружает ZIP-GeoJSON-файлы для этих штатов.
 * 4. Фильтрует ZIP-коды, чьи границы попадают в радиус (использует формулу гаверсинуса).
 * 5. Возвращает массив объектов с ZIP-кодом и сокращением штата.
 *
 * Используется для автоматического вычисления ZIP-кодов без отображения карты.
 */


import { haversineDistance, getStateFromCoords, findNearbyStates } from "./geo";
import stateAbbrMap from "./stateAbbreviations";

type GeoFeature = {
  type: string;
  properties: { ZCTA5CE10: string };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
};

type ZipListItem = {
  key: string;
  state: string;
};

export async function getZipList(
  location: { latitude: number; longitude: number },
  radius: number
): Promise<ZipListItem[]> {
  // 🔍 Сначала определяем текущий штат
  const currentState = await getStateFromCoords(location.latitude, location.longitude);

  // 📍 Получаем ближайшие штаты, включая текущий
  const nearbyStates = await findNearbyStates(location, radius, currentState);

  const allZips: ZipListItem[] = [];

  for (const state of nearbyStates) {
    const abbr = stateAbbrMap[state];
    if (!abbr) continue;

    const url = `https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/${abbr}_${state
      .toLowerCase()
      .replace(/ /g, "_")}_zip_codes_geo.min.json`;

    try {
      const res = await fetch(url);
      const geo = await res.json();

      const filtered = geo.features.filter((f: GeoFeature) => {
        const polygons =
          f.geometry.type === "Polygon"
            ? (f.geometry.coordinates as number[][][])
            : (f.geometry.coordinates as number[][][][]).flat();

        return polygons.some((polygon) =>
          polygon.some(
            ([lng, lat]) =>
              haversineDistance(location.latitude, location.longitude, lat, lng) <= radius
          )
        );
      });

      const zipItems = filtered.map((f: GeoFeature) => ({
        key: f.properties.ZCTA5CE10,
        state: abbr.toUpperCase(),
      }));

      allZips.push(...zipItems);
    } catch (e) {
      console.warn(`Failed to load ZIPs for ${state}:`, e);
    }
  }

  return allZips;
}
