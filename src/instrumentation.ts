export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startMonitoring } = await import("./lib/monitor");
      startMonitoring();
    } catch {
      // Monitor failed to start — non-critical, app still works
    }
  }
}
