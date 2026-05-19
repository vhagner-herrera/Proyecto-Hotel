const OPCIONES = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'OCUPADA', label: 'Ocupada' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
];

export default function FiltroEstados({ estadoActual, onCambiarEstado }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPCIONES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onCambiarEstado(value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
            estadoActual === value
              ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
