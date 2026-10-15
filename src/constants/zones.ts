import { SCHENGEN_CODES } from './countries';
import type { StayRuleKind } from '../core/schengenCalculator';

export interface ZoneConfig {
    id: string;
    name: string;
    flag: string;
    ruleType: StayRuleKind;
    windowSizeDays?: number;      // rolling_window only
    maxStayDays?: number;
    isMultiCountry: boolean;
    isImplemented: boolean;       // whether verified, exact logic exists yet
    isCustom?: boolean;
    countryCodes: string[];       // ISO codes of countries whose days count toward the zone
}

// Country outside tracked zones: the segment stays in the route but does not consume limits.
export const NO_ZONE = 'none';

export const BUILT_IN_ZONES: ZoneConfig[] = [
    {
        id: 'schengen',
        countryCodes: SCHENGEN_CODES,
        name: 'Шенгенская зона',
        flag: '🇪🇺',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: true,
        isImplemented: true,
    },
    {
        id: 'moldova',
        countryCodes: ['MD'],
        name: 'Молдова',
        flag: '🇲🇩',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: true,
    },
    {
        id: 'cyprus',
        countryCodes: ['CY'],
        name: 'Кипр',
        flag: '🇨🇾',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: true,
    },
    {
        id: 'turkey',
        countryCodes: ['TR'],
        name: 'Турция',
        flag: '🇹🇷',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: true,
    },
    {
        id: 'georgia',
        countryCodes: ['GE'],
        name: 'Грузия',
        flag: '🇬🇪',
        ruleType: 'per_visit',
        maxStayDays: 365,
        isMultiCountry: false,
        isImplemented: true,
    },
    {
        id: 'egypt',
        countryCodes: ['EG'],
        name: 'Египет',
        flag: '🇪🇬',
        ruleType: 'per_visit',
        maxStayDays: 30,
        isMultiCountry: false,
        isImplemented: true,
    },
    {
        id: 'uae',
        countryCodes: ['AE'],
        name: 'ОАЭ',
        flag: '🇦🇪',
        ruleType: 'per_visit',
        maxStayDays: 30,
        isMultiCountry: false,
        isImplemented: true,
    },
    {
        // Visitor visa: 6 months per visit (181–184 days by entry date); 180 is the safe lower bound.
        id: 'uk',
        countryCodes: ['GB'],
        name: 'Великобритания',
        flag: '🇬🇧',
        ruleType: 'per_visit',
        maxStayDays: 180,
        isMultiCountry: false,
        isImplemented: true,
    },
];