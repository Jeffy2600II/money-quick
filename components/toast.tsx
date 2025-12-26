'use client'
import { useEffect } from "react";

export default function Toast({ text, onClose }: { text: string, onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(), 1800);
    return () => clearTimeout(t);
  }, [text, onClose]);
  
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white px-4 py-2 rounded-md shadow-md">
      {text}
    </div>
  );
}