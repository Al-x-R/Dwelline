import { PASSPORT_OVERRIDES, PASSPORT_RULES } from '../constants/passportRules';
import { BUILT_IN_ZONES, type ZoneConfig } from '../constants/zones';
import type { Trip } from '../types/Trip';
import { calculateCompliance, findExitDeadline } from './schengenCalculator';
import { applyExemptions, resolveZoneAccess, zoneContext } from './zoneAccess';

const zone = (id: string): ZoneConfig => BUILT_IN_ZONES.find((z) => z.id === id)!;
const none = {passports: [], residences: []};

describe('resolveZoneAccess', () => {
    it('falls back to the zone default when no passport is set', () => {
        const access = resolveZoneAccess(zone('schengen'), none);
        expect(access.mode).toBe('unknown');
        expect(access.basis).toBe('zone_default');
        expect(access.constraints[0].maxStayDays).toBe(90);
    });

    it('gives EU citizens free movement in Schengen', () => {
        const access = resolveZoneAccess(zone('schengen'), {passports: ['PL'], residences: []});
        expect(access.mode).toBe('free');
        expect(access.constraints).toHaveLength(0);
    });

    it('treats a citizen of the zone country as free', () => {
        expect(resolveZoneAccess(zone('uk'), {passports: ['GB'], residences: []}).basis).toBe('citizen');
        expect(resolveZoneAccess(zone('georgia'), {passports: ['GE'], residences: []}).mode).toBe('free');
    });

    it('picks the more permissive of two passports', () => {
        const access = resolveZoneAccess(zone('schengen'), {passports: ['UA', 'PL'], residences: []});
        expect(access.mode).toBe('free');
        expect(access.passport).toBe('PL');

        const uk = resolveZoneAccess(zone('uk'), {passports: ['UA', 'US'], residences: []});
        expect(uk.mode).toBe('visa_free');
        expect(uk.requires).toContain('eta');
    });

    it('marks missing cells as unknown but keeps the zone default limit', () => {
        const access = resolveZoneAccess(zone('moldova'), {passports: ['AU'], residences: []});
        expect(access.mode).toBe('unknown');
        expect(access.constraints).toHaveLength(1);
    });

    it('applies single-country overrides before the group rule', () => {
        expect(resolveZoneAccess(zone('uk'), {passports: ['IE'], residences: []}).mode).toBe('free');
        expect(resolveZoneAccess(zone('uk'), {passports: ['FR'], residences: []}).requires).toContain('eta');
        expect(resolveZoneAccess(zone('turkey'), {passports: ['CY'], residences: []}).mode).toBe('visa_required');
        expect(resolveZoneAccess(zone('turkey'), {passports: ['GR'], residences: []}).mode).toBe('visa_free');
    });

    it('uses the per-visit limit for Russian passports in Turkey', () => {
        const [r] = resolveZoneAccess(zone('turkey'), {passports: ['RU'], residences: []}).constraints;
        expect(r).toMatchObject({kind: 'per_visit', maxStayDays: 60});
    });

    it('requires a visa for Russian passports in Schengen', () => {
        expect(resolveZoneAccess(zone('schengen'), {passports: ['RU'], residences: []}).mode).toBe('visa_required');
    });

    it('makes a single-country zone free with a valid residence permit there', () => {
        const access = resolveZoneAccess(zone('georgia'), {
            passports: ['UA'],
            residences: [{countryCode: 'GE', kind: 'residence_permit', validUntil: null}],
        });
        expect(access.mode).toBe('free');
        expect(access.basis).toBe('residence');
    });

    it('exempts only the host country in Schengen for temporary protection', () => {
        const access = resolveZoneAccess(zone('schengen'), {
            passports: ['UA'],
            residences: [{countryCode: 'DE', kind: 'temporary_protection', validUntil: null}],
        }, '2026-10-15');
        expect(access.mode).toBe('visa_free');
        expect(access.exemptions).toEqual([{countryCode: 'DE', kind: 'temporary_protection', until: '2027-03-04'}]);
    });

    it('ignores temporary protection outside the EU', () => {
        const access = resolveZoneAccess(zone('schengen'), {
            passports: ['UA'],
            residences: [{countryCode: 'CH', kind: 'temporary_protection', validUntil: null}],
        });
        expect(access.exemptions).toHaveLength(0);
    });

    it('treats a national D visa like a residence permit in the issuing country', () => {
        const access = resolveZoneAccess(zone('schengen'), {
            passports: ['US'],
            residences: [{countryCode: 'ES', kind: 'national_visa_d', validUntil: '2027-01-31'}],
        }, '2026-10-15');
        expect(access.mode).toBe('visa_free');
        expect(access.exemptions).toEqual([{countryCode: 'ES', kind: 'national_visa_d', until: '2027-01-31'}]);
    });

    it('stops treating a zone as free once the residence permit has expired', () => {
        const access = resolveZoneAccess(zone('georgia'), {
            passports: ['UA'],
            residences: [{countryCode: 'GE', kind: 'residence_permit', validUntil: '2026-01-31'}],
        }, '2026-10-15');
        expect(access.mode).toBe('visa_free');
    });
});

