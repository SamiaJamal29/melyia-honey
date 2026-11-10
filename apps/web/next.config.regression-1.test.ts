import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "./next.config";

// Regression: ISSUE-002 — CSP blocked the explicitly configured Firebase Auth emulator.
// Found by /qa on 2026-07-15
// Report: .gstack/qa-reports/qa-report-localhost-2026-07-15.md
describe("buildContentSecurityPolicy", () => {
  it("allows the configured auth emulator only in development", () => {
    const developmentPolicy = buildContentSecurityPolicy({
      apiOrigin: "http://127.0.0.1:4000",
      authEmulatorOrigin: "http://127.0.0.1:9099",
      isDevelopment: true,
    });
    const productionPolicy = buildContentSecurityPolicy({
      apiOrigin: "https://api.melyia.example",
      authEmulatorOrigin: "http://127.0.0.1:9099",
      isDevelopment: false,
    });

    expect(developmentPolicy).toContain(
      "connect-src 'self' http://127.0.0.1:4000 http://127.0.0.1:9099",
    );
    expect(productionPolicy).not.toContain("http://127.0.0.1:9099");
    expect(productionPolicy).toContain("upgrade-insecure-requests");
  });
});
