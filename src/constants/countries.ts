// src/constants/countries.ts
export interface Country {
    code: string;
    name: string;
    flag: string;
    zoneId: 'schengen' | 'uk' | 'cyprus';
}

export const SCHENGEN_COUNTRIES: Country[] = [
    { code: 'AT', name: 'Австрия', flag: '🇦🇹', zoneId: 'schengen' },
    { code: 'BE', name: 'Бельгия', flag: '🇧🇪', zoneId: 'schengen' },
    { code: 'BG', name: 'Болгария', flag: '🇧🇬', zoneId: 'schengen' },
    { code: 'HR', name: 'Хорватия', flag: '🇭🇷', zoneId: 'schengen' },
    { code: 'CZ', name: 'Чехия', flag: '🇨🇿', zoneId: 'schengen' },
    { code: 'DK', name: 'Дания', flag: '🇩🇰', zoneId: 'schengen' },
    { code: 'EE', name: 'Эстония', flag: '🇪🇪', zoneId: 'schengen' },
    { code: 'FI', name: 'Финляндия', flag: '🇫🇮', zoneId: 'schengen' },
    { code: 'FR', name: 'Франция', flag: '🇫🇷', zoneId: 'schengen' },
    { code: 'DE', name: 'Германия', flag: '🇩🇪', zoneId: 'schengen' },
    { code: 'GR', name: 'Греция', flag: '🇬🇷', zoneId: 'schengen' },
    { code: 'HU', name: 'Венгрия', flag: '🇭🇺', zoneId: 'schengen' },
    { code: 'IS', name: 'Исландия', flag: '🇮🇸', zoneId: 'schengen' },
    { code: 'IT', name: 'Италия', flag: '🇮🇹', zoneId: 'schengen' },
    { code: 'LV', name: 'Латвия', flag: '🇱🇻', zoneId: 'schengen' },
    { code: 'LI', name: 'Лихтенштейн', flag: '🇱🇮', zoneId: 'schengen' },
    { code: 'LT', name: 'Литва', flag: '🇱🇹', zoneId: 'schengen' },
    { code: 'LU', name: 'Люксембург', flag: '🇱🇺', zoneId: 'schengen' },
    { code: 'MT', name: 'Мальта', flag: '🇲🇹', zoneId: 'schengen' },
    { code: 'NL', name: 'Нидерланды', flag: '🇳🇱', zoneId: 'schengen' },
    { code: 'NO', name: 'Норвегия', flag: '🇳🇴', zoneId: 'schengen' },
    { code: 'PL', name: 'Польша', flag: '🇵🇱', zoneId: 'schengen' },
    { code: 'PT', name: 'Португалия', flag: '🇵🇹', zoneId: 'schengen' },
    { code: 'RO', name: 'Румыния', flag: '🇷🇴', zoneId: 'schengen' },
    { code: 'SK', name: 'Словакия', flag: '🇸🇰', zoneId: 'schengen' },
    { code: 'SI', name: 'Словения', flag: '🇸🇮', zoneId: 'schengen' },
    { code: 'ES', name: 'Испания', flag: '🇪🇸', zoneId: 'schengen' },
    { code: 'SE', name: 'Швеция', flag: '🇸🇪', zoneId: 'schengen' },
    { code: 'CH', name: 'Швейцария', flag: '🇨🇭', zoneId: 'schengen' },
];

export function findCountry(code: string): Country | undefined {
    return SCHENGEN_COUNTRIES.find((c) => c.code === code);
}