import { PIN_FOOTPRINT, layoutRouteMap, type MapBox } from './routeMapLayout';
import type { RouteNode } from './useRouteNodes';

// iPhone-size map area: chips on top, panel overlap at the bottom.
const BOX: MapBox = {width: 390, height: 360, padX: 70, padTop: 76, padBottom: 106};

function node(key: string, code: string, kind: RouteNode['kind'], extra: Partial<RouteNode> = {}): RouteNode {
  return {key, code, flag: '', name: code, kind, isMain: false, ...extra};
}

// UA → MD → CY → MD → UA
const roundTrip: RouteNode[] = [
  node('origin', 'UA', 'origin', {leg: {transport: 'bus', minutes: 900, isReturn: false}}),
  node('p1', 'MD', 'point', {leg: {transport: 'plane', minutes: 150, isReturn: false}}),
  node('p2', 'CY', 'point', {isMain: true, leg: {transport: 'plane', minutes: 150, isReturn: true}}),
  node('p3', 'MD', 'point', {leg: {transport: 'bus', minutes: 900, isReturn: true}}),
  node('destination', 'UA', 'destination'),
];

describe('layoutRouteMap', () => {
  it('shares a pin per country and merges roles', () => {
    const {pins} = layoutRouteMap(roundTrip, BOX);
    expect(pins.map((p) => [p.code, p.role])).toEqual([['UA', 'startFinish'], ['MD', 'transit'], ['CY', 'main']]);
  });

  it('keeps geography: Ukraine above Cyprus, Cyprus to the right of Moldova', () => {
    const {pins} = layoutRouteMap(roundTrip, BOX);
    const at = (c: string) => pins.find((p) => p.code === c)!;
    expect(at('UA').y).toBeLessThan(at('CY').y);
    expect(at('CY').x).toBeGreaterThan(at('MD').x);
  });

  it('keeps pin + label footprints apart and inside the box', () => {
    const {pins} = layoutRouteMap(roundTrip, BOX);
    for (const p of pins) {
      expect(p.x).toBeGreaterThanOrEqual(BOX.padX);
      expect(p.x).toBeLessThanOrEqual(BOX.width - BOX.padX);
      expect(p.y).toBeGreaterThanOrEqual(BOX.padTop);
      expect(p.y).toBeLessThanOrEqual(BOX.height - BOX.padBottom);
    }
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const apartX = Math.abs(pins[i].x - pins[j].x) >= PIN_FOOTPRINT.width;
        const apartY = Math.abs(pins[i].y - pins[j].y) >= PIN_FOOTPRINT.above + PIN_FOOTPRINT.below;
        expect(apartX || apartY).toBe(true);
      }
    }
  });

  it('gives every leg an icon off the flags', () => {
    const {pins, legs} = layoutRouteMap(roundTrip, BOX);
    expect(legs).toHaveLength(4);
    for (const leg of legs) {
      for (const p of pins) {
        expect(Math.hypot(leg.mid.x - p.x, leg.mid.y - p.y)).toBeGreaterThan(PIN_FOOTPRINT.above);
      }
    }
  });

  it('bends outbound and return legs of the same pair to opposite sides', () => {
    const {legs} = layoutRouteMap(roundTrip, BOX);
    expect(legs).toHaveLength(4);
    const out = legs.find((l) => l.key === 'p1')!; // MD → CY
    const back = legs.find((l) => l.key === 'p2')!; // CY → MD
    expect(Math.hypot(out.mid.x - back.mid.x, out.mid.y - back.mid.y)).toBeGreaterThan(20);
  });

  it('handles a single-country route', () => {
    const {pins, legs} = layoutRouteMap([node('p1', 'CY', 'point', {isMain: true})], BOX);
    expect(pins).toHaveLength(1);
    expect(Number.isFinite(pins[0].x) && Number.isFinite(pins[0].y)).toBe(true);
    expect(legs).toHaveLength(0);
  });
});
