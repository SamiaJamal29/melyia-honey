import { describe, expect, it } from "vitest";
import config, { buildContentSecurityPolicy } from "./next.config";

describe("owner voice pilot", () => {
  it("limits local model access and microphone permission to the opt-in page", async () => {
    const normal = buildContentSecurityPolicy({ apiOrigin: "https://melyia.example", isDevelopment: false });
    const pilot = buildContentSecurityPolicy({ apiOrigin: "https://melyia.example", isDevelopment: false, voicePilot: true });
    expect(normal).not.toContain("http://127.0.0.1:8000");
    expect(pilot).toContain("http://127.0.0.1:8000");
    expect(normal).not.toContain("media-src");
    expect(pilot).toContain("media-src 'self' blob:");
    const headers = await config.headers!();
    expect(headers[0].headers.find(h => h.key === "Permissions-Policy")?.value).toContain("microphone=()");
    expect(headers[1].has).toEqual([{type:"query",key:"voice-test",value:"1"}]);
    expect(headers[1].headers.find(h => h.key === "Permissions-Policy")?.value).toContain("microphone=(self)");
  });
});
