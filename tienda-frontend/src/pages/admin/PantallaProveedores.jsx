import { useState, useEffect } from 'react';
import { 
  traerProveedores, 
  crearProveedor, 
  modificarProveedor, 
  eliminarProveedor, 
  aumentarPreciosProveedor 
} from '../../services/api';

const PantallaProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para el Modal de Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', contacto: '', telefono: '', email: '', direccion: ''
  });

  // Estados para el Modal de AUMENTO MASIVO
  const [modalAumentoAbierto, setModalAumentoAbierto] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [porcentajeAumento, setPorcentajeAumento] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    const data = await traerProveedores();
    setProveedores(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- HANDLERS CRUD ---
  const handleAbrirModal = (prov = null) => {
    if (prov) {
      setEditandoId(prov.id);
      setFormData({ ...prov });
    } else {
      setEditandoId(null);
      setFormData({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' });
    }
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await modificarProveedor(editandoId, formData);
      } else {
        await crearProveedor(formData);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      alert("Error al guardar el proveedor");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este proveedor?")) return;
    try {
      await eliminarProveedor(id);
      cargarDatos();
    } catch (error) {
      alert("Error al eliminar. Verificá que no tenga productos asociados.");
    }
  };

  // --- HANDLER KILLER FEATURE: AUMENTO MASIVO ---
  const handleAbrirModalAumento = (prov) => {
    setProveedorSeleccionado(prov);
    setPorcentajeAumento('');
    setModalAumentoAbierto(true);
  };

  const handleAplicarAumento = async (e) => {
    e.preventDefault();
    if (!porcentajeAumento || porcentajeAumento <= 0) return alert("Ingresá un porcentaje válido");
    
    const confirmar = window.confirm(`ATENCIÓN: Vas a aumentar un ${porcentajeAumento}% TODOS los productos de ${proveedorSeleccionado.nombre}. ¿Continuar?`);
    if (!confirmar) return;

    try {
      await aumentarPreciosProveedor(proveedorSeleccionado.id, porcentajeAumento);
      alert("¡Precios actualizados con éxito!");
      setModalAumentoAbierto(false);
    } catch (error) {
      alert("Error al actualizar los precios");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full font-sans pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Proveedores</h1>
          <p className="text-slate-500 mt-1">Gestioná tu agenda comercial y actualizá listas de precios.</p>
        </div>
        <button 
          onClick={() => handleAbrirModal()} 
          className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
        >
          <span className="material-symbols-outlined">add</span> Nuevo Proveedor
        </button>
      </div>

      {/* TABLA DE PROVEEDORES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4">Empresa / Nombre</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Teléfono</th>
              <th className="px-6 py-4 text-center">Acciones Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {cargando ? (
              <tr><td colSpan="4" className="text-center py-10">Cargando proveedores...</td></tr>
            ) : proveedores.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-10 text-slate-400">No hay proveedores registrados.</td></tr>
            ) : (
              proveedores.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-200">{p.nombre}</td>
                  <td className="px-6 py-4 font-medium">{p.contacto || '-'}</td>
                  <td className="px-6 py-4">{p.telefono || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* BOTÓN ESTRELLA: Aumentar Precios */}
                      <button 
                        onClick={() => handleAbrirModalAumento(p)}
                        className="px-3 py-1.5 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 hover:bg-teal-100 rounded-lg font-bold flex items-center gap-1 transition-colors"
                        title="Aplicar aumento masivo a este proveedor"
                      >
                        <span className="material-symbols-outlined text-sm">trending_up</span> Aumentar
                      </button>
                      
                      <button onClick={() => handleAbrirModal(p)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button onClick={() => handleEliminar(p.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================= */}
      {/* MODAL 1: CREAR/EDITAR PROVEEDOR           */}
      {/* ========================================= */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-black mb-6">{editandoId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre / Empresa *</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Vendedor/Contacto</label>
                  <input type="text" value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Teléfono</label>
                  <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="ejemplo@correo.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dirección / Localidad</label>
                  <input type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="Ej: San Martín 123" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-300">Cancelar</button>
                <button type="submit" className="flex-[2] py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg">Guardar</button>
              </div>
              
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL 2: AUMENTO MASIVO (KILLER FEATURE)  */}
      {/* ========================================= */}
      {modalAumentoAbierto && proveedorSeleccionado && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border-t-4 border-teal-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-teal-500 text-3xl">price_change</span>
              <h3 className="text-xl font-black">Aumento Masivo</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
              Aplicar aumento a todos los productos pertenecientes a <strong className="text-slate-800 dark:text-slate-200">{proveedorSeleccionado.nombre}</strong>.
            </p>

            <form onSubmit={handleAplicarAumento}>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Porcentaje de Aumento (%)</label>
              <div className="relative mb-8">
                <input 
                  autoFocus
                  type="number" 
                  step="0.01"
                  required
                  value={porcentajeAumento} 
                  onChange={e => setPorcentajeAumento(e.target.value)} 
                  className="w-full p-4 pl-6 bg-slate-50 dark:bg-slate-950 border-2 border-teal-200 dark:border-teal-900/50 rounded-xl text-3xl font-black text-teal-700 dark:text-teal-400 outline-none focus:border-teal-500" 
                  placeholder="Ej: 15" 
                />
                <span className="absolute right-6 top-4 text-2xl font-black text-slate-300">%</span>
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalAumentoAbierto(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600">Cancelar</button>
                <button type="submit" className="flex-[2] py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30 transition-colors">
                  Aplicar Aumento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PantallaProveedores;