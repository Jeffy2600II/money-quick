'use client'
import { useState } from 'react'

export default function Home() {
  const [value, setValue] = useState('0')
  const [mode, setMode] = useState < 'in' | 'out' > ('out')
  const [balance, setBalance] = useState < number | null > (null)
  
  const press = (n: string) => {
    setValue(v => (v === '0' ? n : v + n))
  }
  
  const clear = () => setValue('0')
  
  const submit = async () => {
    const amount = Number(value)
    if (!amount) return
    
    const res = await fetch('/api/tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: mode, amount }),
    })
    
    const data = await res.json()
    setBalance(data.balance)
    setValue('0')
  }
  
  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 20 }}>
      <h3>ยอดเงินคงเหลือ</h3>
      <h1>{balance ?? '-'}</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button onClick={() => setMode('in')}>+ รายรับ</button>
        <button onClick={() => setMode('out')}>- รายจ่าย</button>
      </div>

      <h2>{mode === 'in' ? '+' : '-'} {value}</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 10,
        }}
      >
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => press(n.toString())}>
            {n}
          </button>
        ))}
        <button onClick={() => press('0')}>0</button>
        <button onClick={clear}>⌫</button>
        <button onClick={submit}>✔</button>
      </div>
    </main>
  )
}