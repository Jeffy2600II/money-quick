import { useState } from "react";

export default function PinInput({ onSubmit }: { onSubmit: (pin: string) => void }) {
  const [input, setInput] = useState("");

  function handleNum(n: number) {
    if (input.length < 6) setInput(inp => inp + n.toString());
  }
  function handleBack() {
    setInput(inp => inp.slice(0, -1));
  }
  function handleOk() {
    if (input.length >= 4) onSubmit(input);
  }

  return (
    <div>
      <div className="flex gap-2 justify-center mb-4">
        {Array.from({length: Math.max(input.length,4)}, (_,i) => (
          <span key={i} className="text-3xl">{input[i] ? "•" : "○"}</span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs py-4">
        {[1,2,3,4,5,6,7,8,9,0].map((n,i) =>
          <button key={i} onClick={() => handleNum(n)}>{n}</button>
        )}
        <button onClick={handleBack}>⌫</button>
        <button onClick={handleOk}>✔</button>
      </div>
    </div>
  );
}