"use client";

import { useEffect, useState } from "react";

import { Bee } from "./bee";

const sessionKey = "melyia-bee-intro-seen";

export function BeeIntro() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(sessionKey)) return;

    window.sessionStorage.setItem(sessionKey, "1");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const startTimer = window.setTimeout(() => setIsVisible(true), 0);
    const endTimer = window.setTimeout(() => setIsVisible(false), 4_600);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="bee-intro"
      className="bee-intro pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      <div className="bee-intro__flyer">
        <span className="bee-intro__trail" />
        <Bee className="bee-intro__bee" />
      </div>
    </div>
  );
}
