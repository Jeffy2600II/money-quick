'use client'
import { useEffect, useState } from 'react';

export default function Balance({ value }: { value: number }) {
  const [anim, setAnim] = useState(false);
  useEffect(() => { setAnim(true); const t = setTimeout(() => setAnim(false), 400); return () => clearTimeout(t); }, [value]);
  return (
    <div className="flex flex-col items-start">
      <div className="text-sm text-neutral">ยอดคงเหลือ</div>
      <div className={`text-3xl font-extrabold ${anim ? 'scale-105 transition-transform' : ''}`}>฿{value.toLocaleString()}</div>
    </div>
  );
}