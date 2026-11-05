import { processInput, addExplicitTransaction, addTransferTransaction } from '../app/actions';

export type QueuedItem =
  | { id: string; type: 'smart'; input: string; createdAt: number }
  | {
      id: string;
      type: 'explicit';
      data: {
        type: 'masuk' | 'keluar' | 'transfer';
        amount: number;
        category: string;
        wallet?: string;
        method?: string;
        note?: string;
        transactionDate?: string;
        tags?: string[];
        receiptMerchant?: string;
        receiptItems?: unknown;
        receiptDate?: string;
      };
      createdAt: number;
    }
  | {
      id: string;
      type: 'transfer';
      amount: number;
      fromWallet: string;
      toWallet: string;
      note?: string;
      tags?: string[];
      createdAt: number;
    };

const STORAGE_KEY = 'norden_offline_tx_queue';

export function getOfflineQueue(): QueuedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('norden:offline-queue-changed', { detail: { count: queue.length } }));
  } catch (err) {
    console.error('Failed to save offline queue:', err);
  }
}

export function enqueueOfflineTransaction(
  item:
    | { type: 'smart'; input: string }
    | {
        type: 'explicit';
        data: {
          type: 'masuk' | 'keluar' | 'transfer';
          amount: number;
          category: string;
          wallet?: string;
          method?: string;
          note?: string;
          transactionDate?: string;
          tags?: string[];
          receiptMerchant?: string;
          receiptItems?: unknown;
          receiptDate?: string;
        };
      }
    | {
        type: 'transfer';
        amount: number;
        fromWallet: string;
        toWallet: string;
        note?: string;
        tags?: string[];
      }
): QueuedItem {
  const queue = getOfflineQueue();
  const queuedItem: QueuedItem = {
    ...item,
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  } as QueuedItem;

  queue.push(queuedItem);
  saveQueue(queue);
  return queuedItem;
}

export function removeOfflineTransaction(id: string) {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  saveQueue(queue);
}

export function clearOfflineQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('norden:offline-queue-changed', { detail: { count: 0 } }));
}

/**
 * Replay all pending offline transactions to the server sequentially.
 */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined') return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: QueuedItem[] = [];

  for (const item of queue) {
    try {
      let res;
      if (item.type === 'smart') {
        res = await processInput(item.input);
      } else if (item.type === 'explicit') {
        res = await addExplicitTransaction(item.data);
      } else if (item.type === 'transfer') {
        res = await addTransferTransaction(item.amount, item.fromWallet, item.toWallet, item.note, item.tags);
      }

      if (res && res.success) {
        synced++;
      } else {
        failed++;
        remaining.push(item);
      }
    } catch {
      failed++;
      remaining.push(item);
    }
  }

  saveQueue(remaining);

  window.dispatchEvent(
    new CustomEvent('norden:offline-sync-complete', {
      detail: { synced, failed, remaining: remaining.length },
    })
  );

  return { synced, failed };
}
