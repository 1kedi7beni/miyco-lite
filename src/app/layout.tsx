import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Miyco Lite - Open Source FSM',
  description:
    'Lightweight open source field service dispatcher with workflow stages and smart assignment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-slate-50 text-slate-900 h-screen overflow-hidden">
        <div className="flex h-screen w-full bg-slate-50">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            <Header />
            <main className="flex-1 overflow-auto bg-slate-50">
              <div className="p-6 md:p-8">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
