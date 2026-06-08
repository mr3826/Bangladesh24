export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface MapTarget extends GeoPoint {
  name: string;
  type: "district" | "division" | "country";
  x: number;
  y: number;
}

const MAP_BOUNDS = {
  minLatitude: 20.75,
  maxLatitude: 26.65,
  minLongitude: 88.0,
  maxLongitude: 92.7,
  minX: 300,
  maxX: 720,
  minY: 300,
  maxY: 1290
};

const DISTRICT_POINTS: Record<string, GeoPoint> = {
  Bagerhat: { latitude: 22.66, longitude: 89.79 },
  Bandarban: { latitude: 22.2, longitude: 92.22 },
  Barguna: { latitude: 22.16, longitude: 90.12 },
  Barishal: { latitude: 22.7, longitude: 90.37 },
  Bhola: { latitude: 22.69, longitude: 90.65 },
  Bogura: { latitude: 24.85, longitude: 89.37 },
  Brahmanbaria: { latitude: 23.96, longitude: 91.11 },
  Chandpur: { latitude: 23.23, longitude: 90.65 },
  "Chapai Nawabganj": { latitude: 24.6, longitude: 88.27 },
  Chattogram: { latitude: 22.36, longitude: 91.83 },
  Chuadanga: { latitude: 23.64, longitude: 88.85 },
  "Cox's Bazar": { latitude: 21.43, longitude: 92.01 },
  Cumilla: { latitude: 23.46, longitude: 91.18 },
  Dhaka: { latitude: 23.81, longitude: 90.41 },
  Dinajpur: { latitude: 25.62, longitude: 88.64 },
  Faridpur: { latitude: 23.61, longitude: 89.84 },
  Feni: { latitude: 23.02, longitude: 91.4 },
  Gaibandha: { latitude: 25.33, longitude: 89.54 },
  Gazipur: { latitude: 24.0, longitude: 90.42 },
  Gopalganj: { latitude: 23.0, longitude: 89.83 },
  Habiganj: { latitude: 24.37, longitude: 91.42 },
  Jamalpur: { latitude: 24.94, longitude: 90.4 },
  Jashore: { latitude: 23.17, longitude: 89.21 },
  Jhalokathi: { latitude: 22.64, longitude: 90.2 },
  Jhenaidah: { latitude: 23.54, longitude: 89.17 },
  Joypurhat: { latitude: 25.1, longitude: 89.02 },
  Khagrachhari: { latitude: 23.12, longitude: 91.98 },
  Khulna: { latitude: 22.85, longitude: 89.54 },
  Kishoreganj: { latitude: 24.43, longitude: 90.78 },
  Kurigram: { latitude: 25.81, longitude: 89.65 },
  Kushtia: { latitude: 23.9, longitude: 89.12 },
  Lakshmipur: { latitude: 22.94, longitude: 90.83 },
  Lalmonirhat: { latitude: 25.99, longitude: 89.28 },
  Madaripur: { latitude: 23.17, longitude: 90.2 },
  Magura: { latitude: 23.49, longitude: 89.42 },
  Manikganj: { latitude: 23.86, longitude: 90.0 },
  Meherpur: { latitude: 23.77, longitude: 88.63 },
  Moulvibazar: { latitude: 24.48, longitude: 91.78 },
  Munshiganj: { latitude: 23.55, longitude: 90.53 },
  Mymensingh: { latitude: 24.75, longitude: 90.41 },
  Naogaon: { latitude: 24.8, longitude: 88.94 },
  Narail: { latitude: 23.17, longitude: 89.5 },
  Narayanganj: { latitude: 23.62, longitude: 90.5 },
  Narsingdi: { latitude: 23.92, longitude: 90.72 },
  Natore: { latitude: 24.42, longitude: 89.0 },
  Netrokona: { latitude: 24.88, longitude: 90.73 },
  Nilphamari: { latitude: 25.93, longitude: 88.85 },
  Noakhali: { latitude: 22.82, longitude: 91.1 },
  Pabna: { latitude: 24.0, longitude: 89.23 },
  Panchagarh: { latitude: 26.34, longitude: 88.56 },
  Patuakhali: { latitude: 22.36, longitude: 90.33 },
  Pirojpur: { latitude: 22.58, longitude: 89.98 },
  Rajbari: { latitude: 23.76, longitude: 89.65 },
  Rajshahi: { latitude: 24.37, longitude: 88.6 },
  Rangamati: { latitude: 22.63, longitude: 92.2 },
  Rangpur: { latitude: 25.75, longitude: 89.25 },
  Satkhira: { latitude: 22.72, longitude: 89.07 },
  Shariatpur: { latitude: 23.22, longitude: 90.35 },
  Sherpur: { latitude: 25.02, longitude: 90.01 },
  Sirajganj: { latitude: 24.45, longitude: 89.7 },
  Sunamganj: { latitude: 25.07, longitude: 91.4 },
  Sylhet: { latitude: 24.89, longitude: 91.87 },
  Tangail: { latitude: 24.25, longitude: 89.92 },
  Thakurgaon: { latitude: 26.03, longitude: 88.47 }
};

const DIVISION_POINTS: Record<string, GeoPoint> = {
  Barishal: { latitude: 22.7, longitude: 90.35 },
  Chattogram: { latitude: 22.75, longitude: 91.55 },
  Dhaka: { latitude: 23.82, longitude: 90.35 },
  Khulna: { latitude: 22.95, longitude: 89.45 },
  Mymensingh: { latitude: 24.85, longitude: 90.35 },
  Rajshahi: { latitude: 24.45, longitude: 89.15 },
  Rangpur: { latitude: 25.7, longitude: 89.1 },
  Sylhet: { latitude: 24.85, longitude: 91.55 }
};

const COUNTRY_POINT: GeoPoint = { latitude: 23.75, longitude: 90.35 };

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function projectToCanvas(point: GeoPoint) {
  const x =
    MAP_BOUNDS.minX +
    ((point.longitude - MAP_BOUNDS.minLongitude) /
      (MAP_BOUNDS.maxLongitude - MAP_BOUNDS.minLongitude)) *
      (MAP_BOUNDS.maxX - MAP_BOUNDS.minX);
  const y =
    MAP_BOUNDS.minY +
    ((MAP_BOUNDS.maxLatitude - point.latitude) /
      (MAP_BOUNDS.maxLatitude - MAP_BOUNDS.minLatitude)) *
      (MAP_BOUNDS.maxY - MAP_BOUNDS.minY);

  return { x, y };
}

function createTarget(name: string, type: MapTarget["type"], point: GeoPoint): MapTarget {
  return {
    name,
    type,
    ...point,
    ...projectToCanvas(point)
  };
}

export function getMapTarget(district: string | null, division: string | null, fallbackName = "Bangladesh"): MapTarget {
  if (district) {
    const districtEntry = Object.entries(DISTRICT_POINTS).find(([name]) => normalizeName(name) === normalizeName(district));

    if (districtEntry) {
      return createTarget(districtEntry[0], "district", districtEntry[1]);
    }
  }

  if (division) {
    const divisionEntry = Object.entries(DIVISION_POINTS).find(([name]) => normalizeName(name) === normalizeName(division));

    if (divisionEntry) {
      return createTarget(divisionEntry[0], "division", divisionEntry[1]);
    }
  }

  return createTarget(fallbackName, "country", COUNTRY_POINT);
}

export const DISTRICT_MAP_TARGETS = Object.entries(DISTRICT_POINTS).map(([name, point]) =>
  createTarget(name, "district", point)
);
