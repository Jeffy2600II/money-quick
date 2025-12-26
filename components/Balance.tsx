export default function Balance({ value }: { value: number | null }) {
  return (
    <>
      <h3>ยอดเงินคงเหลือ</h3>
      <h1>{value ?? '-'}</h1>
    </>
  )
}