'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from 'react';
import { ArrowLeft, Check, Upload, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { submitPaymentRequest } from '../actions/payments';
import { MVP_FEATURES, MVP_FEATURES_EN } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';
import { compressReceiptImage } from '../../lib/imageCompression';
import { useLanguage } from '../../lib/i18n';

interface UpgradeClientProps {
  profile: {
    userId: string;
    fullName?: string | null;
    plan: 'trial' | 'pro';
  };
  initialRequests: PaymentRequestView[];
  paymentSettings: {
    bca_number: string;
    bca_holder: string;
    bca_active: string;
    bni_number: string;
    bni_holder: string;
    bni_active: string;
    qris_image: string;
    qris_active: string;
  };
  pricingPlans: {
    monthly: PricingPlanView | null;
    yearly: PricingPlanView | null;
  };
  initialPlan?: 'monthly' | 'yearly';
}

interface PricingPlanView {
  id: string;
  name: string;
  price: number;
  billingType: string | null;
  durationDays?: number | null;
  isActive: boolean;
}

interface PaymentRequestView {
  id: string;
  plan?: string;
  billingType: string;
  amount: number;
  paymentMethod: string;
  proofPath: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export default function UpgradeClient({ profile, initialRequests, paymentSettings, pricingPlans, initialPlan }: UpgradeClientProps) {
  const { lang } = useLanguage();
  const availableMethods: Array<'qris' | 'bca' | 'bni'> = [];
  if (paymentSettings.qris_active !== 'false') availableMethods.push('qris');
  if (paymentSettings.bca_active !== 'false') availableMethods.push('bca');
  if (paymentSettings.bni_active !== 'false') availableMethods.push('bni');
  const paymentConfigured = availableMethods.length > 0;

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(initialPlan || 'monthly');
  const [paymentMethod, setPaymentMethod] = useState<'bca' | 'bni' | 'qris'>(availableMethods[0] || 'qris');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [requests, setRequests] = useState(initialRequests);

  const handleCopyAccount = (accountNumber: string) => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    setCopiedAccount(accountNumber);
    setTimeout(() => setCopiedAccount(null), 3000);
  };
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = profile.plan === 'pro';
  const hasSelectedPlan = Boolean(pricingPlans[selectedPlan]);
  const hasPendingRequest = requests.some((r) => r.status === 'pending');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(lang === 'en' ? 'Maximum file size is 5MB.' : 'Ukuran file maksimal adalah 5MB.');
        return;
      }
      if (!selectedFile.type.startsWith('image/')) {
        setError(lang === 'en' ? 'Payment proof must be an image.' : 'Bukti pembayaran harus berupa gambar.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError(lang === 'en' ? 'Please upload transfer proof first.' : 'Silakan unggah bukti transfer terlebih dahulu.');
      return;
    }
    if (!paymentConfigured) {
      setError(lang === 'en' ? 'Payment method is not yet configured by admin.' : 'Metode pembayaran belum dikonfigurasi admin.');
      return;
    }

    setUploading(true);

    try {
      const compressedFile = await compressReceiptImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
      const formData = new FormData();
      formData.append('file', compressedFile);
      const uploadResponse = await fetch('/api/upload/payment-proof', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadData.proofPath) {
        throw new Error(uploadData.error || (lang === 'en' ? 'Failed to upload payment proof.' : 'Gagal mengunggah bukti pembayaran.'));
      }
      const proofPathValue = uploadData.proofPath as string;

      // 3. Submit Payment Request
      const selectedPricing = pricingPlans[selectedPlan];
      if (!selectedPricing) {
        throw new Error(lang === 'en' ? 'Pricing plan is currently unavailable.' : 'Paket harga sedang tidak tersedia.');
      }
      const amount = selectedPricing.price;
      const res = await submitPaymentRequest({
        billingType: selectedPlan,
        amount,
        paymentMethod,
        proofPath: proofPathValue,
      });

      if (res.success) {
        setSuccess(
          lang === 'en'
            ? 'Transfer proof sent successfully! Please wait for admin approval.'
            : 'Bukti transfer berhasil dikirim! Silakan tunggu persetujuan admin.'
        );
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Add new pending request locally to history
        const newRequest = {
          id: Math.random().toString(),
          plan: 'pro',
          billingType: selectedPlan,
          amount,
          paymentMethod,
          proofPath: proofPathValue,
          status: 'pending',
          adminNote: null,
          createdAt: new Date().toISOString(),
        };
        setRequests([newRequest, ...requests]);
      } else {
        setError(res.error || (lang === 'en' ? 'Failed to submit payment.' : 'Gagal mengirim pembayaran.'));
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : (lang === 'en' ? 'A system error occurred.' : 'Terjadi kesalahan sistem.');
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const planFeatures = lang === 'en'
    ? [...MVP_FEATURES_EN, 'Priority customer support']
    : [...MVP_FEATURES, 'Prioritas bantuan pelanggan'];
  const monthlyPrice = pricingPlans.monthly?.price ?? null;
  const yearlyPrice = pricingPlans.yearly?.price ?? null;
  const yearlySavingsPercent = monthlyPrice && yearlyPrice
    ? Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 px-4 py-2 border-[2px] border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 dark:hover:bg-neutral-700 font-black text-xs uppercase tracking-wider transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3px]" /> {lang === 'en' ? 'Back to Dashboard' : 'Kembali ke Dasbor'}
        </Link>
        <div className={`flex items-center gap-2 border-[2px] border-black dark:border-neutral-700 px-4 py-2 font-black text-xs uppercase tracking-wider ${
          hasPendingRequest
            ? 'bg-amber-200 dark:bg-amber-950/80 text-black dark:text-amber-200'
            : isPro
            ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200'
            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
        }`}>
          Status: {hasPendingRequest ? (lang === 'en' ? 'Pro (Payment Verification ⏳)' : 'Pro (Verifikasi Pembayaran ⏳)') : isPro ? 'Pro Active 👑' : 'Free Basic 🌱'}
        </div>
      </div>

      {hasPendingRequest && (
        <div className="p-4 bg-amber-100 dark:bg-amber-950/80 border-[3px] border-black dark:border-neutral-700 text-black dark:text-amber-200 font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          {lang === 'en'
            ? '⏳ Your payment proof has been submitted and is awaiting Admin review. Your Norden Pro access remains active during the verification period.'
            : '⏳ Bukti pembayaran Anda telah dikirim dan sedang menunggu tinjauan Admin. Akses fitur Norden Pro Anda tetap aktif selama masa verifikasi.'}
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Pricing Options */}
        <div className="space-y-6">
          <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-[3px] border-black dark:border-neutral-700">
            <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-wider mb-2">
              {lang === 'en' ? 'Choose Norden Pro Plan' : 'Pilih Paket Norden Pro'}
            </h2>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-6">
              {lang === 'en'
                ? 'Start managing your finances professionally with Norden AI.'
                : 'Mulai kelola keuangan Anda secara profesional dengan AI Norden.'}
            </p>

            <div className="space-y-4">
              {/* Monthly Plan */}
              {pricingPlans.monthly ? (
                <button
                  type="button"
                  onClick={() => setSelectedPlan('monthly')}
                  className={`w-full p-4 border-[3px] border-black dark:border-neutral-700 rounded-none text-left transition-all ${
                  selectedPlan === 'monthly' 
                    ? 'bg-[#fef08a] dark:bg-amber-950/80 text-black dark:text-amber-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black uppercase text-sm">
                      {lang === 'en' ? pricingPlans.monthly.name.replace(/Bulanan/i, 'Monthly') : pricingPlans.monthly.name}
                    </h4>
                    {selectedPlan === 'monthly' && (
                      <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-none border-[1px] border-black">
                        {lang === 'en' ? 'Selected' : 'Dipilih'}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-black tracking-wide">
                    {formatCurrency(pricingPlans.monthly.price)}{' '}
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      {lang === 'en' ? '/ month' : '/ bulan'}
                    </span>
                  </p>
                  <p className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mt-2 uppercase tracking-wide">
                    {lang === 'en'
                      ? 'Ideal for trying out the convenience of AI expense tracking.'
                      : 'Cocok untuk mencoba kenyamanan pencatatan AI.'}
                  </p>
                </button>
              ) : (
                <div className="p-4 border-[3px] border-dashed border-black dark:border-neutral-700 text-xs font-black uppercase text-neutral-500">
                  {lang === 'en' ? 'Monthly plan is currently disabled.' : 'Paket bulanan sedang dinonaktifkan.'}
                </div>
              )}

              {/* Yearly Plan */}
              {pricingPlans.yearly ? (
                <button
                  type="button"
                  onClick={() => setSelectedPlan('yearly')}
                  className={`w-full p-4 border-[3px] border-black dark:border-neutral-700 rounded-none text-left transition-all ${
                  selectedPlan === 'yearly' 
                    ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black uppercase text-sm">
                      {lang === 'en' ? pricingPlans.yearly.name.replace(/Tahunan/i, 'Yearly') : pricingPlans.yearly.name}
                    </h4>
                    {yearlySavingsPercent !== null && yearlySavingsPercent > 0 && (
                      <span className="bg-black text-yellow-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-none border-[1px] border-black">
                        {lang === 'en' ? `Save ${yearlySavingsPercent}%` : `Hemat ${yearlySavingsPercent}%`}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-black tracking-wide">
                    {formatCurrency(pricingPlans.yearly.price)}{' '}
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      {lang === 'en' ? '/ year' : '/ tahun'}
                    </span>
                  </p>
                  <p className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mt-2 uppercase tracking-wide">
                    {lang === 'en'
                      ? 'Best choice for long-term financial discipline.'
                      : 'Pilihan terbaik untuk disiplin keuangan jangka panjang.'}
                  </p>
                </button>
              ) : (
                <div className="p-4 border-[3px] border-dashed border-black dark:border-neutral-700 text-xs font-black uppercase text-neutral-500">
                  {lang === 'en' ? 'Yearly plan is currently disabled.' : 'Paket tahunan sedang dinonaktifkan.'}
                </div>
              )}
            </div>

            {/* Plan Features */}
            <div className="mt-8 border-t-[3px] border-black dark:border-neutral-700 pt-6">
              <h5 className="font-black text-black dark:text-white uppercase text-xs tracking-wider mb-4">
                {lang === 'en' ? 'Features You Get:' : 'Fitur yang Anda Dapatkan:'}
              </h5>
              <ul className="space-y-3">
                {planFeatures.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-bold text-black dark:text-neutral-200 uppercase tracking-wide">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3px] flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="space-y-6">
          <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-[3px] border-black dark:border-neutral-700">
            <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wider mb-4">
              {lang === 'en' ? 'Payment Confirmation' : 'Konfirmasi Pembayaran'}
            </h3>
            
            {error && (
              <div className="p-3 bg-red-100 border-[2px] border-black text-red-700 font-bold text-xs uppercase tracking-wider mb-4">
                ❌ {error}
              </div>
            )}
            {!paymentConfigured && (
              <div className="p-3 bg-yellow-100 border-[2px] border-black text-yellow-900 font-bold text-xs uppercase tracking-wider mb-4">
                {lang === 'en'
                  ? 'Payment methods are not active yet. Please contact admin before upgrading.'
                  : 'Metode pembayaran belum aktif. Hubungi admin sebelum upgrade.'}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-100 border-[2px] border-black text-emerald-800 font-bold text-xs uppercase tracking-wider mb-4">
                ✅ {success}
              </div>
            )}

            {/* Payment Method Tabs */}
            <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: `repeat(${Math.max(availableMethods.length, 1)}, minmax(0, 1fr))` }}>
              {availableMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 border-[2px] border-black dark:border-neutral-700 font-black text-xs uppercase tracking-wider rounded-none transition-all ${
                    paymentMethod === method 
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  {method}
                </button>
              ))}
              {!paymentConfigured && (
                <button type="button" disabled className="py-2 border-[2px] border-black dark:border-neutral-700 font-black text-xs uppercase tracking-wider rounded-none bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  {lang === 'en' ? 'Not available' : 'Belum tersedia'}
                </button>
              )}
            </div>

            {/* Payment Details Box */}
            <div className="p-4 border-[2px] border-black dark:border-neutral-700 bg-[#f3f4f6] dark:bg-neutral-800 rounded-none mb-6">
              {paymentMethod === 'bca' && (
                <div>
                  <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Bank BCA</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-lg font-black text-black dark:text-white tracking-wider">{paymentSettings.bca_number}</p>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(paymentSettings.bca_number)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border-[1.5px] border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                    >
                      {copiedAccount === paymentSettings.bca_number ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>
                        {copiedAccount === paymentSettings.bca_number
                          ? (lang === 'en' ? 'Copied' : 'Tersalin')
                          : (lang === 'en' ? 'Copy Account' : 'Salin Rekening')}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-1 uppercase">A.N. {paymentSettings.bca_holder}</p>
                </div>
              )}
              {paymentMethod === 'bni' && (
                <div>
                  <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Bank BNI</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-lg font-black text-black dark:text-white tracking-wider">{paymentSettings.bni_number}</p>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(paymentSettings.bni_number)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border-[1.5px] border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                    >
                      {copiedAccount === paymentSettings.bni_number ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>
                        {copiedAccount === paymentSettings.bni_number
                          ? (lang === 'en' ? 'Copied' : 'Tersalin')
                          : (lang === 'en' ? 'Copy Account' : 'Salin Rekening')}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-1 uppercase">A.N. {paymentSettings.bni_holder}</p>
                </div>
              )}
              {paymentMethod === 'qris' && (
                <div className="flex flex-col items-center justify-center py-2">
                  <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-3">QRIS Norden Merchant</p>
                  {paymentSettings.qris_image ? (
                    <div className="bg-white p-3 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
                      <img src={paymentSettings.qris_image} alt="QRIS Norden Merchant" className="max-w-[160px] max-h-[160px] object-contain border-[1px] border-neutral-300" />
                      <span className="text-[9px] font-black text-black tracking-widest mt-2 uppercase">SCAN QRIS MERCHANT</span>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                      {lang === 'en' ? 'QRIS is not yet configured by admin.' : 'QRIS belum dikonfigurasi admin.'}
                    </p>
                  )}
                </div>
              )}
              <div className="border-t-[1px] border-black dark:border-neutral-700 mt-4 pt-3">
                <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  {lang === 'en' ? 'Total Payment' : 'Total Pembayaran'}
                </p>
                <p className="text-base font-black text-black dark:text-white tracking-wide mt-0.5">
                  {hasSelectedPlan
                    ? formatCurrency(pricingPlans[selectedPlan]!.price)
                    : (lang === 'en' ? 'Plan not available' : 'Paket tidak tersedia')}
                </p>
              </div>
            </div>

            {/* Proof Upload Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-black dark:text-white">
                  {lang === 'en' ? 'Upload Transfer Proof' : 'Upload Bukti Transfer'}
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-[3px] border-dashed border-black dark:border-neutral-700 bg-[#f9fafb] dark:bg-neutral-800 p-6 text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all flex flex-col items-center justify-center"
                >
                  <Upload className="w-6 h-6 text-neutral-400 mb-2 stroke-[2.5px]" />
                  {file ? (
                    <span className="text-xs font-bold text-black dark:text-white truncate max-w-xs">{file.name}</span>
                  ) : (
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">
                      {lang === 'en' ? 'CHOOSE FILE OR PHOTO (MAX 5MB)' : 'PILIH FILE ATAU FOTO (MAX 5MB)'}
                    </span>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || isPro || !hasSelectedPlan}
                className="w-full py-3 brutal-btn font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {lang === 'en' ? 'SENDING...' : 'MENGIRIM...'}
                  </>
                ) : isPro ? (
                  lang === 'en' ? 'PRO ALREADY ACTIVE' : 'SUDAH AKTIF PRO'
                ) : !hasSelectedPlan ? (
                  lang === 'en' ? 'PLAN NOT AVAILABLE' : 'PAKET TIDAK TERSEDIA'
                ) : !paymentConfigured ? (
                  lang === 'en' ? 'PAYMENT UNAVAILABLE' : 'PEMBAYARAN TIDAK TERSEDIA'
                ) : (
                  lang === 'en' ? 'SUBMIT PAYMENT PROOF' : 'KIRIM BUKTI PEMBAYARAN'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Payment Requests History */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-[3px] border-black dark:border-neutral-700">
        <h3 className="text-base font-black text-black dark:text-white uppercase tracking-wider mb-4">
          {lang === 'en' ? 'Upgrade Requests History' : 'Riwayat Permintaan Upgrade'}
        </h3>
        {requests.length === 0 ? (
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider py-4 text-center">
            {lang === 'en' ? 'No payment history yet.' : 'Belum ada riwayat pembayaran.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-[2px] border-black dark:border-neutral-700">
              <thead>
                <tr className="bg-[#f3f4f6] dark:bg-neutral-800 border-b-[2px] border-black dark:border-neutral-700">
                  <th className="p-3 text-[10px] font-black uppercase text-black dark:text-white tracking-wider border-r-[2px] border-black dark:border-neutral-700">
                    {lang === 'en' ? 'Date' : 'Tanggal'}
                  </th>
                  <th className="p-3 text-[10px] font-black uppercase text-black dark:text-white tracking-wider border-r-[2px] border-black dark:border-neutral-700">
                    {lang === 'en' ? 'Plan' : 'Paket'}
                  </th>
                  <th className="p-3 text-[10px] font-black uppercase text-black dark:text-white tracking-wider border-r-[2px] border-black dark:border-neutral-700">
                    {lang === 'en' ? 'Method' : 'Metode'}
                  </th>
                  <th className="p-3 text-[10px] font-black uppercase text-black dark:text-white tracking-wider border-r-[2px] border-black dark:border-neutral-700">
                    Total
                  </th>
                  <th className="p-3 text-[10px] font-black uppercase text-black dark:text-white tracking-wider border-r-[2px] border-black dark:border-neutral-700">
                    Status
                  </th>
                  <th className="p-3 text-[10px] font-black uppercase text-black dark:text-white tracking-wider">
                    {lang === 'en' ? 'Admin Note' : 'Catatan Admin'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b-[2px] border-black dark:border-neutral-700 last:border-b-0 hover:bg-[#fafafa] dark:hover:bg-neutral-800/60 font-bold text-xs uppercase tracking-wide">
                    <td className="p-3 border-r-[2px] border-black dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">
                      {new Date(req.createdAt).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3 border-r-[2px] border-black dark:border-neutral-700 text-black dark:text-white">
                      PRO {req.billingType === 'monthly' ? (lang === 'en' ? 'Monthly' : 'Bulanan') : (lang === 'en' ? 'Yearly' : 'Tahunan')}
                    </td>
                    <td className="p-3 border-r-[2px] border-black dark:border-neutral-700 text-black dark:text-white">{req.paymentMethod}</td>
                    <td className="p-3 border-r-[2px] border-black dark:border-neutral-700 text-black dark:text-white">{formatCurrency(req.amount)}</td>
                    <td className="p-3 border-r-[2px] border-black dark:border-neutral-700">
                      <span className={`px-2 py-0.5 text-[10px] font-black border-[2px] border-black dark:border-neutral-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                        req.status === 'approved' ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200' :
                        req.status === 'rejected' ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-200' :
                        'bg-[#fef08a] dark:bg-amber-950/80 text-amber-950 dark:text-amber-200'
                      }`}>
                        {req.status === 'approved'
                          ? (lang === 'en' ? 'APPROVED' : 'DISETUJUI')
                          : req.status === 'rejected'
                          ? (lang === 'en' ? 'REJECTED' : 'DITOLAK')
                          : (lang === 'en' ? 'PENDING VERIFICATION' : 'MENUNGGU VERIFIKASI')}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-400 normal-case italic">{req.adminNote || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
