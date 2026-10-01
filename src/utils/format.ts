import dayjs from 'dayjs';

export function daysWord(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'дней';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дня';
    return 'дней';
}

export function tripDays(entry: string, exit: string | null): number {
    const end = exit ? dayjs(exit) : dayjs();
    return Math.max(1, end.diff(dayjs(entry), 'day') + 1);
}

export function toStartOfDay(date: Date | null | undefined): Date | undefined {
    if (!date) return undefined;
    return dayjs(date).startOf('day').toDate();
}