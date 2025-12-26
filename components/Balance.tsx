export default function Balance({ value }: { value: number }) {
  return (
    <div className="text-[2.7rem] font-bold py-6 select-none">
      ฿ {value.toLocaleString()}
    </div>
  );
}