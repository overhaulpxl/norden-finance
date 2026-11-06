'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { parseTransaction } from '../lib/parser';
import { CANONICAL_WALLET_DISPLAY } from '../lib/constants';
import { useLanguage } from '../lib/i18n';
import type { ParseResult } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  parsedDetails?: ParseResult;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  tx: string;
  ty: string;
}

function getInitialMessages(l: 'id' | 'en'): Message[] {
  return [
    {
      id: '1',
      sender: 'user',
      text: l === 'en' ? 'Lunch padang 35k cash' : 'Makan siang padang 35rb cash',
    },
    {
      id: '2',
      sender: 'ai',
      text:
        l === 'en'
          ? '✅ [Simulation] Successfully recorded Lunch padang of Rp 35,000. Wallet: Cash. Category: Food.'
          : '✅ [Simulasi] Berhasil mencatat Makan siang padang sebesar Rp 35.000. Dompet: Cash. Kategori: Makanan.',
    },
  ];
}

export default function ChatSandbox() {
  const { lang } = useLanguage();
  const initialMessages = getInitialMessages(lang);
  const [customMessages, setCustomMessages] = useState<Message[]>([]);
  const messages = customMessages.length > 0 ? customMessages : initialMessages;
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const triggerConfetti = () => {
    const colors = ['#FFE066', '#4B6DFE', '#2ECC71', '#FF6B6B', '#A78BFA'];
    const newParticles: Particle[] = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (i * (360 / count) * Math.PI) / 180;
      const speed = 2.5 + Math.random() * 5;
      newParticles.push({
        id: Math.random() + i,
        x: 50,
        y: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        tx: `${Math.cos(angle) * speed * 22}px`,
        ty: `${Math.sin(angle) * speed * 22}px`,
      });
    }
    setParticles(newParticles);
    setTimeout(() => {
      setParticles([]);
    }, 1200);
  };

  function handleSend(text: string) {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
    };

    setCustomMessages((prev) => [...(prev.length > 0 ? prev : initialMessages), userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const parsed = parseTransaction(text);
      let aiText = '';
      const wallet =
        CANONICAL_WALLET_DISPLAY[parsed.method.toLowerCase()] ||
        (parsed.method !== 'unknown' ? parsed.method.toUpperCase() : 'Cash');

      if (!parsed.amount || parsed.amount <= 0) {
        aiText =
          lang === 'en'
            ? 'Input format not recognized yet. Try including an amount like "coffee 25k gopay", "salary bca 5jt", or "transfer bca to dana 100k".'
            : 'Format input belum dikenali. Coba sertakan nominal seperti "kopi 25k gopay", "gaji bca 5jt", atau "transfer bca ke dana 100k".';
      } else if (parsed.isBalanceUpdate) {
        aiText =
          lang === 'en'
            ? `✅ [Simulation] ${wallet} balance successfully updated to ${formatCurrency(parsed.amount)}.`
            : `✅ [Simulasi] Saldo ${wallet} berhasil diperbarui menjadi ${formatCurrency(parsed.amount)}.`;
      } else if (parsed.type === 'transfer') {
        const toWallet = parsed.transferToMethod
          ? CANONICAL_WALLET_DISPLAY[parsed.transferToMethod.toLowerCase()] ||
            parsed.transferToMethod.toUpperCase()
          : null;
        const dest =
          lang === 'en'
            ? toWallet
              ? `to ${toWallet}`
              : 'to target wallet'
            : toWallet
            ? `ke ${toWallet}`
            : 'ke dompet tujuan';
        aiText =
          lang === 'en'
            ? `✅ [Simulation] Transfer ${formatCurrency(parsed.amount)} from ${wallet} ${dest} processed successfully.`
            : `✅ [Simulasi] Transfer ${formatCurrency(parsed.amount)} dari ${wallet} ${dest} berhasil diproses.`;
      } else if (parsed.type === 'masuk') {
        const defaultItem = lang === 'en' ? 'Income' : 'Pemasukan';
        const defaultCategory = lang === 'en' ? 'Salary' : 'Gaji';
        const item = parsed.note && parsed.note !== '-' ? parsed.note : defaultItem;
        aiText =
          lang === 'en'
            ? `✅ [Simulation] Income of ${formatCurrency(parsed.amount)} (${item}) recorded to ${wallet}. Category: ${parsed.category || defaultCategory}.`
            : `✅ [Simulasi] Pemasukan ${formatCurrency(parsed.amount)} (${item}) berhasil dicatat ke ${wallet}. Kategori: ${parsed.category || defaultCategory}.`;
      } else {
        const defaultItem = lang === 'en' ? 'Expense' : 'Pengeluaran';
        const defaultCategory = lang === 'en' ? 'Others' : 'Lain-lain';
        const item = parsed.note && parsed.note !== '-' ? parsed.note : defaultItem;
        aiText =
          lang === 'en'
            ? `✅ [Simulation] Successfully recorded ${item} of ${formatCurrency(parsed.amount)}. Wallet: ${wallet}. Category: ${parsed.category || defaultCategory}.`
            : `✅ [Simulasi] Berhasil mencatat ${item} sebesar ${formatCurrency(parsed.amount)}. Dompet: ${wallet}. Kategori: ${parsed.category || defaultCategory}.`;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        parsedDetails: parsed,
      };

      setCustomMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
      if (parsed.amount > 0) {
        triggerConfetti();
      }
    }, 800);
  }

  return (
    <div className="flex-1 p-4 bg-[#E5DDD5] overflow-hidden flex flex-col justify-between h-full relative">
      <style>{`
        @keyframes particle-explode {
          0% {
            transform: translate(-50%, -50%) scale(1) translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0) translate(var(--tx), var(--ty)) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Confetti Particle Layer */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-2 pointer-events-none z-50 rounded-none border border-black shadow-[1.5px_1.5px_0px_0px_#000]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            '--tx': p.tx,
            '--ty': p.ty,
            animation: 'particle-explode 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
          } as React.CSSProperties}
        />
      ))}

      {/* Scrollable chat body */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto mb-3 pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`self-${msg.sender === 'user' ? 'end bg-[#DCF8C6]' : 'start bg-white'} border-[1.5px] border-black p-2.5 max-w-[85%] rounded-none shadow-[2px_2px_0px_0px_#000] flex gap-2 items-start transition-all duration-200 animate-in fade-in slide-in-from-bottom-2`}
          >
            {msg.sender === 'ai' && (
              <Sparkles className="w-3.5 h-3.5 stroke-[3px] text-[#4B6DFE] shrink-0 mt-0.5" />
            )}
            <div>
              {msg.sender === 'user' ? (
                <span className="text-[9px] font-black text-neutral-600 block mb-0.5">
                  {lang === 'en' ? 'You' : 'Anda'}
                </span>
              ) : (
                <span className="text-[9px] font-black text-[#4B6DFE] block mb-0.5">Norden AI Parser</span>
              )}
              <p className="text-[10px] font-bold text-black leading-snug">{msg.text}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="self-start bg-white border-[1.5px] border-black p-2 max-w-[85%] rounded-none shadow-[2px_2px_0px_0px_#000] flex gap-1.5 items-center">
            <span className="text-[9px] font-black text-neutral-400 animate-pulse">
              {lang === 'en' ? 'Norden AI is recording...' : 'Norden AI sedang mencatat...'}
            </span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Inputs */}
      <div className="mb-2.5 flex flex-wrap gap-1.5 select-none">
        <button
          type="button"
          onClick={() => handleSend(lang === 'en' ? 'starbucks coffee 55k bca' : 'kopi starbucks 55k bca')}
          className="bg-white border-[1.5px] border-black text-[9px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-50 active:translate-y-[1px] active:shadow-none transition-all rounded-none cursor-pointer"
        >
          {lang === 'en' ? '☕ Coffee 55k BCA' : '☕ Kopi 55k BCA'}
        </button>
        <button
          type="button"
          onClick={() => handleSend(lang === 'en' ? 'salary received 12jt bca' : 'gaji masuk 12jt bca')}
          className="bg-white border-[1.5px] border-black text-[9px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-50 active:translate-y-[1px] active:shadow-none transition-all rounded-none cursor-pointer"
        >
          {lang === 'en' ? '💼 Salary 12jt BCA' : '💼 Gaji 12jt BCA'}
        </button>
        <button
          type="button"
          onClick={() => handleSend(lang === 'en' ? 'ride 22k cash' : 'gojek 22rb cash')}
          className="bg-white border-[1.5px] border-black text-[9px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-50 active:translate-y-[1px] active:shadow-none transition-all rounded-none cursor-pointer"
        >
          {lang === 'en' ? '🚗 Ride 22k Cash' : '🚗 Gojek 22rb Cash'}
        </button>
      </div>

      {/* Input bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="border-[2.5px] border-black bg-white p-1 flex items-center justify-between gap-2 shadow-[2.5px_2.5px_0px_0px_#000]"
      >
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={lang === 'en' ? 'Try typing your transaction here...' : 'Coba ketik transaksi Anda di sini...'}
          className="text-[10px] font-bold text-black pl-2 flex-1 focus:outline-none placeholder-neutral-400"
        />
        <button
          type="submit"
          className="bg-[#FFE066] border-[1.5px] border-black p-1.5 cursor-pointer hover:bg-[#ffd533] active:translate-y-[1px] transition-all"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5px]" />
        </button>
      </form>
    </div>
  );
}
