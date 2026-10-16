import { COUNTRY_COORDS } from '../../constants/countryCoords';
import type { TransportMode } from '../../types/Trip';
import type { RouteNode } from './useRouteNodes';

export interface MapBox {
  width: number;
  height: number;
  // Room for pin labels around the drawable area.
  padX: number;
  padTop: number;
  padBottom: number;
}

export type PinRole = 'start' | 'startFinish' | 'finish' | 'main' | 'transit' | 'return';

export interface MapPin {
  key: string;
  code: string | null;
  flag: string;
  name: string;
  role: PinRole;
  day?: string;
  x: number;
  y: number;
}

export interface MapLeg {
  key: string;
  // Index of the leg's start node in the input; the leg runs to the next node.
  index: number;
  path: string;
  // Point on the curve where the transport icon goes.
  mid: { x: number; y: number };
  transport?: TransportMode;
  minutes: number | null;
  isReturn: boolean;
}

// Space a pin takes on the map: the flag with its halo plus the label below it.
export const PIN_FOOTPRINT = {width: 132, above: 28, below: 74};
export const LEG_ICON_SIZE = 28;
const GAP = 6;
const ICON_SPOTS = [0.5, 0.6, 0.4, 0.7, 0.3, 0.78, 0.22];

interface Point {
  x: number;
  y: number;
}

function quadPoint(a: Point, c: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y};
}
// Max stretch of one axis relative to the other, so the map stays recognisable.
const MAX_ASPECT_STRETCH = 2.2;
const CURVE_BEND = 0.22;

// One pin per country (a country visited twice — UA → … → UA — shares a pin); legs become curves between pins.
// Outbound and return legs between the same pair bend to opposite sides, so a round trip draws as a loop.
export function layoutRouteMap(nodes: RouteNode[], box: MapBox): { pins: MapPin[]; legs: MapLeg[] } {
  const pinKey = (n: RouteNode) => n.code ?? n.key;
  const pins = new Map<string, MapPin & { lat: number; lng: number }>();

  nodes.forEach((node, i) => {
    const key = pinKey(node);
    const existing = pins.get(key);
    const role = roleOf(node);
    if (existing) {
      existing.role = mergeRoles(existing.role, role);
      return;
    }
    const coords = node.code ? COUNTRY_COORDS[node.code] : undefined;
    // Unknown country: spread on a small circle so it still gets its own spot.
    const [lat, lng] = coords ?? [45 + Math.sin(i) * 5, 20 + Math.cos(i) * 5];
    pins.set(key, {
      key, code: node.code, flag: node.flag, name: node.name, role, day: node.day, x: 0, y: 0, lat, lng,
    });
  });

  const list = Array.from(pins.values());
  project(list, box);
  relax(list, box);

  const legs: MapLeg[] = [];
  const pairCount = new Map<string, number>();
  const curves = new Map<string, { a: Point; c: Point; b: Point }>();
  nodes.forEach((node, i) => {
    const next = nodes[i + 1];
    if (!next || !node.leg) return;
    const a = pins.get(pinKey(node))!;
    const b = pins.get(pinKey(next))!;
    if (a === b) return;
    // Repeated legs over the same pair in the same direction bend further out.
    const pair = `${a.key}>${b.key}`;
    const repeat = pairCount.get(pair) ?? 0;
    pairCount.set(pair, repeat + 1);

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.max(18, len * CURVE_BEND) * (1 + repeat * 0.6);
    const cx = (a.x + b.x) / 2 - (dy / len) * bend;
    const cy = (a.y + b.y) / 2 + (dx / len) * bend;
    curves.set(node.key, {a, c: {x: cx, y: cy}, b});
    legs.push({
      key: node.key,
      index: i,
      path: `M ${r(a.x)} ${r(a.y)} Q ${r(cx)} ${r(cy)} ${r(b.x)} ${r(b.y)}`,
      mid: quadPoint(a, {x: cx, y: cy}, b, 0.5),
      transport: node.leg.transport,
      minutes: node.leg.minutes,
      isReturn: node.leg.isReturn,
    });
  });

  // Icons go in route order at the first free spot along the curve (middle first, then towards the ends).
  // With no free spot the icon stays in the middle — every leg keeps its icon.
  const taken: Rect[] = list.map(pinCircle);
  const half = LEG_ICON_SIZE / 2;
  for (const leg of legs) {
    const {a, c, b} = curves.get(leg.key)!;
    const spot = ICON_SPOTS.map((t) => quadPoint(a, c, b, t))
      .map((pt) => ({pt, rect: {x: pt.x - half, y: pt.y - half, w: LEG_ICON_SIZE, h: LEG_ICON_SIZE}}))
      .find(({rect}) => !taken.some((other) => overlaps(rect, other)));
    if (spot) leg.mid = spot.pt;
    taken.push({x: leg.mid.x - half, y: leg.mid.y - half, w: LEG_ICON_SIZE, h: LEG_ICON_SIZE});
  }

  return {pins: list.map(({lat: _lat, lng: _lng, ...pin}) => pin), legs};
}

