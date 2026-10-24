import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { verificarCodigoBarras, registrarIngresoStock, traerProveedores, fetchConToken } from '../../services/api';
import { navegarTablaConFlechas } from '../../utils/navegacionTabla'; 

const PantallaCargarStockMasiva = () => {
  const navigate = useNavigate();
  const inputEscanerRef = useRef(null);
  const inputBuscadorNombreRef = useRef(null);

  const [proveedores, setProveedores] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  
  const [items, setItems] = useState([]);
  const [inputActual, setInputActual] = useState('');
  const [cargando, setCargando] = useState(false);
  
  // Estado para el doble Enter
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);

  // Estados para la búsqueda por nombre (Modal)
  const [mostrarBuscadorNombre, setMostrarBuscadorNombre] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [indiceSeleccionadoModal, setIndiceSeleccionadoModal] = useState(0);

  useEffect(() => {
    traerProveedores().then(setProveedores);
    inputEscanerRef.current?.focus();
  }, []);

  // Escuchar la tecla F2 a nivel global para abrir el buscador por nombre
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setMostrarBuscadorNombre(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Enfocar el input del modal cuando se abre
  useEffect(() => {
    if (mostrarBuscadorNombre) {
      setTimeout(() => inputBuscadorNombreRef.current?.focus(), 100);
      setTextoBusqueda('');
      setResultadosBusqueda([]);
      setIndiceSeleccionadoModal(0);
    } else {
      inputEscanerRef.current?.focus();
    }
  }, [mostrarBuscadorNombre]);

  // ==========================================
  // LÓGICA DEL ESCÁNER PRINCIPAL Y DOBLE ENTER
  // ==========================================
  const manejarTeclasEscaner = async (e) => {
    if (e.key === 'ArrowDown' && items.length > 0) {
      e.preventDefault();
      document.getElementById('cell-0-0')?.focus();
      setEsperandoConfirmacion(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const texto = inputActual.trim();

      if (texto === '') {
        if (items.length === 0) return;

        if (!esperandoConfirmacion) {
          setEsperandoConfirmacion(true); // Primer Enter vacío
        } else {
          // SEGUNDO ENTER: Preguntamos antes de guardar
          const confirmar = window.confirm("¿Está seguro que desea guardar este ingreso de mercadería?");
          if (confirmar) {
            ejecutarGuardado();
          } else {
            setEsperandoConfirmacion(false); // Canceló la confirmación
          }
        }
        return;
      }

      setEsperandoConfirmacion(false);
      procesarEntrada(texto);
    }
  };

  const procesarEntrada = async (texto) => {
    let cantidad = 1;
    let codigo = texto;

    if (texto.includes('*')) {
      const partes = texto.split('*');
      cantidad = parseInt(partes[0], 10) || 1;
      codigo = partes[1].trim();
    }

    setCargando(true);
    try {
      const productoDb = await verificarCodigoBarras(codigo);
      
      if (productoDb) {
        agregarProductoALista(productoDb, cantidad);
      } else {
        alert("⚠️ Producto no encontrado en la base de datos.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
      setInputActual('');
      inputEscanerRef.current?.focus(); 
    }
  };

  // Función reutilizable para meter el producto a la tabla
  const agregarProductoALista = (producto, cantidad = 1) => {
    setItems(prev => {
      const existe = prev.find(item => item.codigoBarras === producto.codigoBarra);
      if (existe) {
        return prev.map(item => item.codigoBarras === producto.codigoBarra 
          ? { ...item, cantidad: item.cantidad + cantidad } 
          : item);
      }
      return [{
        codigoBarras: producto.codigoBarra,
        nombre: producto.nombre,
        ppp: producto.ppp || 0,
        precio: producto.precio || 0,
        cantidad: cantidad
      }, ...prev]; 
    });
  };

  // ==========================================
  // LÓGICA DEL BUSCADOR POR NOMBRE (MODAL)
  // ==========================================
  const buscarPorNombreEnApi = async (busqueda) => {
    if (busqueda.length < 2) {
      setResultadosBusqueda([]);
      return;
    }
    try {
      const res = await fetchConToken(`/productos?todos=true&busqueda=${encodeURIComponent(busqueda)}&page=0&size=10`);
      const data = await res.json();
      setResultadosBusqueda(data.content || []);
      setIndiceSeleccionadoModal(0);
    } catch (error) {
      console.error("Error buscando:", error);
    }
  };

  const manejarTeclasModal = (e) => {
    if (e.key === 'Escape') {
      setMostrarBuscadorNombre(false);
      return;
    }
    if (resultadosBusqueda.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSeleccionadoModal(prev => (prev < resultadosBusqueda.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSeleccionadoModal(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const seleccionado = resultadosBusqueda[indiceSeleccionadoModal];
      if (seleccionado) {
        agregarProductoALista(seleccionado, 1);
        setMostrarBuscadorNombre(false); // Cerramos y volvemos al escáner
      }
    }
  };


  // ==========================================
  // LÓGICA DE LA TABLA
  // ==========================================
  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...items];
    nuevosItems[index][campo] = valor === '' ? 0 : parseFloat(valor);
    setItems(nuevosItems);
  };

  const ejecutarGuardado = async () => {
    if (items.length === 0) return;
    try {
      const payload = {
        proveedorId: proveedorSeleccionado ? parseInt(proveedorSeleccionado) : null,
        items: items
      };
      await registrarIngresoStock(payload);
      alert("¡Stock guardado exitosamente!");
      navigate('/productos');
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  return (
    // Sacamos el h-screen y flex-col fijo para que sea una página que se desliza natural
    <div className="min-h-screen bg-slate-50/50 p-6" onClick={() => {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT' && !mostrarBuscadorNombre) {
        inputEscanerRef.current?.focus();
      }
    }}>
      
      {/* Header y Acciones unificados y más compactos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        
        {/* Fila superior: Título y Botón Historial */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-teal-700 font-sans tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined">inventory</span>
            Ingreso de Mercadería
          </h2>
          <button 
            onClick={() => navigate('/productos/stock/historial')} // Ajustá esta ruta según tu App.js
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
            Historial de Cargas
          </button>
        </div>

        {/* Fila inferior: Buscador, Proveedor y Botón Búsqueda Nombre */}
        <div className="p-6 flex flex-col md:flex-row items-center gap-4">
          
          <div className="flex-1 w-full relative flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">barcode_scanner</span>
              <input 
                id="input-escaner"
                ref={inputEscanerRef}
                type="text"
                value={inputActual}
                onChange={(e) => setInputActual(e.target.value)}
                onKeyDown={manejarTeclasEscaner}
                disabled={cargando}
                autoComplete="off"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 rounded-xl text-sm transition-all text-slate-900 placeholder:text-slate-400 font-bold ${esperandoConfirmacion ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-400/20' : 'border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'}`}
                placeholder={esperandoConfirmacion ? "Presione ENTER de nuevo para confirmar el guardado..." : "Ej: 2*779123456... (Flecha Abajo para editar la tabla)"}
              />
            </div>
            
            <button 
              onClick={() => setMostrarBuscadorNombre(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors shrink-0"
              title="Presione F2 para abrir"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              Por Nombre (F2)
            </button>
          </div>

          <div className="w-full md:w-64 relative shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">local_shipping</span>
            <select 
              value={proveedorSeleccionado}
              onChange={(e) => setProveedorSeleccionado(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-700 font-bold appearance-none cursor-pointer"
            >
              <option value="">Sin Proveedor asignado</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      {/* Tabla de Datos (Ahora crece libremente hacia abajo) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-24">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-black">
                <th className="px-6 py-4 w-32">Cód.</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 w-40">PPP (Costo)</th>
                <th className="px-6 py-4 w-40">Precio Venta</th>
                <th className="px-6 py-4 w-32 text-center">Cant.</th>
                <th className="px-6 py-4 w-24 text-right">Quitar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-slate-400">
                    <span className="material-symbols-outlined text-5xl mb-2 opacity-20">qr_code_scanner</span>
                    <p className="font-medium">Escanee un producto o presione F2 para buscar.</p>
                  </td>
                </tr>
              ) : (
                items.map((item, rowIndex) => (
                  <tr key={item.codigoBarras} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-3 text-sm font-medium text-slate-500 font-mono">{item.codigoBarras}</td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-slate-800 font-black line-clamp-1">{item.nombre}</span>
                    </td>
                    
                    <td className="px-6 py-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                        <input 
                          id={`cell-${rowIndex}-0`}
                          type="number" 
                          step="0.01"
                          value={item.ppp}
                          onChange={(e) => actualizarItem(rowIndex, 'ppp', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => navegarTablaConFlechas(e, rowIndex, 0, items.length, 3)}
                          className="w-full pl-7 pr-2 py-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-teal-500 focus:bg-white focus:shadow-sm rounded-lg text-sm font-bold text-slate-900 transition-all outline-none"
                        />
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                        <input 
                          id={`cell-${rowIndex}-1`}
                          type="number" 
                          step="0.01"
                          value={item.precio}
                          onChange={(e) => actualizarItem(rowIndex, 'precio', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => navegarTablaConFlechas(e, rowIndex, 1, items.length, 3)}
                          className="w-full pl-7 pr-2 py-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-teal-500 focus:bg-white focus:shadow-sm rounded-lg text-sm font-bold text-slate-900 transition-all outline-none"
                        />
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <div className="flex justify-center border border-transparent hover:border-slate-200 rounded-lg bg-transparent focus-within:bg-white focus-within:border-teal-500 focus-within:shadow-sm transition-all">
                        <input 
                          id={`cell-${rowIndex}-2`}
                          type="number" 
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(rowIndex, 'cantidad', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => navegarTablaConFlechas(e, rowIndex, 2, items.length, 3)}
                          className="w-20 text-center text-base font-black text-teal-700 bg-transparent border-none focus:ring-0 py-2 outline-none"
                        />
                      </div>
                    </td>

                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => setItems(items.filter((_, i) => i !== rowIndex))}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" 
                        title="Eliminar fila"
                        tabIndex="-1" 
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Action Bar (Flotante abajo) */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
          {items.length > 0 ? (
            <>
              <span className={`w-2 h-2 rounded-full ${esperandoConfirmacion ? 'bg-amber-400 animate-ping' : 'bg-teal-500'}`}></span>
              <span>{items.length} productos en el remito</span>
            </>
          ) : (
            <span>Esperando carga...</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/productos')} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar Todo
          </button>
          <button 
            onClick={ejecutarGuardado}
            disabled={items.length === 0}
            className={`flex items-center gap-2 px-8 py-3 text-white text-sm font-black tracking-wide rounded-xl transition-all active:scale-[0.98] ${esperandoConfirmacion ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 animate-pulse' : 'bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/30 disabled:opacity-50 disabled:shadow-none'}`}
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            {esperandoConfirmacion ? 'HAGA CLIC O ENTER PARA CONFIRMAR' : 'GUARDAR STOCK'}
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL DE BÚSQUEDA POR NOMBRE               */}
      {/* ========================================== */}
      {mostrarBuscadorNombre && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <span className="material-symbols-outlined text-slate-400">search</span>
              <input 
                ref={inputBuscadorNombreRef}
                type="text" 
                placeholder="Escriba el nombre del producto..." 
                value={textoBusqueda}
                onChange={(e) => {
                  setTextoBusqueda(e.target.value);
                  buscarPorNombreEnApi(e.target.value);
                }}
                onKeyDown={manejarTeclasModal}
                className="w-full bg-transparent border-none text-slate-900 font-bold focus:ring-0 p-0 text-lg placeholder:text-slate-300 outline-none"
              />
              <button onClick={() => setMostrarBuscadorNombre(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {resultadosBusqueda.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium">
                  {textoBusqueda.length < 2 ? 'Escriba al menos 2 letras para buscar.' : 'No se encontraron coincidencias.'}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {resultadosBusqueda.map((prod, idx) => (
                    <li 
                      key={prod.id} 
                      onClick={() => {
                        agregarProductoALista(prod, 1);
                        setMostrarBuscadorNombre(false);
                      }}
                      className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${indiceSeleccionadoModal === idx ? 'bg-teal-50 border-l-4 border-teal-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                    >
                      <div>
                        <p className="font-bold text-slate-800">{prod.nombre}</p>
                        <p className="text-xs text-slate-400 font-mono">SKU: {prod.codigoBarra}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">${prod.precio}</p>
                        <p className="text-xs text-slate-500 font-medium">Stock actual: {prod.stock || 0}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-3 bg-slate-50 text-xs text-slate-400 font-medium text-center border-t border-slate-100">
              Use <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm mx-1">↑</kbd> <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm mx-1">↓</kbd> para navegar y <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm mx-1">Enter</kbd> para seleccionar. <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm mx-1">Esc</kbd> para salir.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PantallaCargarStockMasiva;