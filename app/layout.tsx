'use client';
import './globals.css';
import LoaderProvider from '../components/LoaderProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <LoaderProvider>
          {children}
        </LoaderProvider>
      </body>
    </html>
  );
}