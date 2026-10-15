import { SCHENGEN_CODES } from './countries';

export interface ZoneConfig {
    id: string;
    name: string;
    flag: string;
    ruleType: 'rolling_window' | 'continuous_from_entry';
    windowSizeDays?: number;      // rolling_window
    maxStayDays?: number;         // rolling_window
    continuousLimitDays?: number; // continuous_from_entry
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
        ruleType: 'continuous_from_entry',
        continuousLimitDays: 365,
        isMultiCountry: false,
        isImplemented: false,
    },
    {
        id: 'egypt',
        countryCodes: ['EG'],
        name: 'Египет',
        flag: '🇪🇬',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: false,
    },
    {
        id: 'uae',
        countryCodes: ['AE'],
        name: 'ОАЭ',
        flag: '🇦🇪',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: false,
    },
    {
        id: 'uk',
        countryCodes: ['GB'],
        name: 'Великобритания',
        flag: '🇬🇧',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: false,
    },
];