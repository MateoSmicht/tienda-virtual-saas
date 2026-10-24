import { useState, useEffect } from 'react';
import { fetchConToken } from '../../services/api'; 

const PantallaClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [busqueda, setBusqueda] = useState('');

  const [clienteActual, setClienteActual] = useState({
    id: null,
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '' 
  });
  
  const [modoEdicion, setModoEdicion] = useState(false);

  // 1. TRAER TODOS LOS CLIENTES (GET /user)
  const cargarClientes = () => {
    fetchConToken('/user') 
      .then(res => res.json())
      .then(data => {
        setClientes(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error cargando clientes:", err);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // 2. MAGIA DE VELOCIDAD: Saltar con Enter
  const saltarConEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      if (form.elements[index + 1]) {
        form.elements[index + 1].focus();
      } else {
        document.getElementById('btn-guardar-cliente')?.focus();
      }
    }
  };

  // 3. GUARDAR (POST /register  o  PUT /user/{id})
  const guardarCliente = async (e) => {
    e.preventDefault();
    
   
    const url = modoEdicion 
      ? `/user/${clienteActual.id}` 
      : '/register';
      
    const metodo = modoEdicion ? 'PUT' : 'POST';

    try {
      const response = await fetchConToken(url, {
        method: metodo,
        body: JSON.stringify(clienteActual)
      });

      if (response.ok) {
        alert(modoEdicion ? "¡Cliente actualizado!" : "¡Cliente registrado con éxito!");
        
        setClienteActual({ id: null, nombre: '', apellido: '', email: '', telefono: '', password: '' });
        setModoEdicion(false);
        cargarClientes(); 
        setTimeout(() => document.getElementById('input-nombre')?.focus(), 100);
      } else {
        alert("Error al guardar el cliente. Verificá que el email no esté repetido.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // 4. PREPARAR EDICIÓN
  const iniciarEdicion = (cli) => {
    setClienteActual({ 
      id: cli.id, 
      nombre: cli.nombre || '', 
      apellido: cli.apellido || '', 
      email: cli.email || '', 
      telefono: cli.telefono || '',
      password: '' 
    });
    setModoEdicion(true);
    document.getElementById('input-nombre')?.focus();
  };

  const cancelarEdicion = () => {
    setClienteActual({ id: null, nombre: '', apellido: '', email: '', telefono: '', password: '' });
    setModoEdicion(false);
  };

  // 5. ELIMINAR (DELETE /user/{id})
  const eliminarCliente = async (id) => {
    if (window.confirm("¿Seguro que querés eliminar a este cliente? Esta acción es irreversible.")) {
      try {

        const response = await fetchConToken(`/user/${id}`, { method: 'DELETE' });
        
        if (response.ok || response.status === 204) {
          setClientes(clientes.filter(cli => cli.id !== id));
          if (clienteActual.id === id) cancelarEdicion();
        } else {
          alert("No se pudo eliminar el cliente.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const handleChange = (e) => {
    setClienteActual({
      ...clienteActual,
      [e.target.name]: e.target.value
    });
  };

  // 6. LÓGICA DEL BUSCADOR
  const clientesFiltrados = clientes.filter(cli => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    const nombreCompleto = `${cli.nombre || ''} ${cli.apellido || ''}`.toLowerCase();
    return nombreCompleto.includes(termino) || (cli.email || '').toLowerCase().includes(termino);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestión de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Administre la base de datos de usuarios y contactos.</p>
        </div>
        
        {/* BUSCADOR */}
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-lg">search</span>
          <input 
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
            
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">{modoEdicion ? 'manage_accounts' : 'person_add'}</span>
              {modoEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>

            <form onSubmit={guardarCliente} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nombre</label>
                  <input id="input-nombre" name="nombre" type="text" value={clienteActual.nombre} onChange={handleChange} onKeyDown={saltarConEnter} required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Apellido</label>
                  <input name="apellido" type="text" value={clienteActual.apellido} onChange={handleChange} onKeyDown={saltarConEnter} required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Email</label>
                <input name="email" type="email" value={clienteActual.email} onChange={handleChange} onKeyDown={saltarConEnter} required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Teléfono</label>
                <input name="telefono" type="text" value={clienteActual.telefono} onChange={handleChange} onKeyDown={saltarConEnter}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white transition-all outline-none"
                />
              </div>

              {/* La contraseña solo la pedimos si es un cliente NUEVO */}
              {!modoEdicion && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Contraseña</label>
                  <input name="password" type="password" value={clienteActual.password} onChange={handleChange} onKeyDown={saltarConEnter} required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white transition-all outline-none"
                  />
                </div>
              )}

              <div className="pt-4 flex flex-col gap-2">
                <button id="btn-guardar-cliente" type="submit" className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">{modoEdicion ? 'save' : 'add'}</span>
                  {modoEdicion ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
                
                {modoEdicion && (
                  <button type="button" onClick={cancelarEdicion} className="w-full text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold py-2 transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: TABLA DE CLIENTES */}
        <div className="md:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Listado de Clientes</h3>
              <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                {clientesFiltrados.length} Registros
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-900">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cargando ? (
                    <tr><td colSpan="3" className="text-center py-12 text-slate-500">Cargando base de datos...</td></tr>
                  ) : clientesFiltrados.length === 0 ? (
                    <tr><td colSpan="3" className="text-center py-12 text-slate-500">No se encontraron clientes.</td></tr>
                  ) : (
                    clientesFiltrados.map(cli => (
                      <tr key={cli.id} className={`transition-colors group ${clienteActual.id === cli.id ? 'bg-teal-50 dark:bg-teal-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                        
                        {/* Nombre y Avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-lg border border-teal-200 dark:border-teal-800/50">
                              {cli.nombre ? cli.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {cli.nombre} {cli.apellido}
                              </span>
                              <span className="text-[10px] text-slate-400">ID: #{cli.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">mail</span>
                              {cli.email || 'Sin email'}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                              {cli.telefono || 'Sin teléfono'}
                            </span>
                          </div>
                        </td>

                        {/* Botones */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => iniciarEdicion(cli)} className="px-3 py-1.5 text-xs font-bold text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-600 transition-colors rounded-lg dark:bg-teal-900/30 dark:hover:bg-teal-600">
                              Editar
                            </button>
                            <button onClick={() => eliminarCliente(cli.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30" title="Eliminar Cliente">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PantallaClientes;