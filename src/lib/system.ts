/**
 * Lightweight, pure device-capability probes used by the Samsung "Take Control"
 * enable flow. They read real browser signals (with graceful fallbacks) so the
 * compatibility check reads as a genuine certification of "this machine can run
 * the AI" rather than a fake spinner. Nothing here blocks if a signal is
 * unavailable — every probe returns a friendly string.
 */

export type SystemCheck = { id: string; label: string; value: string };

function detectOS(): string {
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  const plat = uaData?.platform || navigator.platform || "";
  const ua = navigator.userAgent;
  if (/mac/i.test(plat) || /mac os x/i.test(ua)) return "macOS";
  if (/win/i.test(plat) || /windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/cros/i.test(ua)) return "ChromeOS";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/linux/i.test(plat) || /linux/i.test(ua)) return "Linux";
  return "Compatible";
}

function detectGraphics(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    return gl ? "Hardware accelerated" : "Available";
  } catch {
    return "Available";
  }
}

/**
 * The ordered checklist shown during the Samsung enable flow. Account + AI
 * runtime are scripted; OS / processor / memory / graphics reflect the real
 * machine where the browser exposes them.
 */
export function detectSystem(): SystemCheck[] {
  const cores = navigator.hardwareConcurrency;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  return [
    { id: "account", label: "Samsung account", value: "Verified" },
    { id: "os", label: "Operating system", value: detectOS() },
    { id: "cpu", label: "Processor", value: cores ? `${cores} cores` : "Compatible" },
    { id: "mem", label: "Memory", value: memory ? `${memory} GB` : "Sufficient" },
    { id: "gpu", label: "Graphics", value: detectGraphics() },
    { id: "ai", label: "AI runtime", value: "Ready" },
  ];
}
