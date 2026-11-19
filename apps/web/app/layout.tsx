import type { Metadata } from 'next';
import { Inter, Noto_Sans_Thai } from 'next/font/google';
import { Footer, Navbar } from '@/components/Navbar';
import { StoreProvider } from '@/lib/store';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const thai = Noto_Sans_Thai({ subsets: ['thai'], weight: ['400', '500', '600', '700'], variable: '--font-thai' });

export const metadata: Metadata = {
  title: 'Gaming Gear Store',
  description: 'ร้านอุปกรณ์เกมมิ่งครบในที่เดียว — CSC481 ดุ๋มดึ๋ย GROUP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${inter.variable} ${thai.variable}`}>
      <body className="font-sans">
        <StoreProvider>
          <Navbar />
          <main className="mx-auto min-h-[70vh] max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
