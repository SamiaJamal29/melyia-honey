import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BeeIntro } from "./bee-intro";

describe("BeeIntro", () => {
  it("flies once per browser session", async () => {
    const firstVisit = render(<BeeIntro />);

    expect(await screen.findByTestId("bee-intro")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("melyia-bee-intro-seen")).toBe("1");

    firstVisit.unmount();
    render(<BeeIntro />);

    await waitFor(() => {
      expect(screen.queryByTestId("bee-intro")).not.toBeInTheDocument();
    });
  });

  it("does not animate when reduced motion is requested", async () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(<BeeIntro />);

    await waitFor(() => {
      expect(window.sessionStorage.getItem("melyia-bee-intro-seen")).toBe("1");
    });
    expect(screen.queryByTestId("bee-intro")).not.toBeInTheDocument();
  });
});
