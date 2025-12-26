type Props = {
  value: number,
  onNum: (n: number) => void,
  onBack: () => void,
  onOk: () => void
};
const keys = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [0, 'back', 'ok']
];

export default function Numpad({ value, onNum, onBack, onOk }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs py-4">
      {keys.flat().map((k, i) =>
        <button
          key={i}
          style={{ height: 54 }}
          className="text-2xl rounded bg-[#232e43] focus:outline-none"
          onClick={() => {
            if (typeof k === "number") onNum(k);
            else if (k === "back") onBack();
            else if (k === "ok") onOk();
          }}
        >
          {k === "back" ? "⌫" : k === "ok" ? "✔" : k}
        </button>
      )}
    </div>
  );
}