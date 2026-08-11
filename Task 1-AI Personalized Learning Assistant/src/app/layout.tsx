import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Personalized Learning Assistant',
  description: 'Personalized AI Learning Assistant for Internee.pk',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

/**
 * Use the self-hosted Inter font via next/font with a graceful fallback.
 * next/font/google bundles the font at build time (no runtime Google
 * request). If the font download ever fails during the build, the app
 * still builds — it falls back to the system font stack below.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
