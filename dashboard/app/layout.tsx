import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import PWAProvider from '@/components/PWAProvider';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ToastProvider } from '@/hooks/useToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Easy Market - Dashboard',
  description: 'Sistema de Inteligência Varejista - Previsões, Alertas e Análise de Demanda',
  applicationName: 'Easy Market',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Easy Market',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#0f172a',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // suppressHydrationWarning: evita warning do tema dark/light lido do localStorage antes do 1º render
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Easy Market" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/icons/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/icons/favicon-16x16.png" sizes="16x16" />
      </head>
      <body className="bg-primary text-white antialiased">
        <ToastProvider>
          <PWAProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <Breadcrumbs />
                <main className="flex-1 overflow-auto">
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </main>
              </div>
            </div>
          </PWAProvider>
          <Toaster position="top-right" />
        </ToastProvider>
      </body>
    </html>
  );
}
