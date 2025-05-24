import * as Location from "expo-location";

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8; // Радиус Земли в милях
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getStateFromCoords = async (latitude: number, longitude: number) => {
  const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
  return geocode.length > 0 ? geocode[0].region : null;
};

export const findNearbyStates = async (
  center: { latitude: number; longitude: number },
  radius: number,
  currentState: string | null
) => {
  const directions = [
    { latOffset: radius / 69, lonOffset: 0 }, // север
    { latOffset: -radius / 69, lonOffset: 0 }, // юг
    {
      latOffset: 0,
      lonOffset: radius / (Math.cos((center.latitude * Math.PI) / 180) * 69),
    }, // восток
    {
      latOffset: 0,
      lonOffset: -radius / (Math.cos((center.latitude * Math.PI) / 180) * 69),
    }, // запад
    {
      latOffset: radius / 69 / Math.sqrt(2),
      lonOffset:
        radius /
        (Math.cos((center.latitude * Math.PI) / 180) * 69) /
        Math.sqrt(2),
    }, // северо-восток
    {
      latOffset: radius / 69 / Math.sqrt(2),
      lonOffset:
        -radius /
        (Math.cos((center.latitude * Math.PI) / 180) * 69) /
        Math.sqrt(2),
    }, // северо-запад
    {
      latOffset: -radius / 69 / Math.sqrt(2),
      lonOffset:
        radius /
        (Math.cos((center.latitude * Math.PI) / 180) * 69) /
        Math.sqrt(2),
    }, // юго-восток
    {
      latOffset: -radius / 69 / Math.sqrt(2),
      lonOffset:
        -radius /
        (Math.cos((center.latitude * Math.PI) / 180) * 69) /
        Math.sqrt(2),
    }, // юго-запад
  ];

  const states = new Set<string>();

  for (const dir of directions) {
    const lat = center.latitude + dir.latOffset;
    const lon = center.longitude + dir.lonOffset;
    const region = await getStateFromCoords(lat, lon);
    if (region) states.add(region);
  }

  if (currentState) {
    states.add(currentState); // Обязательно добавляем текущий штат
  }

  return Array.from(states);
};