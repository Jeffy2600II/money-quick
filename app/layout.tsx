'use client';
import '../styles/globals.css'; // <-- แก้เป็น ../styles/globals.css (ไฟล์จริงอยู่ที่ /styles)
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