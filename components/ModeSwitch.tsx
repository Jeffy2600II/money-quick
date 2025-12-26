export default function ModeSwitch({
  mode,
  setMode,
}: {
  mode: 'in' | 'out'
  setMode: (m: 'in' | 'out') => void
}) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={() => setMode('in')}>+ รายรับ</button>
      <button onClick={() => setMode('out')}>- รายจ่าย</button>
    </div>
  )
}