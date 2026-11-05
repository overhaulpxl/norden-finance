/**
 * Global event-driven Undo Toast notification emitter and listener.
 */

export interface UndoToastItem {
  id: string;
  message: string;
  onUndo: () => Promise<void>;
  duration?: number;
}

type UndoListener = (item: UndoToastItem) => void;
const listeners = new Set<UndoListener>();

export function triggerUndoToast(item: Omit<UndoToastItem, 'id'>) {
  const fullItem: UndoToastItem = {
    ...item,
    id: Math.random().toString(36).slice(2),
    duration: item.duration ?? 5000,
  };
  listeners.forEach((listener) => listener(fullItem));
}

export function subscribeUndoToast(listener: UndoListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
