import { showAlert, useAlertStore } from './alert';

describe('showAlert', () => {
  it('shows dialogs one at a time and resolves each with the button pressed', async () => {
    const first = showAlert({title: 'First'});
    const second = showAlert({title: 'Second', cancelLabel: 'No'});

    const {queue} = useAlertStore.getState();
    expect(queue.map((r) => r.title)).toEqual(['First', 'Second']);

    useAlertStore.getState().settle(queue[0].id, 'confirm');
    await expect(first).resolves.toBe('confirm');
    expect(useAlertStore.getState().queue.map((r) => r.title)).toEqual(['Second']);
    // The closed dialog's content stays available for its fade-out.
    expect(useAlertStore.getState().closing?.title).toBe('First');

    useAlertStore.getState().settle(queue[1].id, 'dismiss');
    await expect(second).resolves.toBe('dismiss');
    expect(useAlertStore.getState().queue).toEqual([]);
  });
});