function roleOf(node: RouteNode): PinRole {
  if (node.kind === 'origin') return 'start';
  if (node.kind === 'destination') return 'finish';
  if (node.isMain) return 'main';
  return node.leg?.isReturn ? 'return' : 'transit';
}

// A pin visited several times shows its most important role.
function mergeRoles(a: PinRole, b: PinRole): PinRole {
  const pair = new Set([a, b]);
  if (pair.has('main')) return 'main';
  if (pair.has('start') && pair.has('finish')) return 'startFinish';
  if (pair.has('startFinish')) return 'startFinish';
  if (pair.has('start')) return 'start';
  if (pair.has('finish')) return 'finish';
  return pair.has('transit') ? 'transit' : 'return';
}

// Equirectangular projection fitted into the box.
function project(pins: (MapPin & { lat: number; lng: number })[], box: MapBox) {
  const meanLat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
  const k = Math.cos((meanLat * Math.PI) / 180);
  const xs = pins.map((p) => p.lng * k);
  const ys = pins.map((p) => -p.lat);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;
  const boxW = box.width - box.padX * 2;
  const boxH = box.height - box.padTop - box.padBottom;

  let sx = spanX > 0 ? boxW / spanX : Infinity;
  let sy = spanY > 0 ? boxH / spanY : Infinity;
  if (!Number.isFinite(sx) && !Number.isFinite(sy)) sx = sy = 1;
  else if (!Number.isFinite(sx)) sx = sy;
  else if (!Number.isFinite(sy)) sy = sx;
  sx = Math.min(sx, sy * MAX_ASPECT_STRETCH);
  sy = Math.min(sy, sx * MAX_ASPECT_STRETCH);

  const offX = box.padX + (boxW - spanX * sx) / 2;
  const offY = box.padTop + (boxH - spanY * sy) / 2;
  pins.forEach((p, i) => {
    p.x = offX + (xs[i] - minX) * sx;
    p.y = offY + (ys[i] - minY) * sy;
  });
}

interface Rect extends Point {
  w: number;
  h: number;
}

// Icons may sit next to a label, but not on the flag itself.
function pinCircle(p: MapPin): Rect {
  const r = PIN_FOOTPRINT.above;
  return {x: p.x - r, y: p.y - r, w: r * 2, h: r * 2};
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP && a.y < b.y + b.h + GAP && b.y < a.y + a.h + GAP;
}

// Push apart pins whose pin + label footprints overlap (neighbouring countries), along the axis that
// needs the smaller move, keeping them inside the box. Labels are wide, so neighbours usually stack vertically.
function relax(pins: MapPin[], box: MapBox) {
  const clamp = (p: MapPin) => {
    p.x = Math.min(box.width - box.padX, Math.max(box.padX, p.x));
    p.y = Math.min(box.height - box.padBottom, Math.max(box.padTop, p.y));
  };
  const needX = PIN_FOOTPRINT.width + GAP;
  const needY = PIN_FOOTPRINT.above + PIN_FOOTPRINT.below + GAP;
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const a = pins[i];
        const b = pins[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = needX - Math.abs(dx);
        const overlapY = needY - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        // Prefer the cheaper axis; fall back to the other when the box edge blocks the move.
        const horizontalRoom = box.width - box.padX * 2 >= needX;
        if (overlapX < overlapY && horizontalRoom) {
          const dir = dx >= 0 ? 1 : -1;
          a.x -= (dir * overlapX) / 2;
          b.x += (dir * overlapX) / 2;
        } else {
          const dir = dy >= 0 ? 1 : -1;
          a.y -= (dir * overlapY) / 2;
          b.y += (dir * overlapY) / 2;
        }
        clamp(a);
        clamp(b);
        moved = true;
      }
    }
    if (!moved) break;
  }
}

const r = (v: number) => Math.round(v * 10) / 10;
