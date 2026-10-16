import { BUILT_IN_ZONES, NO_ZONE, type ZoneConfig } from '../constants/zones';
import type { Trip } from '../types/Trip';
import { assignUntrackedTrips } from './tripsStore';

// jest hoists these above the imports.
jest.mock('@react-native-async-storage/async-storage', () => ({getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()}));
jest.mock('./zonesStore', () => ({useZonesStore: {getState: () => ({customZones: [], getZone: () => undefined})}}));

const trip = (countryCode: string, zoneId: string): Trip => ({id: countryCode, zoneId, countryCode, entryDate: '2026-05-01', exitDate: '2026-05-10'});

describe('assignUntrackedTrips', () => {
    it('moves untracked trips into a zone that now covers their country', () => {
        const [me] = assignUntrackedTrips([trip('ME', NO_ZONE)], BUILT_IN_ZONES);
        expect(me.zoneId).toBe('montenegro');
    });

    it('leaves trips already in a zone and countries without one alone', () => {
        const trips = [trip('CY', 'cyprus'), trip('BR', NO_ZONE)];
        const result = assignUntrackedTrips(trips, BUILT_IN_ZONES);
        expect(result[0]).toBe(trips[0]);
        expect(result[1]).toBe(trips[1]);
    });

    it('prefers a custom zone for the same country', () => {
        const custom: ZoneConfig = {...BUILT_IN_ZONES.find((z) => z.id === 'montenegro')!, id: 'my_me', isCustom: true};
        const [me] = assignUntrackedTrips([trip('ME', NO_ZONE)], [...BUILT_IN_ZONES, custom]);
        expect(me.zoneId).toBe('my_me');
    });
});
