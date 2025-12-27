'use client';
import '../styles/globals.css';
import PopupProvider from '../components/PopupProvider';
import LoaderProvider from '../components/LoaderProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <PopupProvider>
          <LoaderProvider>
            {children}
          </LoaderProvider>
        </PopupProvider>
      </body>
    </html>
  );
}