export default function Numpad({
  value,
  onNum,
  onBack,
  onOk,
}: {
  value: number;
  onNum: (n: number) => void;
  onBack: () => void;
  onOk: () => void;
}) {
  return (
    <div className="max-w-xs w-full my-4 mx-auto">
      <div className="mb-2 text-center text-3xl font-mono tracking-widest">
        {value ? value.toLocaleString() : "0"}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, i) => (
          <button
            key={i}
            className="p-4 text-xl bg-gray-100 rounded-lg shadow hover:bg-blue-200 active:bg-blue-300 transition"
            onClick={() => onNum(n)}
            type="button"
          >
            {n}
          </button>
        ))}
        <button className="p-4 text-xl" onClick={onBack} type="button">
          ⌫
        </button>
        <button
          className="p-4 text-xl bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          onClick={onOk}
          type="button"
        >
          ✔
        </button>
      </div>
    </div>
  );
}