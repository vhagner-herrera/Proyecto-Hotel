import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const ROL_BADGE = {
  ADMINISTRADOR: 'bg-blue-100 text-blue-800',
  RECEPCIONISTA: 'bg-gray-100 text-gray-700',
};

const ESTADO_BADGE = {
  ACTIVO: 'bg-green-100 text-green-700',
  INACTIVO: 'bg-red-100 text-red-700',
};

export default function TablaUsuarios({ usuarios, onEdit, onDelete }) {
  if (!usuarios?.length) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No hay usuarios registrados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Correo</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Rol</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {usuarios.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{u.nombre}</td>
              <td className="px-4 py-3 text-gray-600">{u.email ?? u.correo}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROL_BADGE[u.rol] ?? 'bg-gray-100 text-gray-600'}`}>
                  {u.rol}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_BADGE[u.estado] ?? 'bg-green-100 text-green-700'}`}>
                  {u.estado ?? 'ACTIVO'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(u)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Editar"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(u)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
