'use client'
import { useState } from 'react'
import Balance from '@/components/Balance'
import ModeSwitch from '@/components/ModeSwitch'
import Numpad from '@/components/Numpad'

export default function Home() {
  const [value, setValue] = useState('0')
  const [mode, setMode] = useState < 'in' | 'out' > ('out')
  const [balance, setBalance] = useState < number | null > (null)
  
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
      <Balance value={balance} />
      <ModeSwitch mode={mode} setMode={setMode} />

      <h2>{mode === 'in' ? '+' : '-'} {value}</h2>

      <Numpad
        onPress={n => setValue(v => (v === '0' ? n : v + n))}
        onClear={() => setValue('0')}
        onSubmit={submit}
      />
    </main>
  )
}