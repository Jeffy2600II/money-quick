export default function ToggleInOut({ mode, setMode }: { mode: 'in' | 'out', setMode: (m: 'in' | 'out') => void }) {
  return (
    <div className="flex gap-3 mb-6">
      <button
        className={mode === 'in' ? 'bg-green-700' : 'bg-gray-500'}
        onClick={() => setMode('in')}
      >+ เงินเข้า</button>
      <button
        className={mode === 'out' ? 'bg-red-700' : 'bg-gray-500'}
        onClick={() => setMode('out')}
      >− เงินออก</button>
    </div>
  );
}