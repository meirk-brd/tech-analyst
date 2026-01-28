export function LeftSideDecoration() {
  return (
    <svg
      className="fixed left-0 top-0 h-full w-[220px] pointer-events-none hidden lg:block"
      viewBox="0 0 220 662"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMinYMid slice"
    >
      <rect width="220" height="662" fill="#091B36" />

      {/* Vertical grid lines */}
      <line x1="77" y1="0" x2="77" y2="662" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="212" y1="0" x2="212" y2="662" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />

      {/* Horizontal grid lines */}
      <line x1="0" y1="128" x2="220" y2="128" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="0" y1="263" x2="220" y2="263" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="0" y1="398" x2="220" y2="398" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="0" y1="532" x2="220" y2="532" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />

      {/* Purple accent line with dot */}
      <line x1="26" y1="263" x2="82" y2="263" stroke="url(#leftPurpleGradient)" strokeWidth="2" />
      <circle cx="105" cy="263" r="4" fill="#9D97F4" />

      {/* Cyan accent line with dot */}
      <line x1="105" y1="532" x2="161" y2="532" stroke="url(#leftCyanGradient)" strokeWidth="2" />
      <circle cx="184" cy="532" r="4" fill="#00E0FF" />

      {/* Blue star at intersection */}
      <path
        d="M77.16 121.16L78.31 124.26C78.64 125.15 79.34 125.85 80.23 126.18L83.33 127.33C83.58 127.42 83.58 127.78 83.33 127.87L80.23 129.02C79.34 129.35 78.64 130.05 78.31 130.94L77.16 134.04C77.06 134.29 76.71 134.29 76.62 134.04L75.47 130.94C75.13 130.05 74.43 129.35 73.55 129.02L70.45 127.87C70.2 127.78 70.2 127.42 70.45 127.33L73.55 126.18C74.43 125.85 75.13 125.15 75.47 124.26L76.62 121.16C76.71 120.91 77.06 120.91 77.16 121.16Z"
        fill="#3D7FFC"
      />

      {/* White star at lower intersection */}
      <path
        d="M78.48 392.81L79.64 395.91C79.97 396.8 80.67 397.5 81.56 397.83L84.65 398.98C84.9 399.07 84.9 399.43 84.65 399.52L81.56 400.67C80.67 401 79.97 401.7 79.64 402.59L78.48 405.69C78.39 405.94 78.04 405.94 77.94 405.69L76.79 402.59C76.46 401.7 75.76 401 74.87 400.67L71.77 399.52C71.52 399.43 71.52 399.07 71.77 398.98L74.87 397.83C75.76 397.5 76.46 396.8 76.79 395.91L77.94 392.81C78.04 392.56 78.39 392.56 78.48 392.81Z"
        fill="white"
        fillOpacity="0.2"
      />

      <defs>
        <linearGradient id="leftPurpleGradient" x1="26" y1="263" x2="82" y2="263" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9D97F4" stopOpacity="0" />
          <stop offset="1" stopColor="#9D97F4" />
        </linearGradient>
        <linearGradient id="leftCyanGradient" x1="105" y1="532" x2="161" y2="532" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E0FF" stopOpacity="0" />
          <stop offset="1" stopColor="#00E0FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function RightSideDecoration() {
  return (
    <svg
      className="fixed right-0 top-0 h-full w-[220px] pointer-events-none hidden lg:block"
      viewBox="0 0 220 662"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMaxYMid slice"
    >
      <rect width="220" height="662" fill="#091B36" />

      {/* Vertical grid lines */}
      <line x1="8" y1="0" x2="8" y2="662" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="143" y1="0" x2="143" y2="662" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />

      {/* Horizontal grid lines */}
      <line x1="0" y1="4" x2="220" y2="4" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="0" y1="139" x2="220" y2="139" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="0" y1="273" x2="220" y2="273" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="0" y1="408" x2="220" y2="408" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="0" y1="543" x2="220" y2="543" stroke="#29436E" strokeWidth="1" strokeOpacity="0.6" />

      {/* Blue accent line */}
      <line x1="134" y1="139" x2="190" y2="139" stroke="url(#rightBlueGradient)" strokeWidth="2" />

      {/* Purple accent line with dot */}
      <line x1="78" y1="273" x2="134" y2="273" stroke="url(#rightPurpleGradient)" strokeWidth="2" />
      <circle cx="157" cy="273" r="4" fill="#9D97F4" />

      {/* Cyan accent line with dot */}
      <line x1="140" y1="543" x2="196" y2="543" stroke="url(#rightCyanGradient)" strokeWidth="2" />
      <circle cx="219" cy="543" r="4" fill="#00E0FF" />

      {/* Blue star at intersection */}
      <path
        d="M143.62 133.59L142.47 136.69C142.13 137.58 141.43 138.28 140.55 138.61L137.45 139.76C137.2 139.85 137.2 140.21 137.45 140.3L140.55 141.45C141.43 141.79 142.13 142.48 142.47 143.37L143.62 146.47C143.71 146.72 144.06 146.72 144.16 146.47L145.31 143.37C145.64 142.48 146.34 141.79 147.23 141.45L150.33 140.3C150.58 140.21 150.58 139.85 150.33 139.76L147.23 138.61C146.34 138.28 145.64 137.58 145.31 136.69L144.16 133.59C144.06 133.34 143.71 133.34 143.62 133.59Z"
        fill="#3D7FFC"
      />

      {/* White star at lower intersection */}
      <path
        d="M143.62 402.7L142.47 405.8C142.13 406.68 141.43 407.38 140.55 407.72L137.45 408.87C137.2 408.96 137.2 409.31 137.45 409.41L140.55 410.56C141.43 410.89 142.13 411.59 142.47 412.48L143.62 415.58C143.71 415.83 144.06 415.83 144.16 415.58L145.31 412.48C145.64 411.59 146.34 410.89 147.23 410.56L150.33 409.41C150.58 409.31 150.58 408.96 150.33 408.87L147.23 407.72C146.34 407.38 145.64 406.68 145.31 405.8L144.16 402.7C144.06 402.45 143.71 402.45 143.62 402.7Z"
        fill="white"
        fillOpacity="0.2"
      />

      <defs>
        <linearGradient id="rightBlueGradient" x1="134" y1="139" x2="190" y2="139" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3D7FFC" stopOpacity="0" />
          <stop offset="1" stopColor="#3D7FFC" />
        </linearGradient>
        <linearGradient id="rightPurpleGradient" x1="78" y1="273" x2="134" y2="273" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9D97F4" stopOpacity="0" />
          <stop offset="1" stopColor="#9D97F4" />
        </linearGradient>
        <linearGradient id="rightCyanGradient" x1="140" y1="543" x2="196" y2="543" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E0FF" stopOpacity="0" />
          <stop offset="1" stopColor="#00E0FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
