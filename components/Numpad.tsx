'use client'
import React from 'react';

export default function Numpad({ value, onNum, onBack, onOk }: { value: number, onNum: (n: number) => void, onBack: () => void, onOk: () => void }) {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="grid grid-cols-3 gap-3">
        {nums.slice(0,9).map(n=>(
          <button key={n} onClick={()=>onNum(n)} className="py-4 rounded-lg bg-neutral/6 text-xl">{n}</button>
        ))}
        <div className="col-span-1">
          <button onClick={()=>onNum(0)} className="w-full py-4 rounded-lg bg-neutral/6 text-xl">0</button>
        </div>
        <button onClick={onBack} className="py-4 rounded-lg bg-neutral/6 text-xl">⌫</button>
        <button onClick={onOk} className="py-4 rounded-lg button-primary text-xl">✔</button>
      </div>
    </div>
  );
}