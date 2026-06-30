interface ZeMascotProps {
  size?: number;
  animated?: boolean;
  variant?: "dark" | "light";
  className?: string;
}

export function ZeMascot({
  size = 160,
  animated = true,
  variant = "dark",
  className,
}: ZeMascotProps) {
  const ticketFill = variant === "dark" ? "#000" : "#4ADE80";
  const ticketOpacity = variant === "dark" ? 0.8 : 1;
  const earFill = "#4ADE80";
  const eyeFill = variant === "dark" ? "#4ADE80" : "#030903";
  const limbFill = variant === "dark" ? "#000" : "#4ADE80";
  const limbOpacity = variant === "dark" ? 0.7 : 1;
  const footFill = variant === "dark" ? "#000" : "#22C55E";
  const footOpacity = variant === "dark" ? 0.5 : 1;
  const dashStroke =
    variant === "dark" ? "rgba(74,222,128,.3)" : "rgba(3,9,3,.22)";
  const faceStroke =
    variant === "dark" ? "rgba(74,222,128,.8)" : "rgba(3,9,3,.6)";
  const labelFill =
    variant === "dark" ? "rgba(74,222,128,.6)" : "rgba(3,9,3,.45)";
  const labelText = variant === "dark" ? "VIBRA · BRASIL" : "ZÉ · VIBRA";

  return (
    <svg
      width={size}
      height={size * 1.22}
      viewBox="0 0 280 340"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <ellipse cx="140" cy="318" rx="56" ry="8" fill="rgba(0,0,0,.1)" />
      {animated ? (
        <>
          <rect x="42" y="88" width="16" height="44" rx="8" fill={limbFill} opacity={limbOpacity}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-35,50,88;-15,50,88;-35,50,88"
              dur="1.2s"
              repeatCount="indefinite"
            />
          </rect>
          <rect x="222" y="88" width="16" height="44" rx="8" fill={limbFill} opacity={limbOpacity}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="35,230,88;15,230,88;35,230,88"
              dur="1.2s"
              repeatCount="indefinite"
            />
          </rect>
        </>
      ) : (
        <>
          <rect
            x="42"
            y="88"
            width="16"
            height="44"
            rx="8"
            fill={limbFill}
            opacity={limbOpacity}
            transform="rotate(-25,50,88)"
          />
          <rect
            x="222"
            y="88"
            width="16"
            height="44"
            rx="8"
            fill={limbFill}
            opacity={limbOpacity}
            transform="rotate(25,230,88)"
          />
        </>
      )}
      <g>
        {animated ? (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0;0,-5;0,0"
            dur="2s"
            repeatCount="indefinite"
          />
        ) : null}
        <rect
          x="58"
          y="80"
          width="164"
          height="106"
          rx="14"
          fill={ticketFill}
          opacity={ticketOpacity}
        />
        <circle cx="58" cy="133" r="14" fill={earFill} />
        <circle cx="222" cy="133" r="14" fill={earFill} />
        <line
          x1="84"
          y1="133"
          x2="196"
          y2="133"
          stroke={dashStroke}
          strokeWidth="2.5"
          strokeDasharray="6,5"
        />
        <text
          x="80"
          y="104"
          fontFamily="monospace"
          fontSize="9"
          fill={labelFill}
          fontWeight="bold"
        >
          {labelText}
        </text>
        <line
          x1="100"
          y1="150"
          x2="118"
          y2="145"
          stroke={faceStroke}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="162"
          y1="145"
          x2="180"
          y2="150"
          stroke={faceStroke}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="112" cy="162" r="8" fill={eyeFill} />
        <circle cx="115" cy="159" r="2.5" fill="white" opacity="0.7" />
        <circle cx="168" cy="162" r="8" fill={eyeFill}>
          {animated ? (
            <animate attributeName="ry" values="8;1;8" dur="4s" repeatCount="indefinite" />
          ) : null}
        </circle>
        <circle cx="171" cy="159" r="2.5" fill="white" opacity="0.7" />
        <path
          d="M102,176 Q140,196 178,176"
          stroke={faceStroke}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      {animated ? (
        <>
          <rect x="108" y="186" width="18" height="48" rx="9" fill={limbFill} opacity={limbOpacity}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-14,117,186;14,117,186"
              dur="0.65s"
              repeatCount="indefinite"
              additive="sum"
            />
          </rect>
          <rect x="98" y="230" width="26" height="13" rx="6" fill={footFill} opacity={footOpacity}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-14,117,186;14,117,186"
              dur="0.65s"
              repeatCount="indefinite"
              additive="sum"
            />
          </rect>
          <rect x="154" y="186" width="18" height="48" rx="9" fill={limbFill} opacity={limbOpacity}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="14,163,186;-14,163,186"
              dur="0.65s"
              repeatCount="indefinite"
              additive="sum"
            />
          </rect>
          <rect x="156" y="230" width="26" height="13" rx="6" fill={footFill} opacity={footOpacity}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="14,163,186;-14,163,186"
              dur="0.65s"
              repeatCount="indefinite"
              additive="sum"
            />
          </rect>
        </>
      ) : (
        <>
          <rect x="108" y="186" width="18" height="48" rx="9" fill={limbFill} opacity={limbOpacity} />
          <rect x="98" y="230" width="26" height="13" rx="6" fill={footFill} opacity={footOpacity} />
          <rect x="154" y="186" width="18" height="48" rx="9" fill={limbFill} opacity={limbOpacity} />
          <rect x="156" y="230" width="26" height="13" rx="6" fill={footFill} opacity={footOpacity} />
        </>
      )}
    </svg>
  );
}
