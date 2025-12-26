export default function Numpad({
  onPress,
  onClear,
  onSubmit,
}: {
  onPress: (n: string) => void
  onClear: () => void
  onSubmit: () => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {[1,2,3,4,5,6,7,8,9].map(n => (
        <button key={n} onClick={() => onPress(n.toString())}>{n}</button>
      ))}
      <button onClick={() => onPress('0')}>0</button>
      <button onClick={onClear}>⌫</button>
      <button onClick={onSubmit}>✔</button>
    </div>
  )
}