"use client";

import { useEffect } from "react";

const PROTECTED_MEDIA_SELECTOR = "img, picture, video, canvas, [data-protected-asset]";

function isProtectedMediaTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(PROTECTED_MEDIA_SELECTOR));
}

export function AssetProtection() {
  useEffect(() => {
    function blockMediaEvent(event: Event) {
      if (isProtectedMediaTarget(event.target)) {
        event.preventDefault();
      }
    }

    function blockSaveShortcut(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
      }
    }

    document.addEventListener("contextmenu", blockMediaEvent, { capture: true });
    document.addEventListener("dragstart", blockMediaEvent, { capture: true });
    document.addEventListener("copy", blockMediaEvent, { capture: true });
    document.addEventListener("keydown", blockSaveShortcut);

    return () => {
      document.removeEventListener("contextmenu", blockMediaEvent, { capture: true });
      document.removeEventListener("dragstart", blockMediaEvent, { capture: true });
      document.removeEventListener("copy", blockMediaEvent, { capture: true });
      document.removeEventListener("keydown", blockSaveShortcut);
    };
  }, []);

  return null;
}
