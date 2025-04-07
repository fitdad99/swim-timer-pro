import SwimmerTimingApp from "@/components/swimmer-timing-app"
import { AuthProvider } from "@/components/auth-provider"
import { FirebaseProvider } from "@/components/firebase-provider"

export default function Home() {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <main className="min-h-screen p-4 md:p-8">
          <SwimmerTimingApp />
        </main>
      </AuthProvider>
    </FirebaseProvider>
  )
}

