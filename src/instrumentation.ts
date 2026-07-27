export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMonitoring } = await import("./lib/monitor");
    startMonitoring();
  }
}
