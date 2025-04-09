"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong!</h1>
          <p className="mb-6">There was a critical error processing your request.</p>
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Try again
            </button>
            <a href="/" className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700">
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
} 