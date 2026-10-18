import React from 'react';

import { firesAt, listScheduled, scheduleTest } from '../../services/notifications/scheduler';
import { ListRow, showAlert } from '../ui';

const TEST_DELAY_SECONDS = 5;
const MAX_LISTED = 15;

function formatFireTime(ms: number): string {
  return ms === Number.MAX_SAFE_INTEGER ? '?' : new Date(ms).toLocaleString();
}

async function sendTest() {
  try {
    const ok = await scheduleTest(TEST_DELAY_SECONDS);
    if (!ok) void showAlert({icon: 'notifications-off-outline', tone: 'warning', title: 'Нет разрешения', message: 'Разрешите уведомления в системных настройках.'});
  } catch (e) {
    void showAlert({tone: 'warning', title: 'Ошибка', message: String(e)});
  }
}

async function showScheduled() {
  try {
    const requests = await listScheduled();
    const lines = requests
      .slice(0, MAX_LISTED)
      .map((r) => `${formatFireTime(firesAt(r))}\n${r.content.title ?? ''}`);
    const more = requests.length > MAX_LISTED ? `\n\n…и ещё ${requests.length - MAX_LISTED}` : '';
    void showAlert({icon: 'list-outline', title: `Запланировано: ${requests.length}`, message: lines.join('\n\n') + more || 'Пусто'});
  } catch (e) {
    void showAlert({tone: 'warning', title: 'Ошибка', message: String(e)});
  }
}

// Dev-only tools for checking local reminders without waiting for 10:00.
export function NotificationDebugRows() {
  return (
    <>
      <ListRow
        icon="notifications-outline"
        iconTone="warning"
        title="Тестовое уведомление"
        subtitle={`Ближайшее запланированное придёт через ${TEST_DELAY_SECONDS} с`}
        onPress={sendTest}
      />
      <ListRow
        icon="list-outline"
        iconTone="warning"
        title="Запланированные уведомления"
        subtitle="Даты и заголовки в очереди"
        onPress={showScheduled}
        last
      />
    </>
  );
}
