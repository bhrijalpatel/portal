"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DialogPortalProps {
  children: React.ReactNode;
  containerId?: string;
}

export function DialogPortal({
  children,
  containerId = "dialog-portal-root",
}: DialogPortalProps) {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);

    // Find or create the portal container
    let portalContainer = document.getElementById(containerId);

    if (!portalContainer) {
      portalContainer = document.createElement("div");
      portalContainer.id = containerId;
      document.body.appendChild(portalContainer);
    }

    setContainer(portalContainer);

    return () => {
      // Clean up if this was the last portal using this container
      if (portalContainer && portalContainer.childNodes.length === 0) {
        portalContainer.remove();
      }
    };
  }, [containerId]);

  if (!mounted || !container) {
    return null;
  }

  return createPortal(children, container);
}
