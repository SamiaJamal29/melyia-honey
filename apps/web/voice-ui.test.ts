import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("switches the voice panel between Arabic RTL and English LTR", async () => {
  const script = document.createElement("script");
  script.dataset.pilot = "true";
  const descriptor = Object.getOwnPropertyDescriptor(document, "currentScript");
  Object.defineProperty(document, "currentScript", { configurable: true, value: script });
  history.replaceState(null, "", "/?voice-test=1");
  document.documentElement.lang = "ar-BH";
  try {
    Function(readFileSync("public/voice-assistant.js", "utf8"))();
    const host = document.querySelector("voice-assistant")!;
    expect(host).toHaveAttribute("dir", "rtl");
    expect(host.shadowRoot!.getElementById("launch")).toHaveAttribute("aria-label","افتح المحادثة");
    expect(host.shadowRoot!.querySelector("h2")).toBeNull();
    expect(host.shadowRoot!.textContent).not.toContain("تجربة للمالك");
    expect(host.shadowRoot!.textContent).not.toContain("نكتشف اللغة تلقائيًا");
    expect(host.shadowRoot!.querySelectorAll("#composer button")).toHaveLength(2);
    expect(host.shadowRoot!.getElementById("messages")).toHaveAttribute("role","log");
    document.documentElement.lang = "en-MY";
    await Promise.resolve();
    expect(host).toHaveAttribute("dir", "ltr");
    expect(host.shadowRoot!.getElementById("launch")).toHaveAttribute("aria-label","Open chat");
    expect(host.shadowRoot!.getElementById("command")).toHaveAttribute("placeholder","Type a message…");
    expect(host.shadowRoot!.getElementById("record")!.textContent).toBe("Record");
  } finally {
    document.querySelector("voice-assistant")?.remove();
    if (descriptor) Object.defineProperty(document, "currentScript", descriptor);
    else Reflect.deleteProperty(document, "currentScript");
  }
});