describe('applyExemptions', () => {
    const trips: Trip[] = [
        { id: '1', zoneId: 'schengen', countryCode: 'DE', entryDate: '2026-01-01', exitDate: '2026-03-31' },
        { id: '2', zoneId: 'schengen', countryCode: 'FR', entryDate: '2026-04-01', exitDate: '2026-04-10' },
    ];

    it('removes days in the host country and keeps the rest', () => {
        const result = applyExemptions(trips, [{countryCode: 'DE', kind: 'temporary_protection', until: null}]);
        expect(calculateCompliance(result, 'schengen', '2026-04-10').daysUsed).toBe(10);
    });

    it('counts host country days again after the status ends', () => {
        const result = applyExemptions(trips, [{countryCode: 'DE', kind: 'residence_permit', until: '2026-03-21'}]);
        // Mar 22–31 in DE + Apr 1–10 in FR
        expect(calculateCompliance(result, 'schengen', '2026-04-10').daysUsed).toBe(20);
    });
});

describe('applyExemptions with an open stay', () => {
    const open: Trip[] = [
        { id: '1', zoneId: 'schengen', countryCode: 'DE', entryDate: '2026-01-01', exitDate: null },
    ];
    const exemption = [{countryCode: 'DE', kind: 'temporary_protection' as const, until: '2027-03-04'}];

    it('drops an open stay while the status is valid', () => {
        expect(applyExemptions(open, exemption, '2026-10-15')).toHaveLength(0);
    });

    it('counts an open stay from the day after the status ended', () => {
        const [trip] = applyExemptions(open, exemption, '2027-03-10');
        expect(trip.entryDate).toBe('2027-03-05');
    });
});

describe('month-based visit limit', () => {
    const uk = resolveZoneAccess(zone('uk'), {passports: ['US'], residences: []}).constraints[0];

    it('allows exactly 6 calendar months from entry', () => {
        const trips: Trip[] = [
            { id: '1', zoneId: 'uk', countryCode: 'GB', entryDate: '2026-01-01', exitDate: null },
        ];
        // Jan 1 + 6 months = Jul 1, so the last allowed day is Jun 30 (181 days)
        expect(findExitDeadline(trips, 'uk', '2026-01-01', uk)).toBe('2026-06-30');
        expect(calculateCompliance(trips, 'uk', '2026-06-30', uk).daysRemaining).toBe(0);
    });
});

