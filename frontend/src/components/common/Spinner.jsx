const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
  xl: 'h-8 w-8',
};

/** Spinner de carga único para toda la app (antes estaba copiado en 7 páginas). */
export default function Spinner({ size = 'lg', className = 'py-14' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg className={`animate-spin ${SIZES[size] ?? SIZES.lg} text-[#1e3a5f]`} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}
