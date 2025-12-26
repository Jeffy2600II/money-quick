import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { type, amount } = await req.json()

  if (
    (type !== 'in' && type !== 'out') ||
    typeof amount !== 'number' ||
    amount <= 0
  ) {
    return NextResponse.json(
      { error: 'invalid data' },
      { status: 400 }
    )
  }

  const balance = (await kv.get<number>('balance')) ?? 0
  const newBalance =
    type === 'in' ? balance + amount : balance - amount

  const time = Date.now()

  await kv.set('balance', newBalance)
  await kv.set(`tx:${time}`, {
    type,
    amount,
    time,
  })

  return NextResponse.json({
    balance: newBalance,
  })
}