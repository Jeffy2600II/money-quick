import { kv } from '..vercel/kv'
import { Transaction } from '../lib/types'

export default async function History() {
  const keys = await kv.keys('tx:*')
  const items = await Promise.all(
    keys.map(k => kv.get < Transaction > (k))
  )
  
  const txs = items
    .filter(Boolean)
    .sort((a, b) => b!.time - a!.time)
  
  return (
    <main style={{ padding: 20 }}>
      <h2>ประวัติ</h2>
      {txs.map(tx => (
        <div key={tx!.time}>
          {tx!.type === 'in' ? '+' : '-'}
          {tx!.amount} — {new Date(tx!.time).toLocaleString()}
        </div>
      ))}
    </main>
  )
}