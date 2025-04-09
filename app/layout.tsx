import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import dynamic from 'next/dynamic'

// Dynamically import the providers to avoid static rendering issues
const FirebaseProvider = dynamic(() => import('@/components/firebase-provider').then(mod => mod.FirebaseProvider), {
  ssr: false
})

const AuthProvider = dynamic(() => import('@/components/auth-provider').then(mod => mod.AuthProvider), {
  ssr: false
})

export const metadata = {
  generator: 'v0.dev'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <FirebaseProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  )
}



import './globals.css'
