"use client";

import { useCallback, useEffect, useRef } from "react";

// Fallback timeout in case the video fails to trigger onEnded event (10 seconds)
const MAX_REVEAL_MS = 10000;

type Props = {
  visible: boolean;
  onDone: () => void;
};

export function VerificationResultReveal({ visible, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (!visible) {
      finishedRef.current = false;
      return;
    }

    finishedRef.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    const timeout = setTimeout(finish, MAX_REVEAL_MS);
    const video = videoRef.current;

    if (video) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(finish);
      }
    }

    return () => clearTimeout(timeout);
  }, [finish, visible]);

  if (!visible) return null;

  return (
    <div className="verification-result-reveal" aria-hidden="true">
      <video
        ref={videoRef}
        className="verification-result-reveal__video"
        src="/videos/docuverify-page-transition.mp4"
        muted
        autoPlay
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
    </div>
  );
}
