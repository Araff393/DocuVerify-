"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const TRANSITION_MS = 2000;

export function PageTransitionLoader() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      setVisible(true);
    } else if (previousPathname.current === pathname) {
      return;
    } else {
      previousPathname.current = pathname;
      setVisible(true);
    }

    if (hideTimer.current) clearTimeout(hideTimer.current);

    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, TRANSITION_MS);
  }, [pathname]);

  return (
    <div
      className={`page-transition-loader ${visible ? "page-transition-loader--visible" : ""}`}
      aria-hidden="true"
    >
      <div className="page-transition-loader__content">
        <div className="page-transition-loader__mark">
          <span className="material-symbols-outlined">verified_user</span>
        </div>
        <span className="page-transition-loader__text">Memuat DocuVerify</span>
      </div>
    </div>
  );
}
