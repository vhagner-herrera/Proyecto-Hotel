import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getParametros, updateParametro } from '../../api/admin.api';
import Spinner from '../../components/common/Spinner';

export default function ParametrosPage() {
  const [parametros, setParametros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(null); // { clave, valor }

  const fetchParametros = () =>
    getParametros()
      .then((res) => setParametros(res.data))
      .catch(() => toast.error('Error al cargar los parámetros'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchParametros(); }, []);

  const handleEdit = (param) => {
    setEditando({ clave: param.clave, valor: param.valor });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateParametro(editando.clave, editando.valor);
      toast.success('Parámetro actualizado');
      setEditando(null);
      fetchParametros();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al actualizar el parámetro');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditando(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Parámetros Globales</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configuración general del sistema</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-2/5">Clave</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Valor</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parametros.map((p) => {
                  const isEditing = editando?.clave === p.clave;
                  return (
                    <tr key={p.clave} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 font-medium">
                        {p.clave}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editando.valor}
                            onChange={(e) =>
                              setEditando((prev) => ({ ...prev, valor: e.target.value }))
                            }
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-full px-3 py-1.5 rounded-lg border border-[#1e3a5f] text-sm
                              focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
                          />
                        ) : (
                          <span className="text-gray-900">{p.valor}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                                title="Guardar (Enter)"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditando(null)}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                                title="Cancelar (Esc)"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
