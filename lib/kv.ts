import { kv } from '@vercel/kv'
import { Transaction } from './types.js'

export async function getBalance() {
  return (await kv.get < number > ('balance')) ?? 0
}

export async function setBalance(value: number) {
  await kv.set('balance', value)
}

export async function saveTx(tx: Transaction) {
  await kv.set(`tx:${tx.time}`, tx)
}