describe('PASSPORT_RULES', () => {
    it('records a source and verification date for every cell', () => {
        const cells = [...Object.values(PASSPORT_RULES), ...Object.values(PASSPORT_OVERRIDES)].flatMap((c) => Object.values(c ?? {}));
        for (const cell of cells) {
            expect(cell!.source).toMatch(/^https:\/\//);
            expect(cell!.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });

    it('puts the per-visit rule first in combined cells, so the counter shows the current visit', () => {
        for (const cells of [...Object.values(PASSPORT_RULES), ...Object.values(PASSPORT_OVERRIDES)]) {
            for (const cell of Object.values(cells ?? {})) {
                if (cell!.constraints.length > 1) expect(cell!.constraints[0].kind).toBe('per_visit');
            }
        }
    });
});

describe('Eurasian zones added 2026-10-16', () => {
    const access = (id: string, passport: string) => resolveZoneAccess(zone(id), {passports: [passport], residences: []});

    it('has a rule for every passport group in every new zone', () => {
        const ids = ['montenegro', 'serbia', 'albania', 'north_macedonia', 'bosnia', 'kosovo', 'ireland', 'armenia',
            'azerbaijan', 'kazakhstan', 'kyrgyzstan', 'uzbekistan', 'thailand', 'vietnam', 'indonesia', 'malaysia',
            'japan', 'south_korea'];
        for (const id of ids) {
            expect(zone(id)).toBeDefined();
            for (const group of Object.keys(PASSPORT_RULES) as (keyof typeof PASSPORT_RULES)[]) {
                expect([id, group, PASSPORT_RULES[group][id]?.mode]).not.toEqual([id, group, undefined]);
            }
        }
    });

    it('gives Ukrainians 90/180 in Montenegro and 30/60 in Bosnia', () => {
        expect(access('montenegro', 'UA').constraints[0]).toMatchObject({kind: 'rolling_window', maxStayDays: 90, windowSizeDays: 180});
        expect(access('bosnia', 'UA').constraints[0]).toMatchObject({maxStayDays: 30, windowSizeDays: 60});
    });

    it('gives EU and UK citizens free movement in Ireland', () => {
        expect(access('ireland', 'DE').mode).toBe('free');
        expect(access('ireland', 'GB').mode).toBe('free');
        expect(access('ireland', 'US').constraints[0]).toMatchObject({kind: 'per_visit', maxStayDays: 90});
    });

    it('splits EU passports in Vietnam between exemption and e-visa', () => {
        expect(access('vietnam', 'DE').constraints[0].maxStayDays).toBe(45);
        expect(access('vietnam', 'PT').requires).toContain('evisa');
    });

    it('requires a visa for Ukrainians in Japan and Korea', () => {
        expect(access('japan', 'UA').mode).toBe('visa_required');
        expect(access('south_korea', 'UA').mode).toBe('visa_required');
    });
});

describe('combined rules end to end', () => {
    const kz = (id: string, entryDate: string, exitDate: string | null): Trip =>
        ({id, zoneId: 'kazakhstan', countryCode: 'KZ', entryDate, exitDate});
    const trips = [
        kz('1', '2025-12-01', '2025-12-25'), kz('2', '2026-01-01', '2026-01-25'),
        kz('3', '2026-02-01', '2026-02-25'), kz('4', '2026-03-01', null),
    ];

    it('passes both Kazakhstan rules from the passport table to the calculator', () => {
        const ctx = zoneContext(zone('kazakhstan'), trips, {passports: ['DE'], residences: []}, '2026-03-10');
        expect(ctx.rules).toMatchObject({kind: 'per_visit', maxStayDays: 30, also: [{kind: 'rolling_window', maxStayDays: 90}]});
        expect(findExitDeadline(ctx.trips, 'kazakhstan', '2026-03-10', ctx.rules)).toBe('2026-03-15');
    });

    it('applies the zone default pair when no passport is set', () => {
        const ctx = zoneContext(zone('kazakhstan'), trips, none, '2026-03-10');
        expect(calculateCompliance(ctx.trips, 'kazakhstan', '2026-03-10', ctx.rules).daysRemaining).toBe(5);
    });

    it('keeps a single rule for Ukrainians (90/180 only)', () => {
        const ctx = zoneContext(zone('kazakhstan'), trips, {passports: ['UA'], residences: []}, '2026-03-10');
        expect(ctx.rules.also).toBeUndefined();
    });
});
