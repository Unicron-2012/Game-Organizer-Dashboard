"use client";

import { useEffect, useRef } from "react";

export default function LiveBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let effect: any;

    const loadVanta = async () => {
      if (typeof window === "undefined") return;

      const THREE = await import("three");
      const NET = (await import("vanta/dist/vanta.net.min")).default;

      if (vantaRef.current && !effect) {
        effect = NET({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1,
          scaleMobile: 1,
          color: 0x7c3aed,
          backgroundColor: 0x020617,
        });
      }
    };

    loadVanta();

    return () => {
      if (effect) effect.destroy();
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      className="fixed inset-0 -z-10"
    />
  );
}