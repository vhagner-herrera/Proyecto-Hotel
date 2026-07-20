import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ModalFinalizarEstadia({
  isOpen,
  onClose,
  onConfirm,
  numeroHabitacion,
  tipoHabitacion,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Background backdrop blur overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity" 
        onClick={!loading ? onClose : undefined} 
      />

      {/* Centered Modal Window */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center border border-gray-100 transform transition-all z-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Warning Icon Centered */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-9 h-9 text-red-600" />
          </div>
        </div>

        {/* Modal Header & Message */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Finalizar Estadía
        </h3>
        
        <p className="text-sm text-gray-600 mb-6 leading-relaxed px-2">
          ¿Confirmas finalizar la estadía de la <span className="font-semibold text-gray-900">Habitación N° {numeroHabitacion}</span> ({tipoHabitacion}) y marcarla como <span className="font-semibold text-green-700">DISPONIBLE</span>?
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-semibold
              text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-60
              text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Finalizando...</span>
              </>
            ) : (
              'Sí, Finalizar Estadía'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
