import type { NextConfig } from "next";
import path from "node:path";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";
const apiOrigin = (() => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "http://127.0.0.1:4000";
  }
})();
const isDevelopment = process.env.NODE_ENV === "development";
const authEmulatorOrigin = (() => {
  if (!isDevelopment || !process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL) {
    return undefined;
  }

  try {
    return new URL(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL).origin;
  } catch {
    return undefined;
  }
})();

interface ContentSecurityPolicyOptions {
  readonly apiOrigin: string;
  readonly authEmulatorOrigin?: string;
  readonly isDevelopment: boolean;
}

export const buildContentSecurityPolicy = ({
  apiOrigin: allowedApiOrigin,
  authEmulatorOrigin: allowedAuthEmulatorOrigin,
  isDevelopment: developmentMode,
}: ContentSecurityPolicyOptions): string => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${developmentMode ? " 'unsafe-eval'" : ""} https://www.gstatic.com https://www.google.com https://www.recaptcha.net`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://firebasestorage.googleapis.com${developmentMode ? " http://127.0.0.1:9199 http://localhost:9199" : ""}`,
  "font-src 'self' data:",
  `connect-src 'self' ${allowedApiOrigin}${developmentMode && allowedAuthEmulatorOrigin ? ` ${allowedAuthEmulatorOrigin}` : ""} https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com${developmentMode ? " ws: wss:" : ""}`,
  "frame-src https://www.google.com https://www.recaptcha.net https://*.firebaseapp.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(developmentMode ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const contentSecurityPolicy = buildContentSecurityPolicy({
  apiOrigin,
  authEmulatorOrigin,
  isDevelopment,
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { unoptimized: true },
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
