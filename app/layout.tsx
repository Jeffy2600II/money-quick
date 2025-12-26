import './globals.css';
import Header from '../components/Header';

export const metadata = {
  title: 'money-quick',
  description: 'Fast personal money tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="dark">
      <body className="bg-surface min-h-screen text-base-100 antialiased">
        <div className="max-w-md mx-auto min-h-screen">
          <Header />
          <main>{children}</main>
          <footer className="text-center text-xs text-neutral-400 py-4">
            <div>Single-user • Local PIN • No categories</div>
          </footer>
        </div>
      </body>
    </html>
  );
}