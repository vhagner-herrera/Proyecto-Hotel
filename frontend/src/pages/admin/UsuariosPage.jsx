import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { getUsuarios, deleteUsuario } from '../../api/admin.api';
import TablaUsuarios from '../../components/admin/TablaUsuarios';
import ModalCrearUsuario from '../../components/admin/ModalCrearUsuario';
import ModalEditarUsuario from '../../components/admin/ModalEditarUsuario';
import Spinner from '../../components/common/Spinner';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);

  const fetchUsuarios = () =>
    getUsuarios()
      .then((res) => setUsuarios(res.data))
      .catch(() => toast.error('Error al cargar los usuarios'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchUsuarios(); }, []);

  const handleDelete = async (usuario) => {
    if (!confirm(`¿Eliminar al usuario "${usuario.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUsuario(usuario.id);
      toast.success('Usuario eliminado');
      fetchUsuarios();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al eliminar el usuario');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500 mt-0.5">Administra los accesos al sistema</p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#152b47] text-white
            text-sm font-semibold rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <Spinner />
        ) : (
          <TablaUsuarios
            usuarios={usuarios}
            onEdit={setUsuarioEditar}
            onDelete={handleDelete}
          />
        )}
      </div>

      <ModalCrearUsuario
        isOpen={modalCrear}
        onClose={() => setModalCrear(false)}
        onSuccess={fetchUsuarios}
      />
      <ModalEditarUsuario
        isOpen={!!usuarioEditar}
        onClose={() => setUsuarioEditar(null)}
        usuario={usuarioEditar}
        onSuccess={fetchUsuarios}
      />
    </div>
  );
}
