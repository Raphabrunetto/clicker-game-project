// client/src/app/layout.tsx

import type { Metadata } from 'next'
// 1. Importa a fonte 'Inter'
import { Inter } from 'next/font/google' 
import './globals.css'

// 2. Inicializa a fonte na constante 'inter'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Clicker Game',
  description: 'Nosso jogo clicker!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 3. Adiciona a classe 'dark' aqui
    <html lang="pt-br" className="dark" suppressHydrationWarning> 
      {/* 4. Usa a classe da fonte no 'body' */}
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
