'use client'
import { useState, useEffect } from 'react';

export default function Header() {
  const [theme, setTheme] = useState < 'light' | 'dark' > ('dark');
  
  useEffect(() => {
    const t = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    setTheme(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);
  
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
  }
  
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-neutral/10 dark:border-neutral-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold">MQ</div>
        <div>
          <div className="text-sm font-medium">money-quick</div>
          <div className="text-xs text-neutral-400">Fast input, single-user</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button aria-label="Change theme" onClick={toggle} className="p-2 rounded-md hover:bg-neutral/10">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}