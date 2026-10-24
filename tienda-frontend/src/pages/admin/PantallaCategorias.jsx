import { useState, useEffect } from 'react';
import { fetchConToken } from '../../services/api';

const PantallaCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // 1. Agregamos el campo "icono" al estado inicial
  const [categoriaActual, setCategoriaActual] = useState({ id: null, nombre: '', icono: '' });
  const [modoEdicion, setModoEdicion] = useState(false);
  
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState('');

  const cargarCategorias = () => {
    fetchConToken('/categorias')
      .then(res => res.json())
      .then(data => {
        setCategorias(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error cargando categorías:", err);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const guardarCategoria = async (e) => {
    e.preventDefault();
    if (!categoriaActual.nombre.trim()) return alert("El nombre no puede estar vacío.");

    const url = modoEdicion ? `/categorias/${categoriaActual.id}` : '/categorias';
    const metodo = modoEdicion ? 'PUT' : 'POST';

    try {
      const response = await fetchConToken(url, {
        method: metodo,
        // 2. Enviamos también el icono al backend (si está vacío manda null o string vacío)
        body: JSON.stringify({ 
            nombre: categoriaActual.nombre,
            icono: categoriaActual.icono || 'category' // Valor por defecto si lo dejan vacío
        })
      });

      if (response.ok) {
        setCategoriaActual({ id: null, nombre: '', icono: '' });
        setModoEdicion(false);
        cargarCategorias();
      } else {
        alert("Error al guardar la categoría.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const iniciarEdicion = (cat) => {
    // 3. Cargamos el icono cuando se edita
    setCategoriaActual({ id: cat.id, nombre: cat.nombre, icono: cat.icono || '' });
    setModoEdicion(true);
    setNuevaSubcategoria(''); 
    document.getElementById('input-nombre-cat')?.focus();
  };

  const cancelarEdicion = () => {
    setCategoriaActual({ id: null, nombre: '', icono: '' });
    setModoEdicion(false);
  };

  const eliminarCategoria = async (id) => {
    const confirmacion = window.confirm("¿Seguro que querés eliminar esta categoría? Si tiene productos adentro, podría dar error.");
    if (confirmacion) {
      try {
        const response = await fetchConToken(`/categorias/${id}`, { method: 'DELETE' });
        
        if (response.ok || response.status === 204) {
          setCategorias(categorias.filter(cat => cat.id !== id));
          if (categoriaActual.id === id) cancelarEdicion(); 
        } else {
          alert("No se pudo eliminar. Probablemente haya productos usando esta categoría.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const agregarSubcategoria = async (e) => {
    e.preventDefault();
    if (!nuevaSubcategoria.trim()) return;

    try {
      const response = await fetchConToken(`/categorias/${categoriaActual.id}/subcategorias`, {
        method: 'POST',
        body: JSON.stringify({ nombre: nuevaSubcategoria })
      });

      if (response.ok) {
        setNuevaSubcategoria(''); 
        cargarCategorias(); 
        document.getElementById('input-subcat')?.focus(); 
      } else {
        alert("Error al crear la subcategoría.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const borrarSubcategoria = async (id) => {
    if (window.confirm("¿Eliminar esta subcategoría?")) {
      try {
        const response = await fetchConToken(`/categorias/subcategorias/${id}`, { method: 'DELETE' });
        
        if (response.ok || response.status === 204) {
          cargarCategorias(); 
        } else {
          alert("No se pudo eliminar. Revisa que no haya productos usándola.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };


  const categoriaSeleccionadaCompleta = categorias.find(c => c.id === categoriaActual.id);
  const subcategoriasLista = categoriaSeleccionadaCompleta?.subcategorias || [];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full font-sans">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestión de Categorías</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Organice la estructura principal de su catálogo de productos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: COMANDOS */}
        <div className="md:col-span-4 space-y-6">
          
          {/* 1. Tarjeta de Categoría Madre */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">{modoEdicion ? 'edit' : 'add_circle'}</span>
              {modoEdicion ? 'Editar Categoría Madre' : 'Nueva Categoría Madre'}
            </h2>

            <form onSubmit={guardarCategoria} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nombre</label>
                <input 
                  id="input-nombre-cat"
                  type="text" 
                  value={categoriaActual.nombre}
                  onChange={(e) => setCategoriaActual({...categoriaActual, nombre: e.target.value})}
                  placeholder="Ej: Perfumería, Limpieza..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white transition-all outline-none font-semibold"
                  required
                />
              </div>

              {/* 4. Nuevo Input para el Ícono */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                  <span>Ícono (Material Symbols)</span>
                  <a href="https://fonts.google.com/icons?icon.set=Material+Symbols" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline text-[10px] normal-case">
                    Ver íconos
                  </a>
                </label>
                <div className="flex gap-2 items-center">
                    <input 
                        type="text" 
                        value={categoriaActual.icono}
                        onChange={(e) => setCategoriaActual({...categoriaActual, icono: e.target.value.toLowerCase()})}
                        placeholder="Ej: fragrance, sanitizer..."
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white transition-all outline-none"
                    />
                    {/* Preview del Ícono en vivo */}
                    <div className="w-12 h-12 flex-shrink-0 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-200 dark:border-teal-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">
                            {categoriaActual.icono || 'category'}
                        </span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Escribí el nombre del ícono en inglés para mostrarlo en la tienda.</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">{modoEdicion ? 'save' : 'add'}</span>
                  {modoEdicion ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
                {modoEdicion && (
                  <button type="button" onClick={cancelarEdicion} className="w-full text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold py-2 transition-colors">
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 2. Tarjeta de Subcategorías (Igual que antes) */}
          {modoEdicion && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                Subcategorías de {categoriaActual.nombre}
              </h3>
              
              <form onSubmit={agregarSubcategoria} className="flex gap-2 mb-4">
                <input 
                  id="input-subcat"
                  type="text" 
                  value={nuevaSubcategoria}
                  onChange={(e) => setNuevaSubcategoria(e.target.value)}
                  placeholder="Nueva subcategoría..."
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white outline-none"
                />
                <button type="submit" className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {subcategoriasLista.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No tiene subcategorías aún.</p>
                ) : (
                  subcategoriasLista.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700/50 group">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{sub.nombre}</span>
                      <button 
                        onClick={() => borrarSubcategoria(sub.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Borrar subcategoría"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* COLUMNA DERECHA: LISTA DE CATEGORÍAS */}
        <div className="md:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Listado Activo</h3>
              <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                {categorias.length} Registros
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-900">
                    <th className="px-6 py-4">Categoría Madre</th>
                    <th className="px-6 py-4">Subcategorías</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cargando ? (
                    <tr><td colSpan="3" className="text-center py-8 text-slate-500">Cargando...</td></tr>
                  ) : categorias.length === 0 ? (
                    <tr><td colSpan="3" className="text-center py-8 text-slate-500">No hay categorías cargadas.</td></tr>
                  ) : (
                    categorias.map(cat => (
                      <tr 
                        key={cat.id} 
                        className={`transition-colors group ${categoriaActual.id === cat.id ? 'bg-teal-50 dark:bg-teal-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      >
                        <td className="px-6 py-4">
                          {/* 5. Agregamos el ícono en la tabla para que el admin lo vea */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <span className="material-symbols-outlined text-[20px]">{cat.icono || 'category'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{cat.nombre}</span>
                                <span className="text-[10px] text-slate-400">ID: #{cat.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {cat.subcategorias && cat.subcategorias.length > 0 ? (
                              cat.subcategorias.slice(0, 3).map(sub => (
                                <span key={sub.id} className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  {sub.nombre}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs italic text-slate-400">Sin subcategorías</span>
                            )}
                            {cat.subcategorias && cat.subcategorias.length > 3 && (
                              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                                +{cat.subcategorias.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => iniciarEdicion(cat)} className="px-3 py-1.5 text-xs font-bold text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-600 transition-colors rounded-lg dark:bg-teal-900/30 dark:hover:bg-teal-600">
                              Gestionar
                            </button>
                            <button onClick={() => eliminarCategoria(cat.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30" title="Eliminar Categoría Madre">
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

export default PantallaCategorias;