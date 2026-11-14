import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getNotificationSupportStatus } from '../lib/browserNotification';

describe('Browser Notification Utilities', () => {
  it('returns unsupported in server-side environment safely without throwing', () => {
    // In Node.js environment, window is undefined
    const status = getNotificationSupportStatus();
    assert.equal(status, 'unsupported');
  });
});
