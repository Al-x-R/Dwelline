export interface ZoneConfig {
    id: string;
    name: string;
    flag: string;
    ruleType: 'rolling_window' | 'continuous_from_entry';
    windowSizeDays?: number;      // для rolling_window
    maxStayDays?: number;         // для rolling_window
    continuousLimitDays?: number; // для continuous_from_entry
    isMultiCountry: boolean;      // Шенген = true, остальные = false
    isImplemented: boolean;       // есть ли уже проверенная, точная логика
    isCustom?: boolean;           // добавлена пользователем вручную
    note?: string;
}

export const BUILT_IN_ZONES: ZoneConfig[] = [
    {
        id: 'schengen',
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
        name: 'Кипр',
        flag: '🇨🇾',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: true,
        note: 'Проверь актуальные условия перед долгой поездкой',
    },
    {
        id: 'turkey',
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
        name: 'Грузия',
        flag: '🇬🇪',
        ruleType: 'continuous_from_entry',
        continuousLimitDays: 365,
        isMultiCountry: false,
        isImplemented: false,
        note: 'Правило часто меняется, уточни перед поездкой',
    },
    {
        id: 'egypt',
        name: 'Египет',
        flag: '🇪🇬',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: false,
        note: 'Точные условия для украинцев не подтверждены',
    },
    {
        id: 'uae',
        name: 'ОАЭ',
        flag: '🇦🇪',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: false,
        note: 'Точные условия для украинцев не подтверждены',
    },
    {
        id: 'uk',
        name: 'Великобритания',
        flag: '🇬🇧',
        ruleType: 'rolling_window',
        windowSizeDays: 180,
        maxStayDays: 90,
        isMultiCountry: false,
        isImplemented: false,
    },
];