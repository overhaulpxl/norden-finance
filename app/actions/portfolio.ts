'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import type { PortfolioAsset, AssetClass } from '../../types';

function getPortfolioSettingKey(userId: string) {
  return `portfolio_assets_${userId}`;
}

export async function getPortfolioAssets(): Promise<{ success: boolean; assets: PortfolioAsset[]; error?: string }> {
  try {
    const { user } = await requireUser('basic');
    const key = getPortfolioSettingKey(user.uid);

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting || !setting.value) {
      return { success: true, assets: [] };
    }

    const assets = JSON.parse(setting.value) as PortfolioAsset[];
    return { success: true, assets };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat portofolio aset';
    return { success: false, assets: [], error: message };
  }
}

export async function savePortfolioAsset(data: {
  id?: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  unit: string;
  buyPrice: number;
  currentPrice: number;
  institution?: string;
  notes?: string;
}) {
  try {
    const { user } = await requireUser('basic');
    const key = getPortfolioSettingKey(user.uid);

    if (!data.name.trim()) throw new Error('Nama aset wajib diisi');
    if (data.quantity <= 0) throw new Error('Jumlah/kuantitas harus lebih dari 0');
    if (data.buyPrice < 0) throw new Error('Harga beli tidak boleh negatif');
    if (data.currentPrice < 0) throw new Error('Harga terkini tidak boleh negatif');

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    let assets: PortfolioAsset[] = [];
    if (setting?.value) {
      try {
        assets = JSON.parse(setting.value);
      } catch {
        assets = [];
      }
    }

    const now = new Date().toISOString();

    if (data.id) {
      // Update existing
      const idx = assets.findIndex((a) => a.id === data.id);
      if (idx !== -1) {
        assets[idx] = {
          ...assets[idx],
          name: data.name.trim(),
          assetClass: data.assetClass,
          quantity: data.quantity,
          unit: data.unit.trim() || 'unit',
          buyPrice: data.buyPrice,
          currentPrice: data.currentPrice,
          institution: data.institution?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
          updatedAt: now,
        };
      } else {
        throw new Error('Aset tidak ditemukan');
      }
    } else {
      // Create new
      const newAsset: PortfolioAsset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.uid,
        name: data.name.trim(),
        assetClass: data.assetClass,
        quantity: data.quantity,
        unit: data.unit.trim() || 'unit',
        buyPrice: data.buyPrice,
        currentPrice: data.currentPrice,
        institution: data.institution?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        updatedAt: now,
      };
      assets.unshift(newAsset);
    }

    await prisma.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(assets) },
      create: { key, value: JSON.stringify(assets) },
    });

    revalidatePath('/dashboard');
    return { success: true, assets };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan aset portofolio';
    return { success: false, error: message };
  }
}

export async function deletePortfolioAsset(id: string) {
  try {
    const { user } = await requireUser('basic');
    const key = getPortfolioSettingKey(user.uid);

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting?.value) {
      return { success: true };
    }

    const assets = (JSON.parse(setting.value) as PortfolioAsset[]).filter((a) => a.id !== id);

    await prisma.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(assets) },
      create: { key, value: JSON.stringify(assets) },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus aset';
    return { success: false, error: message };
  }
}

export async function revaluePortfolioAsset(id: string, newCurrentPrice: number) {
  try {
    const { user } = await requireUser('basic');
    const key = getPortfolioSettingKey(user.uid);

    if (newCurrentPrice < 0) throw new Error('Harga terkini tidak boleh negatif');

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting?.value) throw new Error('Data aset tidak ditemukan');

    const assets = JSON.parse(setting.value) as PortfolioAsset[];
    const asset = assets.find((a) => a.id === id);
    if (!asset) throw new Error('Aset tidak ditemukan');

    asset.currentPrice = newCurrentPrice;
    asset.updatedAt = new Date().toISOString();

    await prisma.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(assets) },
      create: { key, value: JSON.stringify(assets) },
    });

    revalidatePath('/dashboard');
    return { success: true, asset };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal merevaluasi harga aset';
    return { success: false, error: message };
  }
}
