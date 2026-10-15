import type { Language } from '../i18n/types';

export interface Country {
  code: string;
  names: Record<Language, string>;
}

// [ISO code, ru, en, uk]
type Row = [string, string, string, string];

const ROWS: Row[] = [
  ['UA', 'Украина', 'Ukraine', 'Україна'],
  ['MD', 'Молдова', 'Moldova', 'Молдова'],
  ['CY', 'Кипр', 'Cyprus', 'Кіпр'],
  ['TR', 'Турция', 'Turkey', 'Туреччина'],
  ['GE', 'Грузия', 'Georgia', 'Грузія'],
  ['AT', 'Австрия', 'Austria', 'Австрія'],
  ['BE', 'Бельгия', 'Belgium', 'Бельгія'],
  ['BG', 'Болгария', 'Bulgaria', 'Болгарія'],
  ['HR', 'Хорватия', 'Croatia', 'Хорватія'],
  ['CZ', 'Чехия', 'Czechia', 'Чехія'],
  ['DK', 'Дания', 'Denmark', 'Данія'],
  ['EE', 'Эстония', 'Estonia', 'Естонія'],
  ['FI', 'Финляндия', 'Finland', 'Фінляндія'],
  ['FR', 'Франция', 'France', 'Франція'],
  ['DE', 'Германия', 'Germany', 'Німеччина'],
  ['GR', 'Греция', 'Greece', 'Греція'],
  ['HU', 'Венгрия', 'Hungary', 'Угорщина'],
  ['IS', 'Исландия', 'Iceland', 'Ісландія'],
  ['IT', 'Италия', 'Italy', 'Італія'],
  ['LV', 'Латвия', 'Latvia', 'Латвія'],
  ['LI', 'Лихтенштейн', 'Liechtenstein', 'Ліхтенштейн'],
  ['LT', 'Литва', 'Lithuania', 'Литва'],
  ['LU', 'Люксембург', 'Luxembourg', 'Люксембург'],
  ['MT', 'Мальта', 'Malta', 'Мальта'],
  ['NL', 'Нидерланды', 'Netherlands', 'Нідерланди'],
  ['NO', 'Норвегия', 'Norway', 'Норвегія'],
  ['PL', 'Польша', 'Poland', 'Польща'],
  ['PT', 'Португалия', 'Portugal', 'Португалія'],
  ['RO', 'Румыния', 'Romania', 'Румунія'],
  ['SK', 'Словакия', 'Slovakia', 'Словаччина'],
  ['SI', 'Словения', 'Slovenia', 'Словенія'],
  ['ES', 'Испания', 'Spain', 'Іспанія'],
  ['SE', 'Швеция', 'Sweden', 'Швеція'],
  ['CH', 'Швейцария', 'Switzerland', 'Швейцарія'],
  ['GB', 'Великобритания', 'United Kingdom', 'Велика Британія'],
  ['IE', 'Ирландия', 'Ireland', 'Ірландія'],
  ['AL', 'Албания', 'Albania', 'Албанія'],
  ['AD', 'Андорра', 'Andorra', 'Андорра'],
  ['BY', 'Беларусь', 'Belarus', 'Білорусь'],
  ['BA', 'Босния и Герцеговина', 'Bosnia and Herzegovina', 'Боснія і Герцеговина'],
  ['ME', 'Черногория', 'Montenegro', 'Чорногорія'],
  ['MK', 'Северная Македония', 'North Macedonia', 'Північна Македонія'],
  ['MC', 'Монако', 'Monaco', 'Монако'],
  ['RS', 'Сербия', 'Serbia', 'Сербія'],
  ['SM', 'Сан-Марино', 'San Marino', 'Сан-Марино'],
  ['VA', 'Ватикан', 'Vatican City', 'Ватикан'],
  ['XK', 'Косово', 'Kosovo', 'Косово'],
  ['RU', 'Россия', 'Russia', 'Росія'],
  ['AM', 'Армения', 'Armenia', 'Вірменія'],
  ['AZ', 'Азербайджан', 'Azerbaijan', 'Азербайджан'],
  ['KZ', 'Казахстан', 'Kazakhstan', 'Казахстан'],
  ['KG', 'Киргизия', 'Kyrgyzstan', 'Киргизстан'],
  ['TJ', 'Таджикистан', 'Tajikistan', 'Таджикистан'],
  ['TM', 'Туркменистан', 'Turkmenistan', 'Туркменистан'],
  ['UZ', 'Узбекистан', 'Uzbekistan', 'Узбекистан'],
  ['US', 'США', 'United States', 'США'],
  ['CA', 'Канада', 'Canada', 'Канада'],
  ['MX', 'Мексика', 'Mexico', 'Мексика'],
  ['BR', 'Бразилия', 'Brazil', 'Бразилія'],
  ['AR', 'Аргентина', 'Argentina', 'Аргентина'],
  ['CL', 'Чили', 'Chile', 'Чилі'],
  ['CO', 'Колумбия', 'Colombia', 'Колумбія'],
  ['PE', 'Перу', 'Peru', 'Перу'],
  ['UY', 'Уругвай', 'Uruguay', 'Уругвай'],
  ['PY', 'Парагвай', 'Paraguay', 'Парагвай'],
  ['BO', 'Боливия', 'Bolivia', 'Болівія'],
  ['EC', 'Эквадор', 'Ecuador', 'Еквадор'],
  ['VE', 'Венесуэла', 'Venezuela', 'Венесуела'],
  ['CU', 'Куба', 'Cuba', 'Куба'],
  ['DO', 'Доминиканская Республика', 'Dominican Republic', 'Домініканська Республіка'],
  ['JM', 'Ямайка', 'Jamaica', 'Ямайка'],
  ['PA', 'Панама', 'Panama', 'Панама'],
  ['CR', 'Коста-Рика', 'Costa Rica', 'Коста-Рика'],
  ['GT', 'Гватемала', 'Guatemala', 'Гватемала'],
  ['HN', 'Гондурас', 'Honduras', 'Гондурас'],
  ['SV', 'Сальвадор', 'El Salvador', 'Сальвадор'],
  ['NI', 'Никарагуа', 'Nicaragua', 'Нікарагуа'],
  ['EG', 'Египет', 'Egypt', 'Єгипет'],
  ['MA', 'Марокко', 'Morocco', 'Марокко'],
  ['TN', 'Тунис', 'Tunisia', 'Туніс'],
  ['DZ', 'Алжир', 'Algeria', 'Алжир'],
  ['LY', 'Ливия', 'Libya', 'Лівія'],
  ['ZA', 'ЮАР', 'South Africa', 'ПАР'],
  ['NG', 'Нигерия', 'Nigeria', 'Нігерія'],
  ['KE', 'Кения', 'Kenya', 'Кенія'],
  ['ET', 'Эфиопия', 'Ethiopia', 'Ефіопія'],
  ['GH', 'Гана', 'Ghana', 'Гана'],
  ['TZ', 'Танзания', 'Tanzania', 'Танзанія'],
  ['UG', 'Уганда', 'Uganda', 'Уганда'],
  ['SN', 'Сенегал', 'Senegal', 'Сенегал'],
  ['CI', 'Кот-д’Ивуар', 'Côte d’Ivoire', 'Кот-д’Івуар'],
  ['CM', 'Камерун', 'Cameroon', 'Камерун'],
  ['ZM', 'Замбия', 'Zambia', 'Замбія'],
  ['ZW', 'Зимбабве', 'Zimbabwe', 'Зімбабве'],
  ['NA', 'Намибия', 'Namibia', 'Намібія'],
  ['BW', 'Ботсвана', 'Botswana', 'Ботсвана'],
  ['MU', 'Маврикий', 'Mauritius', 'Маврикій'],
  ['SC', 'Сейшелы', 'Seychelles', 'Сейшели'],
  ['MG', 'Мадагаскар', 'Madagascar', 'Мадагаскар'],
  ['RW', 'Руанда', 'Rwanda', 'Руанда'],
  ['CN', 'Китай', 'China', 'Китай'],
  ['JP', 'Япония', 'Japan', 'Японія'],
  ['KR', 'Южная Корея', 'South Korea', 'Південна Корея'],
  ['KP', 'Северная Корея', 'North Korea', 'Північна Корея'],
  ['IN', 'Индия', 'India', 'Індія'],
  ['PK', 'Пакистан', 'Pakistan', 'Пакистан'],
  ['BD', 'Бангладеш', 'Bangladesh', 'Бангладеш'],
  ['LK', 'Шри-Ланка', 'Sri Lanka', 'Шрі-Ланка'],
  ['NP', 'Непал', 'Nepal', 'Непал'],
  ['BT', 'Бутан', 'Bhutan', 'Бутан'],
  ['MM', 'Мьянма', 'Myanmar', 'М’янма'],
  ['TH', 'Таиланд', 'Thailand', 'Таїланд'],
  ['VN', 'Вьетнам', 'Vietnam', 'В’єтнам'],
  ['LA', 'Лаос', 'Laos', 'Лаос'],
  ['KH', 'Камбоджа', 'Cambodia', 'Камбоджа'],
  ['MY', 'Малайзия', 'Malaysia', 'Малайзія'],
  ['SG', 'Сингапур', 'Singapore', 'Сінгапур'],
  ['ID', 'Индонезия', 'Indonesia', 'Індонезія'],
  ['PH', 'Филиппины', 'Philippines', 'Філіппіни'],
  ['BN', 'Бруней', 'Brunei', 'Бруней'],
  ['TL', 'Восточный Тимор', 'Timor-Leste', 'Східний Тимор'],
  ['MN', 'Монголия', 'Mongolia', 'Монголія'],
  ['TW', 'Тайвань', 'Taiwan', 'Тайвань'],
  ['HK', 'Гонконг', 'Hong Kong', 'Гонконг'],
  ['MO', 'Макао', 'Macao', 'Макао'],
  ['IL', 'Израиль', 'Israel', 'Ізраїль'],
  ['PS', 'Палестина', 'Palestine', 'Палестина'],
  ['JO', 'Иордания', 'Jordan', 'Йорданія'],
  ['LB', 'Ливан', 'Lebanon', 'Ліван'],
  ['SY', 'Сирия', 'Syria', 'Сирія'],
  ['IQ', 'Ирак', 'Iraq', 'Ірак'],
  ['IR', 'Иран', 'Iran', 'Іран'],
  ['SA', 'Саудовская Аравия', 'Saudi Arabia', 'Саудівська Аравія'],
  ['AE', 'ОАЭ', 'United Arab Emirates', 'ОАЕ'],
  ['QA', 'Катар', 'Qatar', 'Катар'],
  ['KW', 'Кувейт', 'Kuwait', 'Кувейт'],
  ['BH', 'Бахрейн', 'Bahrain', 'Бахрейн'],
  ['OM', 'Оман', 'Oman', 'Оман'],
  ['YE', 'Йемен', 'Yemen', 'Ємен'],
  ['AF', 'Афганистан', 'Afghanistan', 'Афганістан'],
  ['AU', 'Австралия', 'Australia', 'Австралія'],
  ['NZ', 'Новая Зеландия', 'New Zealand', 'Нова Зеландія'],
  ['FJ', 'Фиджи', 'Fiji', 'Фіджі'],
  ['PG', 'Папуа — Новая Гвинея', 'Papua New Guinea', 'Папуа Нова Гвінея'],
];

export const COUNTRIES: Country[] = ROWS.map(([code, ru, en, uk]) => ({code, names: {ru, en, uk}}));

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export const SCHENGEN_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IT', 'LV',
  'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH',
];

export function findCountry(code: string | null | undefined): Country | undefined {
  return code ? BY_CODE.get(code.toUpperCase()) : undefined;
}

export function countryName(code: string, lang: Language): string {
  return findCountry(code)?.names[lang] ?? code;
}

export function countryCodeToFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '🏳️';
  const base = 0x1f1e6;
  const chars = code
    .toUpperCase()
    .split('')
    .map((c) => base + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...chars);
}
