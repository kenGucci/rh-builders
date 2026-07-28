"use client"

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-bold text-red-400">Failed to load settings</h2>
        <p className="text-sm text-gray-400">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
