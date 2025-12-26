export default function Balance({ value }: { value: number }) {
  return (
    <div className="mb-8 mt-4 text-center">
      <span className="block text-lg text-gray-500">ยอดคงเหลือ</span>
      <span className="block text-4xl font-bold text-blue-600">฿ {value.toLocaleString()}</span>
    </div>
  );
}