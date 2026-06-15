import { ImageResponse } from "next/og";

// Size for the generated icon
export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

// Generate the icon image dynamically
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080e1c", // Dark background theme
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="#8ff5ff" // Neon cyan
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Shield outline */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#8ff5ff20" />
          {/* Checkmark inside the shield */}
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
