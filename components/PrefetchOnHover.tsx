'use client';
import React from 'react';
import { prefetchKey } from '../lib/prefetch';

export default function PrefetchOnHover({ href, children }: { href: string;children: React.ReactNode }) {
  return (
    <a
      href={href}
      onMouseEnter={() => { void prefetchKey(href); }}
      onFocus={() => { void prefetchKey(href); }}
      style={{ textDecoration: 'none' }}
    >
      {children}
    </a>
  );
}