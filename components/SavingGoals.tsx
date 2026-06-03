'use client';

import { useState } from 'react';
import { SavingGoal } from '../types';
import { formatRupiah } from '../lib/format';
import { Loader2 } from 'lucide-react';
import { addSavingGoal, updateSavingGoal, deleteSavingGoal } from '../app/actions';

export default function SavingGoals({ goals }: { goals: SavingGoal[] }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;
    setLoading(true);
    const amount = parseInt(targetAmount.replace(/\D/g, ''), 10) || 0;
    const res = await addSavingGoal(name, amount);
    if (res.success) { setName(''); setTargetAmount(''); setShowForm(false); }
    setLoading(false);
  };

  const handleUpdateCurrent = async (id: string) => {
    if (!editAmount) return;
    setLoading(true);
    const amount = parseInt(editAmount.replace(/\D/g, ''), 10) || 0;
    await updateSavingGoal(id, { currentAmount: amount });
    setEditingId(null); setEditAmount(''); setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus target tabungan ini?')) return;
    await deleteSavingGoal(id);
  };

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h3 className="text-lg font-black text-black uppercase tracking-wider">Target Tabungan</h3>
        <button onClick={() => setShowForm(!showForm)} className="brutal-btn-light text-xs px-4 py-2 cursor-pointer">
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 brutal-card bg-white p-5 flex flex-col sm:flex-row gap-3 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <input type="text" placeholder="Name (e.g. Macbook)" value={name} onChange={e => setName(e.target.value)} className="flex-1 brutal-input px-4 py-2 text-sm" required />
          <input type="text" placeholder="Target Amount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="flex-1 brutal-input px-4 py-2 text-sm" required />
          <button type="submit" disabled={loading} className="brutal-btn px-5 py-2.5 min-w-[80px] flex justify-center items-center cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Save'}
          </button>
        </form>
      )}

      {(!goals || goals.length === 0) && !showForm ? (
        <div className="text-neutral-400 font-bold text-sm py-8 text-center bg-white border-[3px] border-black border-dashed rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">No saving goals found.</div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            return (
              <div key={goal.id} className="border-b-2 border-neutral-100 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-black text-lg text-black uppercase tracking-wider">{goal.title}</h4>
                    <p className="text-sm font-black text-neutral-600 mt-1">
                      {formatRupiah(goal.currentAmount)} / <span className="text-black">{formatRupiah(goal.targetAmount)}</span>
                      {remaining > 0 && <span className="text-neutral-400 font-bold"> • {formatRupiah(remaining)} left</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-black ${progress >= 100 ? 'text-emerald-700' : 'text-black'}`}>
                      {progress.toFixed(1)}%
                    </span>
                    <button onClick={() => handleDelete(goal.id)} className="text-neutral-500 hover:text-red-650 hover:underline font-black text-xs uppercase tracking-wider cursor-pointer">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="w-full bg-[#f3f4f6] border-[2px] border-black rounded-none h-4 mb-3 overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <div className={`h-full rounded-none transition-all duration-500 border-r-[2px] border-black ${progress >= 100 ? 'bg-[#bbf7d0]' : 'bg-[#bfdbfe]'}`} style={{ width: `${progress}%` }}></div>
                </div>
                {editingId === goal.id ? (
                  <div className="flex gap-2 mt-3">
                    <input type="text" placeholder="Current Balance" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="flex-1 max-w-[150px] brutal-input text-xs py-1.5" autoFocus />
                    <button onClick={() => handleUpdateCurrent(goal.id)} disabled={loading} className="brutal-btn text-xs px-3 py-1.5 cursor-pointer">Update</button>
                    <button onClick={() => { setEditingId(null); setEditAmount(''); }} className="brutal-btn-light text-xs px-3 py-1.5 cursor-pointer">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingId(goal.id); setEditAmount(goal.currentAmount.toString()); }} className="text-xs font-black text-neutral-500 hover:text-black transition-colors mt-1 underline uppercase tracking-wider cursor-pointer">
                    Update Progress
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
