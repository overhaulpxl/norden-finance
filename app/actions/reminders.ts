'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertValidDate } from '../../lib/validators';

const CHANNELS = new Set(['in_app', 'email']);

export async function addReminder(data: {
  title: string;
  body: string;
  type?: string;
  channel?: string;
  dueAt?: string;
}) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(data.title, 'Judul pengingat');
    assertNonEmpty(data.body, 'Isi pengingat');
    assertValidDate(data.dueAt, 'Tanggal pengingat');

    const channel = data.channel || 'in_app';
    if (!CHANNELS.has(channel)) throw new Error('Channel pengingat tidak valid');

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title: data.title.trim().slice(0, 100),
        body: data.body.trim().slice(0, 300),
        type: data.type?.trim().slice(0, 40) || 'manual',
        channel,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });

    await createAuditLog(userId, 'CREATE_REMINDER', 'reminder', reminder.id);
    revalidatePath('/dashboard');
    return { success: true, data: reminder };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat pengingat';
    return { success: false, error: message };
  }
}

export async function completeReminder(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Pengingat tidak ditemukan');

    await prisma.reminder.update({
      where: { id },
      data: { completedAt: existing.completedAt ? null : new Date() },
    });

    await createAuditLog(userId, 'COMPLETE_REMINDER', 'reminder', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah pengingat';
    return { success: false, error: message };
  }
}

export async function deleteReminder(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Pengingat tidak ditemukan');

    await prisma.reminder.delete({ where: { id } });
    await createAuditLog(userId, 'DELETE_REMINDER', 'reminder', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus pengingat';
    return { success: false, error: message };
  }
}
