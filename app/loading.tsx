import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50">
      <div className="relative flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">Norden Finance</h2>
        <p className="mt-2 text-sm text-slate-500">Memuat data...</p>
      </div>
    </div>
  );
}
