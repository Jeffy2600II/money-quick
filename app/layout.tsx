'use client'
import './globals.css';
import { useState, useEffect } from 'react';

export const metadata = {
  title: 'money-quick',
  description: 'Fast personal money tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
    <html lang="th">
      <body className="bg-surface min-h-screen text-base-100 antialiased">
        <div className="max-w-md mx-auto min-h-screen">
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
          <main>{children}</main>
          <footer className="text-center text-xs text-neutral-400 py-4">
            <div>Single-user • Local PIN • No categories</div>
          </footer>
        </div>
      </body>
    </html>
  );
}