import { describe, expect, it } from "vitest";

import { buildAdminUserDocument } from "../src/scripts/admin-user-document.js";

// Regression: ISSUE-005 — bootstrap wrote an empty phone that broke user serialization.
// Found by /qa on 2026-07-15
// Report: .gstack/qa-reports/qa-report-localhost-2026-07-15.md
describe("buildAdminUserDocument", () => {
  it("omits a missing phone and preserves a valid Firebase phone", () => {
    const timestamp = { serverTimestamp: true };
    const withoutPhone = buildAdminUserDocument(
      "admin@melyia.test",
      { displayName: "Melyia Admin" },
      timestamp,
    );
    const withPhone = buildAdminUserDocument(
      "admin@melyia.test",
      { phoneNumber: "+60123456789" },
      timestamp,
    );

    expect(withoutPhone).not.toHaveProperty("phone");
    expect(withPhone).toMatchObject({ phone: "+60123456789", role: "admin" });
  });
});
