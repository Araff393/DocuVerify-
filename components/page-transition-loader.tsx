"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const TRANSITION_MS = 1100;

export function PageTransitionLoader() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

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

    const video = videoRef.current;
    if (video && !videoFailed) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => setVideoFailed(true));
      }
    }

    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, TRANSITION_MS);
  }, [pathname, videoFailed]);

  return (
    <div
      className={`page-transition-loader ${
        visible ? "page-transition-loader--visible" : ""
      } ${videoFailed ? "page-transition-loader--fallback" : ""}`}
      aria-hidden="true"
    >
      {!videoFailed && (
        <video
          ref={videoRef}
          className="page-transition-loader__video"
          src="/videos/docuverify-page-transition.mp4"
          muted
          autoPlay
          playsInline
          preload="auto"
          onEnded={() => setVisible(false)}
          onError={() => setVideoFailed(true)}
        />
      )}
      <div className="page-transition-loader__fallback">
        <div className="page-transition-loader__mark">
          <span className="material-symbols-outlined">verified_user</span>
        </div>
        <span className="page-transition-loader__text">DocuVerify UNY</span>
      </div>
    </div>
  );
}
