export type ZoneId = string;

export type TransportMode = 'plane' | 'train' | 'bus' | 'car' | 'ferry' | 'walk' | 'other';

export interface Trip {
  id: string;
  zoneId: ZoneId;
  countryCode: string;
  entryDate: string;
  exitDate: string | null;
  transportMode?: TransportMode;
  arrivalTime?: string;
  departureTime?: string;
}

export interface DayStatus {
  date: string;        // 'YYYY-MM-DD'
  daysUsedInWindow: number; // number of days used in the 180-day window ending on this day
  isViolation: boolean;
}

export interface ComplianceResult {
  daysUsed: number;         // days used in the current 180-day window (as of today)
  daysRemaining: number;    // 90 - daysUsed, cannot be negative for UI
  isViolation: boolean;     // whether the limit is currently exceeded
  nextExitDeadline: string | null; // if the person is still in the zone — the latest date they can stay until
  windowStart: string;      // start of the current 180-day window
  windowEnd: string;        // end of the window (= today)
}
