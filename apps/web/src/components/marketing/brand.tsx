export function Brand({ markOnly = false }: { markOnly?: boolean }) {
  return (
    <span className="brand">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="brand-mark"
        aria-hidden="true"
      >
        <path
          d="M5 7.5C5 5.57 6.57 4 8.5 4h15C25.43 4 27 5.57 27 7.5v12c0 1.93-1.57 3.5-3.5 3.5H14l-7 5v-5.34A3.5 3.5 0 0 1 5 19.5v-12Z"
          fill="currentColor"
        />
        <path
          d="M11 12h10M11 16h6"
          stroke="var(--brand-mark-ink, #0c0c0d)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {!markOnly && (
        <span className="brand-wordmark">
          respondly<span className="brand-period">.</span>
        </span>
      )}
    </span>
  );
}
