/**
 * Pre-renders a world map to flat SVG path data.
 *
 * The map on the homepage needs real country outlines and real country
 * names, but a mapping library in the browser would mean shipping a
 * projection engine and a topology decoder to every visitor so they can
 * watch a static picture being computed. The projection runs here instead,
 * once, and the component renders plain <path d="…"> elements. Runtime cost
 * of the geography: zero bytes of JavaScript.
 *
 * Source: world-atlas countries-110m (Natural Earth, public domain).
 * Equal Earth projection — equal-area, so no country is misleadingly
 * enlarged, which matters on a map whose whole subject is reach.
 *
 * The generator's dependencies are deliberately NOT in package.json: the
 * output is committed, so nobody needs them to build or run the site. To
 * regenerate:
 *
 *   npm install --no-save world-atlas@2 topojson-client@3 d3-geo@3
 *   node scripts/generate-world-map.mjs
 */
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const topology = require("world-atlas/countries-110m.json");

const WIDTH = 1000;
/* Antarctica is dropped: it spans the full width at the bottom of an equal-
   area projection, adds a quarter of the path data, and is not a place
   anyone is doing business. Its absence is also the conventional framing
   for a map like this, so it reads as intentional. */
const EXCLUDE = new Set(["Antarctica"]);
/* One decimal place at a 1000-unit width is sub-pixel at any size this map
   is rendered, and roughly halves the file. */
const PRECISION = 1;

const countries = feature(topology, topology.objects.countries).features.filter(
  (f) => !EXCLUDE.has(f.properties.name),
);

const collection = { type: "FeatureCollection", features: countries };

const projection = geoEqualEarth().fitWidth(WIDTH, collection);
const [, ty] = projection.translate();
const bounds = geoPath(projection).bounds(collection);
const height = Math.ceil(bounds[1][1] - bounds[0][1]);

/* Sit the drawing flush against the top of the viewBox so the component
   does not have to compensate for projection padding. */
projection.translate([projection.translate()[0], ty - bounds[0][1]]);

const path = geoPath(projection);

const round = (d) =>
  d.replace(/-?\d+\.?\d*/g, (n) => {
    const v = Number(n);
    return Number.isInteger(v) ? String(v) : v.toFixed(PRECISION).replace(/\.0+$/, "");
  });

const shapes = countries
  .map((f) => {
    const d = path(f);
    if (!d) return null;
    return { id: String(f.id), name: f.properties.name, d: round(d) };
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

/* India's centroid, for the home-base marker. Taken from the same geometry
   and the same projection as the outlines, so it cannot drift out of
   register with the country it sits on. */
const india = countries.find((f) => f.properties.name === "India");
if (!india) throw new Error("India not found in the source topology");
const [indiaX, indiaY] = path.centroid(india);

/*
 * The countries MIDIS works in, matched on numeric ISO 3166-1 rather than on
 * name. Natural Earth's names are not the ones a brief uses — "United States
 * of America", not "United States" — and name matching would also happily
 * catch "United Arab Emirates" for a "United" substring. The codes do not
 * move.
 */
const PRESENCE = [
  { code: "356", home: true }, // India
  { code: "840" }, // United States of America
  { code: "826" }, // United Kingdom
  { code: "124" }, // Canada
  { code: "036" }, // Australia
];

/**
 * A point to anchor a connection line to, inside the country's largest
 * landmass.
 *
 * Not the whole feature's centroid: the United States includes Alaska and
 * Hawaii and Canada includes the Arctic archipelago, so an area-weighted
 * centroid across every polygon lands in the ocean for both. Taking the
 * biggest polygon puts the anchor on the mainland, which is where a line
 * drawn to the country should appear to arrive.
 */
function anchorOf(featureObj) {
  const { geometry } = featureObj;
  const polygons =
    geometry.type === "MultiPolygon"
      ? geometry.coordinates.map((coordinates) => ({ type: "Polygon", coordinates }))
      : [geometry];

  let largest = polygons[0];
  let largestArea = -Infinity;
  for (const polygon of polygons) {
    const area = Math.abs(path.area({ type: "Feature", geometry: polygon }));
    if (area > largestArea) {
      largestArea = area;
      largest = polygon;
    }
  }

  const [x, y] = path.centroid({ type: "Feature", geometry: largest });
  return { x, y };
}

const presence = PRESENCE.map(({ code, home }) => {
  const match = countries.find((f) => String(f.id) === code);
  if (!match) throw new Error(`presence country ${code} not found in the source topology`);
  const { x, y } = anchorOf(match);
  return {
    id: code,
    name: match.properties.name,
    x: Number(x.toFixed(1)),
    y: Number(y.toFixed(1)),
    ...(home ? { home: true } : {}),
  };
});

const file = `/**
 * Generated by scripts/generate-world-map.mjs — do not edit by hand.
 *
 * Country outlines from Natural Earth (public domain) via world-atlas
 * countries-110m, projected with Equal Earth and flattened to SVG path data
 * at build time. Antarctica is omitted. Coordinates are rounded to
 * ${PRECISION} decimal place, which is sub-pixel at every size this renders.
 */

export interface WorldShape {
  /** Numeric ISO 3166-1 code, as supplied by Natural Earth. */
  id: string;
  name: string;
  /** SVG path data in the viewBox below. */
  d: string;
}

export const WORLD_VIEWBOX = { width: ${WIDTH}, height: ${height} } as const;

/** Projected centroid of India, for the home-base marker. */
export const INDIA_CENTROID = { x: ${indiaX.toFixed(1)}, y: ${indiaY.toFixed(1)} } as const;

export const INDIA_ID = ${JSON.stringify(String(india.id))};

export interface PresenceCountry {
  /** Numeric ISO 3166-1 code — the join key against WORLD_SHAPES. */
  id: string;
  /** Natural Earth's own name for the country. */
  name: string;
  /** Anchor point inside the country's largest landmass, in viewBox units. */
  x: number;
  y: number;
  /** Set on the country MIDIS operates from. */
  home?: boolean;
}

/**
 * The countries MIDIS works in, supplied by MIDIS on 2026-10-12.
 *
 * This is the one claim on the map, and it is a statement about the business
 * rather than something derived from the geography. India is first and is
 * flagged as home.
 */
export const PRESENCE_COUNTRIES: readonly PresenceCountry[] = ${JSON.stringify(presence, null, 0)
  .replace(/\},\{/g, "},\n  {")
  .replace(/^\[/, "[\n  ")
  .replace(/\]$/, ",\n]")};

export const WORLD_SHAPES: readonly WorldShape[] = ${JSON.stringify(shapes, null, 0)
  .replace(/\},\{/g, "},\n  {")
  .replace(/^\[/, "[\n  ")
  .replace(/\]$/, ",\n]")};
`;

const OUT = "src/content/world-map.ts";
await writeFile(OUT, file);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + " KB";
console.log(`${OUT}: ${shapes.length} countries, ${kb(file)}`);
console.log(`viewBox 0 0 ${WIDTH} ${height}`);
console.log(`India centroid: ${indiaX.toFixed(1)}, ${indiaY.toFixed(1)} (id ${india.id})`);
console.log(`path data alone: ${kb(shapes.map((s) => s.d).join(""))}`);
for (const p of presence) console.log(`  presence ${p.id} ${p.name}: ${p.x}, ${p.y}${p.home ? " (home)" : ""}`);
