import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the logo's gold ascending arrow on the page background. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#101012",
        }}
      >
        <svg width="104" height="104" viewBox="0 0 96 96" fill="none">
          <path
            d="M 12 84 L 84 12 M 84 12 L 84 58 M 84 12 L 38 12"
            stroke="#E8C987"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
