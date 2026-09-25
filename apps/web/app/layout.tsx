import type { Metadata } from 'next';
import { Kanit, Orbitron } from 'next/font/google';
import { Footer, Navbar } from '@/components/Navbar';
import { StoreProvider } from '@/lib/store';
import './globals.css';

const kanit = Kanit({ subsets: ['latin', 'thai'], weight: ['300', '400', '500', '600'], variable: '--font-kanit' });
const orbitron = Orbitron({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-orbitron' });

export const metadata: Metadata = {
  title: 'Gaming Gear | ร้านอุปกรณ์เกมมิ่ง',
  description: 'ระบบร้านจำหน่ายอุปกรณ์ Gaming Gear — CSC481 ดุ๋มดึ๋ย GROUP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${kanit.variable} ${orbitron.variable}`}>
      <body className="font-sans antialiased">
        <StoreProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
