'use client'
import { useState } from "react";

export default function PinInput({ onSubmit }: { onSubmit: (pin: string) => void }) {
  const [input, setInput] = useState('');
  function handleNum(n:number){ if(input.length<6) setInput(s=>s + String(n)); }
  function handleBack(){ setInput(s=> s.slice(0,-1)); }
  function handleOk(){ if(input.length>=4 && input.length<=6){ onSubmit(input); setInput(''); } }

  // prevent mobile native keyboard by not using any input element
  return (
    <div>
      <div className="flex justify-center gap-3 mb-4">
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} className="w-4 h-4 rounded-full bg-neutral/10 flex items-center justify-center">
            <div>{ input[i] ? '•' : '' }</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3,4,5,6,7,8,9].map(n=>(
          <button key={n} onClick={()=>handleNum(n)} className="py-3 rounded-lg bg-neutral/6">{n}</button>
        ))}
        <div className="col-span-1">
          <button onClick={()=>handleNum(0)} className="w-full py-3 rounded-lg bg-neutral/6">0</button>
        </div>
        <button onClick={handleBack} className="py-3 rounded-lg bg-neutral/6">⌫</button>
        <button onClick={handleOk} className="py-3 rounded-lg button-primary">✔</button>
      </div>
    </div>
  );
}