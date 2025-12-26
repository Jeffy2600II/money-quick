import { NextResponse } from 'next/server'
import { getBalance, setBalance, saveTx } from '@/lib/kv'
import { Transaction } from '@/lib/types'

export async function POST(req: Request) {
  const { type, amount } = await req.json()
  
  if (
    (type !== 'in' && type !== 'out') ||
    typeof amount !== 'number' ||
    amount <= 0
  ) {
    return NextResponse.json({ error: 'invalid data' }, { status: 400 })
  }
  
  const balance = await getBalance()
  const newBalance = type === 'in' ?
    balance + amount :
    balance - amount
  
  const tx: Transaction = {
    type,
    amount,
    time: Date.now(),
  }
  
  await setBalance(newBalance)
  await saveTx(tx)
  
  return NextResponse.json({ balance: newBalance })
}