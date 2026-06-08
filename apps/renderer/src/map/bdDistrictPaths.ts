import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MapFeaturePath } from "../types";

type Position = [number, number];
type ProjectedPoint = readonly [number, number];
type LinearRing = Position[];
type PolygonCoordinates = LinearRing[];
type MultiPolygonCoordinates = PolygonCoordinates[];

interface GeoJsonFeature {
  type: "Feature";
  properties: {
    district_name?: string;
    division_name?: string;
    name?: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: PolygonCoordinates | MultiPolygonCoordinates;
  } | null;
}

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
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

const rendererRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const workspaceRoot = path.resolve(rendererRoot, "..", "..");
const defaultGeoJsonPath = path.join(workspaceRoot, "data", "bd-districts.geojson");

function projectToCanvas([longitude, latitude]: Position) {
  const x =
    MAP_BOUNDS.minX +
    ((longitude - MAP_BOUNDS.minLongitude) / (MAP_BOUNDS.maxLongitude - MAP_BOUNDS.minLongitude)) *
      (MAP_BOUNDS.maxX - MAP_BOUNDS.minX);
  const y =
    MAP_BOUNDS.minY +
    ((MAP_BOUNDS.maxLatitude - latitude) / (MAP_BOUNDS.maxLatitude - MAP_BOUNDS.minLatitude)) *
      (MAP_BOUNDS.maxY - MAP_BOUNDS.minY);

  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as const;
}

function squaredDistance(first: ProjectedPoint, second: ProjectedPoint) {
  return (first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2;
}

function simplifyProjectedRing(points: ProjectedPoint[], minDistance = 3.4) {
  if (points.length <= 12) {
    return points;
  }

  const minDistanceSquared = minDistance ** 2;
  const simplifiedPoints: ProjectedPoint[] = [points[0]];

  for (const point of points.slice(1, -1)) {
    const previousPoint = simplifiedPoints.at(-1) ?? points[0];

    if (squaredDistance(previousPoint, point) >= minDistanceSquared) {
      simplifiedPoints.push(point);
    }
  }

  simplifiedPoints.push(points.at(-1) ?? points[0]);

  return simplifiedPoints.length >= 4 ? simplifiedPoints : points;
}

function ringToPath(ring: LinearRing) {
  if (ring.length === 0) {
    return "";
  }

  const projectedRing = simplifyProjectedRing(ring.map(projectToCanvas));
  const [firstX, firstY] = projectedRing[0];
  const rest = projectedRing
    .slice(1)
    .map(([x, y]) => `L${x} ${y}`)
    .join(" ");

  return `M${firstX} ${firstY} ${rest} Z`;
}

function polygonToPath(polygon: PolygonCoordinates) {
  return polygon.map(ringToPath).filter(Boolean).join(" ");
}

function featureToPath(feature: GeoJsonFeature) {
  if (!feature.geometry) {
    return "";
  }

  if (feature.geometry.type === "Polygon") {
    return polygonToPath(feature.geometry.coordinates as PolygonCoordinates);
  }

  return (feature.geometry.coordinates as MultiPolygonCoordinates)
    .map((polygon) => polygonToPath(polygon))
    .filter(Boolean)
    .join(" ");
}

export async function loadBangladeshMapFeatures(geoJsonPath = defaultGeoJsonPath): Promise<MapFeaturePath[]> {
  const geoJson = JSON.parse(await readFile(geoJsonPath, "utf8")) as GeoJsonFeatureCollection;
  const districtPaths = new Map<string, MapFeaturePath>();

  for (const feature of geoJson.features) {
    const districtName = feature.properties.district_name?.trim() ?? "";
    const divisionName = feature.properties.division_name?.trim() ?? "";
    const pathData = featureToPath(feature);

    if (!pathData || !districtName || !divisionName) {
      continue;
    }

    const key = `${divisionName}-${districtName}`;
    const existingFeature = districtPaths.get(key);

    if (existingFeature) {
      existingFeature.path = `${existingFeature.path} ${pathData}`;
      continue;
    }

    districtPaths.set(key, {
      key,
      districtName,
      divisionName,
      path: pathData
    });
  }

  return [...districtPaths.values()].sort((first, second) =>
    first.districtName.localeCompare(second.districtName)
  );
}
