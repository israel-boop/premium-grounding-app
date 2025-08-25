import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: 'Premium Grounding App',
  description: 'Advanced tools for mindfulness and emotional well-being',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  viewport: 'width=device-width, initial-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Premium Grounding App',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body>
        <AuthProvider>
          <DataProvider>
            <ErrorBoundary>
            {children}
            </ErrorBoundary>
          </DataProvider>
        </AuthProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}