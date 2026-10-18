import { create } from 'zustand';

import type { IconName, Tone } from './types';

// A modal that opens while another one (a dialog, the share sheet, the file picker) is still closing doesn't show
// on iOS. Opening the next dialog after this long keeps chains of dialogs reliable.
export const DIALOG_SWITCH_DELAY_MS = 350;

// confirm / cancel: the two buttons; dismiss: backdrop tap or the Android back button.
export type AlertResult = 'confirm' | 'cancel' | 'dismiss';

export interface AlertOptions {
  title: string;
  message?: string;
  icon?: IconName;
  // danger paints the main button red.
  tone?: Tone;
  // Main button; "OK" when omitted.
  confirmLabel?: string;
  confirmIcon?: IconName;
  // Second button; a notice has none.
  cancelLabel?: string;
}

interface AlertRequest extends AlertOptions {
  id: number;
  resolve: (result: AlertResult) => void;
}

interface AlertState {
  queue: AlertRequest[];
  // The dialog that just closed, so its content stays on screen while it fades out.
  closing: AlertOptions | null;
  push: (request: AlertRequest) => void;
  // Settles the request and lets the next one in.
  settle: (id: number, result: AlertResult) => void;
}

let nextId = 0;

export const useAlertStore = create<AlertState>((set, get) => ({
  queue: [],
  closing: null,
  push: (request) => set({queue: [...get().queue, request]}),
  settle: (id, result) => {
    const request = get().queue.find((r) => r.id === id);
    set({queue: get().queue.filter((r) => r.id !== id), closing: request ?? null});
    request?.resolve(result);
  },
}));

// The app's own replacement for Alert.alert: one dialog at a time, shown on the focused screen.
export function showAlert(options: AlertOptions): Promise<AlertResult> {
  return new Promise((resolve) => {
    useAlertStore.getState().push({...options, id: nextId++, resolve});
  });
}
