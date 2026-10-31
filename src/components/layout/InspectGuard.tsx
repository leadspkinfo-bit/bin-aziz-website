"use client";

import { useEffect } from "react";

/**
 * Discourages casual copying: blocks right-click and the usual DevTools /
 * view-source shortcuts. Browsers don't let a site truly disable DevTools —
 * it can still be opened from the browser menu — so treat this as a deterrent.
 */
export function InspectGuard() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const blocked =
        key === "F12" ||
        (ctrl && e.shiftKey && ["I", "J", "C"].includes(key)) ||
        (ctrl && e.altKey && ["I", "J", "C"].includes(key)) || // macOS
        (ctrl && key === "U");
      if (blocked) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
