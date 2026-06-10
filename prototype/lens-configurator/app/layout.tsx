import type { Metadata } from 'next'
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const sourceSerif = Source_Serif_4({
  variable: '--font-serif-src',
  subsets: ['latin'],
  display: 'swap',
})

const plexSans = IBM_Plex_Sans({
  variable: '--font-sans-src',
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-mono-src',
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Optic Mărășești — Configurator lentile',
  description:
    'Configurează lentilele tale de prescripție: tratament, comportament la lumină, subțiere și rețetă.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ro"
      className={`${sourceSerif.variable} ${plexSans.variable} ${plexMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
