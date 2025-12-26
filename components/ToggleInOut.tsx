'use client'
export default function ToggleInOut({ mode, setMode }: { mode: 'in' | 'out', setMode: (m: 'in' | 'out') => void }) {
  return (
    <div className="flex gap-3">
      <button aria-pressed={mode==='in'} onClick={()=>setMode('in')}
        className={`flex-1 py-3 rounded-lg ${mode==='in' ? 'bg-green-600 text-white' : 'bg-neutral/6 text-neutral'}`}>
        + รายรับ
      </button>
      <button aria-pressed={mode==='out'} onClick={()=>setMode('out')}
        className={`flex-1 py-3 rounded-lg ${mode==='out' ? 'bg-red-600 text-white' : 'bg-neutral/6 text-neutral'}`}>
        - รายจ่าย
      </button>
    </div>
  );
}