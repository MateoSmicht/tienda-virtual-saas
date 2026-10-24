import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConToken } from '../../services/api'; 
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const PantallaCargaStock = () => {
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Nuevo estado para el escáner de cámara
  const [escaneando, setEscaneando] = useState(false);

  // Estadísticas globales del backend
  const [estadisticas, setEstadisticas] = useState({ total: 0, activos: 0, sinStock: 0 });

  const [formStock, setFormStock] = useState({
    ppp: '',
    precio: '',
    ingreso: 0
  });

  // 1. CARGAMOS LAS ESTADÍSTICAS INICIALES
  const cargarEstadisticas = async () => {
    try {
      const res = await fetchConToken(`/productos/estadisticas`);
      if (res.ok) {
        const data = await res.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error("Error trayendo estadísticas:", error);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // 2. EFECTO DE BÚSQUEDA (HUMANOS)
  useEffect(() => {
    if (!busqueda.trim() || escaneando) {
      setResultadosBusqueda([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetchConToken(`/productos?todos=true&busqueda=${encodeURIComponent(busqueda)}&page=0&size=10`);
        const data = await res.json();
        setResultadosBusqueda(data.content || []);
      } catch (error) {
        console.error("Error buscando productos:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, escaneando]);

  const handleBuscar = (e) => {
    setBusqueda(e.target.value);
  };

  // 3. BÚSQUEDA RÁPIDA (ENTER O ESCÁNER DE CÁMARA)
  const buscarPorCodigo = async (codigo) => {
    try {
      const res = await fetchConToken(`/productos?todos=true&busqueda=${encodeURIComponent(codigo)}&page=0&size=5`);
      const data = await res.json();
      const encontrados = data.content || [];
      
      setResultadosBusqueda(encontrados);

      // Si encuentra exactamente 1 producto, lo auto-selecciona
      if (encontrados.length === 1) {
        seleccionarProducto(encontrados[0]);
      } else if (encontrados.length === 0) {
          alert("No se encontró ningún producto con ese código.");
      }
    } catch (error) {
      console.error("Error en búsqueda rápida:", error);
    }
  };

  const buscarConEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!busqueda.trim()) return;
      buscarPorCodigo(busqueda);
    }
  };

  // ==========================================
  // LÓGICA DE LA CÁMARA (Html5QrcodeScanner)
  // ==========================================
  useEffect(() => {
    if (escaneando) {
      // Configuramos el escáner para que busque principalmente códigos de barra (1D)
      const scanner = new Html5QrcodeScanner("lector-camara", {
        fps: 10,
        qrbox: { width: 300, height: 150 },
        // 👇 ESTA ES LA MAGIA: Solo lee códigos de productos reales
        formatsToSupport: [ 
            Html5QrcodeSupportedFormats.EAN_13, 
            Html5QrcodeSupportedFormats.UPC_A, 
            Html5QrcodeSupportedFormats.EAN_8 
        ]
      });

      scanner.render(
        (codigoLeido) => {
          // ÉXITO: Leyó un código
          scanner.clear(); // Apagamos la cámara
          setEscaneando(false); // Cerramos el modal
          setBusqueda(codigoLeido); // Llenamos el input visualmente
          buscarPorCodigo(codigoLeido); // Disparamos la búsqueda inmediata
        },
        (error) => {
          // Ignoramos los errores continuos de "código no encontrado en este frame"
        }
      );

      // Limpiamos la cámara si el usuario cierra el modal a la fuerza
      return () => {
        scanner.clear().catch(err => console.error("Error limpiando cámara", err));
      };
    }
  }, [escaneando]);


  const seleccionarProducto = (prod) => {
    setProductoSeleccionado(prod);
    setFormStock({
      ppp: prod.ppp || 0,
      precio: prod.precio || 0,
      ingreso: 0 
    });
    setBusqueda(''); 
    setResultadosBusqueda([]);
    
    // Enfocamos el input de PPP para que el usuario empiece a tipear rápido
    setTimeout(() => document.getElementById('input-ppp')?.focus(), 100);
  };

  const handleFormChange = (e) => {
    setFormStock({
      ...formStock,
      [e.target.name]: parseFloat(e.target.value) || 0
    });
  };

  const saltarConEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target.id === 'input-ppp') document.getElementById('input-precio')?.focus();
      else if (e.target.id === 'input-precio') document.getElementById('input-ingreso')?.focus();
      else if (e.target.id === 'input-ingreso') document.getElementById('btn-guardar-stock')?.focus();
    }
  };

  const stockActual = productoSeleccionado?.stock || 0;
  const nuevoStockProyectado = stockActual + (formStock.ingreso || 0);
  const margenGanancia = formStock.ppp > 0 ? (((formStock.precio - formStock.ppp) / formStock.ppp) * 100).toFixed(1) : 0;

  const guardarActualizacion = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado) return;

    const ingresoStockDTO = {
      cantidad: formStock.ingreso,
      precioCompra: formStock.ppp
    };

    try {
      const response = await fetchConToken(`/productos/${productoSeleccionado.id}/stock`, {
        method: 'PUT',
        body: JSON.stringify(ingresoStockDTO)
      });
      
      if (response.ok) {
        alert("¡Stock ingresado con éxito!");
        
        // Actualizamos visualmente el producto seleccionado
        const productoActualizadoLocal = {
          ...productoSeleccionado,
          ppp: formStock.ppp,
          precio: formStock.precio,
          stock: nuevoStockProyectado
        };
        
        setProductoSeleccionado(productoActualizadoLocal);
        setFormStock({ ...formStock, ingreso: 0 }); 
        
        cargarEstadisticas();

        // Volvemos a enfocar el buscador
        setTimeout(() => document.getElementById('input-buscador')?.focus(), 100);
      } else {
        alert("Hubo un error al procesar el ingreso de stock.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full font-sans relative">
      
      {/* MODAL DEL ESCÁNER DE CÁMARA */}
      {escaneando && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-600">barcode_scanner</span>
                        Escanear Código
                    </h3>
                    <button onClick={() => setEscaneando(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                {/* DIV DONDE SE RENDERIZA LA CÁMARA */}
                <div id="lector-camara" className="w-full rounded-xl overflow-hidden border-2 border-teal-500/30 bg-black"></div>
                
                <p className="text-xs text-center text-slate-500 mt-4">Enfoque el código de barras dentro del recuadro.</p>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Carga Rápida de Stock</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Busque un producto para actualizar su inventario y precios.</p>
        </div>
        
        <div className="flex-1 max-w-xl relative flex gap-2">
          {/* BUSCADOR */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-lg">search</span>
            <input 
              id="input-buscador"
              type="text"
              value={busqueda}
              onChange={handleBuscar}
              onKeyDown={buscarConEnter}
              placeholder="Buscar por Nombre o Código (Escanee o presione Enter)..." 
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all shadow-sm"
              autoComplete="off"
            />
          </div>

          {/* BOTÓN PARA ABRIR CÁMARA */}
          <button 
            onClick={() => setEscaneando(true)}
            className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 transition-colors shadow-sm"
            title="Escanear con cámara"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </button>

          {/* RESULTADOS DE BÚSQUEDA TEXTUAL */}
          {resultadosBusqueda.length > 0 && !escaneando && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-60 overflow-y-auto">
              {resultadosBusqueda.map(prod => (
                <button 
                  key={prod.id}
                  onClick={() => seleccionarProducto(prod)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 transition-colors"
                >
                  <div className="size-8 rounded bg-slate-100 dark:bg-slate-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {prod.imagenUrl ? <img src={prod.imagenUrl} alt="prod" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-[16px] text-slate-400">image</span>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{prod.nombre}</p>
                    <p className="text-xs text-slate-500">SKU: {prod.codigoBarra}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RESTO DE LA INTERFAZ ORIGINAL (Igual que antes) */}
      {!productoSeleccionado ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">inventory_2</span>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Esperando producto...</h2>
          <p className="text-slate-500 mt-2 max-w-md">Use la barra de búsqueda, el lector USB, o escanee el código con la cámara.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 z-10">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${productoSeleccionado.disponible ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}>
                  {productoSeleccionado.disponible ? 'Activo' : 'Pausado'}
                </span>
              </div>
              <div className="aspect-square w-full rounded-lg bg-slate-100 dark:bg-slate-800 mb-6 flex items-center justify-center overflow-hidden">
                {productoSeleccionado.imagenUrl ? (
                  <img src={productoSeleccionado.imagenUrl} alt={productoSeleccionado.nombre} className="object-cover w-full h-full"/>
                ) : (
                  <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{productoSeleccionado.nombre}</h3>
              <p className="text-sm text-slate-500 mb-4">Código: {productoSeleccionado.codigoBarra}</p>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Stock Actual en Sistema</span>
                <p className="text-2xl font-black text-teal-600">{stockActual} <span className="text-sm font-normal text-slate-400">unidades</span></p>
              </div>
            </div>

            <div className="bg-teal-600 dark:bg-teal-700 p-6 rounded-xl text-white shadow-lg shadow-teal-500/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined">lightbulb</span>
                <span className="font-bold uppercase tracking-widest text-[10px]">Consejo de Gestión</span>
              </div>
              <p className="text-sm text-teal-50 opacity-90 leading-relaxed">
                Mantener el Precio Promedio Ponderado (PPP) actualizado le permite conocer con precisión el margen de ganancia real de su inventario.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">edit_square</span>
              Actualizar Información de Stock
            </h2>
            
            <form className="space-y-8" onSubmit={guardarActualizacion}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Precio de Compra (PPP)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-medium">$</span>
                    <input 
                      id="input-ppp"
                      name="ppp"
                      value={formStock.ppp}
                      onChange={handleFormChange}
                      onKeyDown={saltarConEnter}
                      type="number" 
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white font-semibold transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Precio de Venta</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-medium">$</span>
                    <input 
                      id="input-precio"
                      name="precio"
                      value={formStock.precio}
                      onChange={handleFormChange}
                      onKeyDown={saltarConEnter}
                      type="number" 
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white font-semibold transition-all" 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Margen actual: <span className="text-teal-600 font-bold">{margenGanancia}%</span></p>
                </div>

                <div className="md:col-span-2 space-y-2 mt-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center block">Unidades a Ingresar (Nuevas)</label>
                  <div className="flex items-center justify-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 w-fit mx-auto">
                    <input 
                      id="input-ingreso"
                      name="ingreso"
                      value={formStock.ingreso}
                      onChange={handleFormChange}
                      onKeyDown={saltarConEnter}
                      type="number" 
                      className="w-32 bg-transparent border-none text-center text-3xl font-black text-slate-900 dark:text-white focus:ring-0 p-0" 
                    />
                  </div>
                  <p className="text-center text-[12px] text-slate-500 mt-3 font-medium">
                    Stock Total Proyectado: <span className="font-bold text-teal-600 text-lg ml-1">{nuevoStockProyectado}</span>
                  </p>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                <button 
                  id="btn-guardar-stock"
                  type="submit" 
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-teal-500/20 focus:ring-4 focus:ring-teal-500/50"
                >
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>save</span>
                  Guardar Cambios
                </button>
                <button type="button" onClick={() => navigate(`/productos/editar/${productoSeleccionado.id}`)} className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all">
                  <span className="material-symbols-outlined">edit</span>
                  Editar Producto Completo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TARJETAS INFERIORES */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border-l-4 border-amber-500 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Alerta de Reposición</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{estadisticas.sinStock} Productos</p>
          <p className="text-sm text-slate-500 mt-1">Con stock agotado en toda la tienda</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border-l-4 border-slate-900 dark:border-slate-500 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Valor Total Inventario</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            ${(estadisticas.valorInventario || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-slate-500 mt-1">Valorización global calculada a precio de compra (PPP)</p>
        </div>
      </div>

    </div>
  );
};

export default PantallaCargaStock;