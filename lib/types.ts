export type TxType = 'in' | 'out'

export interface Transaction {
  type: TxType
  amount: number
  time: number
}