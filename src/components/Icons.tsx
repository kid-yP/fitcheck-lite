type P = { className?: string };
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const HangerIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 8a2.5 2.5 0 1 0-2.5-2.5" /><path d="M12 8v2l9 6a1.5 1.5 0 0 1-.8 2.7H3.8A1.5 1.5 0 0 1 3 16l9-6" /></svg>
);
export const PlusIcon = ({ className }: P) => (
  <svg {...base} className={className}><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M12 8v8M8 12h8" /></svg>
);
export const LayersIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>
);
export const SparkIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" /></svg>
);
export const CloseIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const CheckIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const UploadIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
);
export const SunIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const MoonIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z" /></svg>
);
export const SearchIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></svg>
);
export const ArrowIcon = ({ className }: P) => (
  <svg {...base} width={16} height={16} className={className}><path d="M7 17 17 7M8 7h9v9" /></svg>
);
export const LogoMark = ({ className }: P) => (
  <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M6 11V6h5M26 11V6h-5M6 21v5h5M26 21v5h-5" /><path d="m11.5 16.5 3.5 3.5 6-7" />
  </svg>
);
