import Spline from "@splinetool/react-spline/next";

const LANDING_SPLINE_SCENE =
  "https://prod.spline.design/eSU2qhoyCJCa9BUJ/scene.splinecode";

export function LandingSplineScene() {
  return (
    <div className="landing-spline-scene" aria-hidden="true">
      <Spline scene={LANDING_SPLINE_SCENE} />
    </div>
  );
}
