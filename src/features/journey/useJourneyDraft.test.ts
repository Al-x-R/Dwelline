import { buildTrips, draftFromJourney, emptyDraft, fixOvernightLegs, validateDraft, type JourneyDraft } from './useJourneyDraft';
import type { Journey } from '../../types/Journey';
import type { ZoneConfig } from '../../constants/zones';

// The real hook module pulls in i18n and native Expo modules; zone lookup isn't under test here.
jest.mock('../../hooks/useZones', () => ({zoneIdForCountry: () => 'none'}));

const zones: ZoneConfig[] = [];

// Ukraine → Moldova (bus) → Cyprus (plane, turnaround) → Moldova (plane) → Ukraine (night bus, final).
function cyprusTrip(): JourneyDraft {
  return {
    ...emptyDraft(),
    originCode: 'UA',
    originDate: '2026-07-31',
    originTime: '05:00',
    originTransport: 'bus',
    points: [
      {id: 'md1', countryCode: 'MD', arrivalDate: '2026-07-31', arrivalTime: '20:20', departureDate: '2026-08-01', transportMode: 'plane'},
      {id: 'cy', countryCode: 'CY', arrivalDate: '2026-08-01', arrivalTime: '11:30', departureDate: '2026-09-20', departureTime: '12:15', transportMode: 'plane'},
      {id: 'md2', countryCode: 'MD', arrivalDate: '2026-09-20', arrivalTime: '14:50', departureDate: '2026-09-20', departureTime: '16:10', transportMode: 'bus'},
      {id: 'ua', countryCode: 'UA', arrivalDate: '2026-09-21', arrivalTime: '07:20'},
    ],
    turnaroundIndex: 1,
    hasFinal: true,
  };
}

describe('buildTrips', () => {
  it('counts the night bus out of Moldova by its departure day, not the arrival home', () => {
    const trips = buildTrips(cyprusTrip(), zones);
    expect(trips.map((t) => t.id)).toEqual(['md1', 'cy', 'md2']);
    const md2 = trips[2];
    expect([md2.entryDate, md2.exitDate]).toEqual(['2026-09-20', '2026-09-20']);
  });

  it('uses a later border crossing for the exit and keeps the departure as a travel date', () => {
    const draft = cyprusTrip();
    draft.points[2] = {...draft.points[2], borderDate: '2026-09-24'};
    const md2 = buildTrips(draft, zones)[2];
    expect(md2.exitDate).toBe('2026-09-24');
    expect(md2.departureDate).toBe('2026-09-20');
  });

  it('ignores a border date for flights', () => {
    const draft = cyprusTrip();
    draft.points[1] = {...draft.points[1], borderDate: '2026-09-22'};
    expect(buildTrips(draft, zones)[1].exitDate).toBe('2026-09-20');
  });

  it('enters by land on the crossing day, before the arrival', () => {
    const draft = cyprusTrip();
    draft.originDate = '2026-07-30';
    const md1 = buildTrips(draft, zones)[0];
    expect(md1.entryDate).toBe('2026-07-30');
    expect(md1.arrivalDate).toBe('2026-07-31');
  });
});

describe('validateDraft', () => {
  it('rejects a border crossing after the next arrival', () => {
    const draft = cyprusTrip();
    draft.points[2] = {...draft.points[2], borderDate: '2026-09-22'};
    expect(validateDraft(draft)).toBe('order');
    expect(validateDraft(cyprusTrip())).toBe('ok');
  });
});

describe('draftFromJourney', () => {
  it('restores travel and border dates from saved trips', () => {
    const draft = cyprusTrip();
    draft.points[2] = {...draft.points[2], borderDate: '2026-09-21'};
    const trips = buildTrips(draft, zones);
    const journey = {
      name: 'x', originCountryCode: 'UA', originCountryName: null, originCountryFlag: null, originDepartureDate: '2026-07-31',
      originDepartureTime: '05:00', originTransportMode: 'bus', destinationCountryCode: 'UA', destinationCountryName: null,
      destinationCountryFlag: null, destinationArrivalDate: '2026-09-21', destinationArrivalTime: '07:20',
      turnaroundTripId: 'cy', tripIds: trips.map((t) => t.id), id: 'j', createdAt: '',
    } satisfies Journey;
    const restored = draftFromJourney(journey, trips);
    expect(restored.points[2]).toMatchObject({departureDate: '2026-09-20', borderDate: '2026-09-21'});
    expect(restored.points[3]).toMatchObject({countryCode: 'UA', arrivalDate: '2026-09-21'});
    expect(restored.hasFinal).toBe(true);
  });
});

describe('fixOvernightLegs', () => {
  it('moves an arrival earlier in the day than the departure to the next day', () => {
    const draft = cyprusTrip();
    draft.points[3] = {...draft.points[3], arrivalDate: '2026-09-20', arrivalTime: '07:30'};
    const fixed = fixOvernightLegs(draft);
    expect(fixed.points[3].arrivalDate).toBe('2026-09-21');
    expect(fixed.points[2].departureDate).toBe('2026-09-20');
  });

  it('pins a departure that was following the next arrival', () => {
    const draft = cyprusTrip();
    draft.points[2] = {...draft.points[2], departureDate: undefined};
    draft.points[3] = {...draft.points[3], arrivalDate: '2026-09-20', arrivalTime: '07:30'};
    const fixed = fixOvernightLegs(draft);
    expect([fixed.points[2].departureDate, fixed.points[3].arrivalDate]).toEqual(['2026-09-20', '2026-09-21']);
  });

  it('leaves consistent legs alone', () => {
    const draft = cyprusTrip();
    expect(fixOvernightLegs(draft)).toBe(draft);
  });
});
