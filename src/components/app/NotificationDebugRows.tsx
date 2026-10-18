import React from 'react';
import { Alert } from 'react-native';

import { firesAt, listScheduled, scheduleTest } from '../../services/notifications/scheduler';
import { ListRow } from '../ui';

const TEST_DELAY_SECONDS = 5;
const MAX_LISTED = 15;

function formatFireTime(ms: number): string {
  return ms === Number.MAX_SAFE_INTEGER ? '?' : new Date(ms).toLocaleString();
}

async function sendTest() {
  try {
    const ok = await scheduleTest(TEST_DELAY_SECONDS);
    if (!ok) Alert.alert('Нет разрешения', 'Разрешите уведомления в системных настройках.');
  } catch (e) {
    Alert.alert('Ошибка', String(e));
  }
}

async function showScheduled() {
  try {
    const requests = await listScheduled();
    const lines = requests
      .slice(0, MAX_LISTED)
      .map((r) => `${formatFireTime(firesAt(r))}\n${r.content.title ?? ''}`);
    const more = requests.length > MAX_LISTED ? `\n\n…и ещё ${requests.length - MAX_LISTED}` : '';
    Alert.alert(`Запланировано: ${requests.length}`, lines.join('\n\n') + more || 'Пусто');
  } catch (e) {
    Alert.alert('Ошибка', String(e));
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
