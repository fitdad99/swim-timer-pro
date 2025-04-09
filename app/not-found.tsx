export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6">The page you're looking for does not exist.</p>
      <a href="/" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
        Go Home
      </a>
    </div>
  )
} 