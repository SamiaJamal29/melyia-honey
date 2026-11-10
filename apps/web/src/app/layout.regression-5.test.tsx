import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Hanken_Grotesk: () => ({ variable: "font-hanken" }),
  IBM_Plex_Mono: () => ({ variable: "font-plex" }),
  Newsreader: () => ({ variable: "font-newsreader" }),
}));
vi.mock("@/components/providers", () => ({
  Providers: ({ children }: { readonly children: ReactNode }) => children,
}));
vi.mock("@/components/brand/bee-intro", () => ({ BeeIntro: () => null }));

import RootLayout from "./layout";

describe("RootLayout scroll behavior regression", () => {
  it("declares smooth scrolling for Next route transitions", () => {
    const layout = RootLayout({ children: <main>Content</main> });

    expect(layout.type).toBe("html");
    expect(layout.props["data-scroll-behavior"]).toBe("smooth");
  });
});
