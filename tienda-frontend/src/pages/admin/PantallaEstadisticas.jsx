import { useState, useEffect, useRef } from 'react';
import { fetchConToken } from '../../services/api'; 

const PantallaEstadisticas = () => {
  // ==========================================
  // ESTADOS (Datos del Backend)
  // ==========================================
  const [kpis, setKpis] = useState({ ingresosMes: 0, porcentajeMes: 0, ventasHoy: 0, porcentajeHoy: 0 });
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [topProductosVendidos, setTopProductosVendidos] = useState([]);
  
  // Estados de interfaz y fechas
  const [cargandoPeriodo, setCargandoPeriodo] = useState(true);
  const [rangoSeleccionado, setRangoSeleccionado] = useState('7'); 
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Buscador de productos
  const [productoBuscadoId, setProductoBuscadoId] = useState(null);
  const [infoProductoSeleccionado, setInfoProductoSeleccionado] = useState(null);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [resultadosBusquedaProducto, setResultadosBusquedaProducto] = useState([]);
  const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);
  
  // Datos del producto individual (Totales Históricos)
  const [statProducto, setStatProducto] = useState(null); 
  const dropdownProductoRef = useRef(null);
  const [puntoHover, setPuntoHover] = useState(null);

  // ==========================================
  // 1. CARGA INICIAL (KPIs globales)
  // ==========================================
  useEffect(() => {
    const cargarDatosBase = async () => {
      try {
        const res = await fetchConToken('/estadisticas/kpis');
        if (res.ok) {
          const resKpis = await res.json();
          setKpis(resKpis);
        }
      } catch (error) {
        console.error("Error cargando KPIs:", error);
      }
    };
    cargarDatosBase();
  }, []);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (dropdownProductoRef.current && !dropdownProductoRef.current.contains(e.target)) {
        setMostrarDropdownProducto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // ==========================================
  // 2. CONTROL DEL CALENDARIO RÁPIDO
  // ==========================================
  useEffect(() => {
    if (rangoSeleccionado === 'custom') return;

    const formatearFechaLocal = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const hoy = new Date();
    let inicio = new Date();

    if (rangoSeleccionado === '7') {
      inicio.setDate(hoy.getDate() - 6);
    } else if (rangoSeleccionado === '15') {
      inicio.setDate(hoy.getDate() - 14);
    } else if (rangoSeleccionado === '30') {
      inicio.setDate(hoy.getDate() - 29);
    }
    
    setFechaInicio(formatearFechaLocal(inicio));
    setFechaFin(formatearFechaLocal(hoy));
  }, [rangoSeleccionado]);

  // ==========================================
  // 3. TRAER DATOS DEL PERIODO (Gráfico y Top 5)
  // ==========================================
  useEffect(() => {
    if (!fechaInicio || !fechaFin) return;

    const cargarPeriodo = async () => {
      setCargandoPeriodo(true);
      try {
        const [resGrafico, resTop] = await Promise.all([
          fetchConToken(`/estadisticas/grafico?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`).then(r => r.json()),
          fetchConToken(`/estadisticas/top-productos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`).then(r => r.json())
        ]);
        setDatosGrafico(resGrafico);
        setTopProductosVendidos(resTop);
      } catch (error) {
        console.error("Error cargando estadísticas del periodo:", error);
      } finally {
        setCargandoPeriodo(false);
      }
    };
    cargarPeriodo();
  }, [fechaInicio, fechaFin]);

  // ==========================================
  // 4. BUSCADOR DINÁMICO DE PRODUCTOS (Backend)
  // ==========================================
  useEffect(() => {
    if (!busquedaProducto.trim()) {
      setResultadosBusquedaProducto([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetchConToken(`/productos?todos=true&busqueda=${encodeURIComponent(busquedaProducto)}&page=0&size=10`);
        if (res.ok) {
          const data = await res.json();
          setResultadosBusquedaProducto(data.content || []);
        }
      } catch (error) {
        console.error("Error buscando productos:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busquedaProducto]);

  // ==========================================
  // 5. TRAER STATS DE UN SOLO PRODUCTO (Histórico)
  // ==========================================
  useEffect(() => {
    if (!productoBuscadoId) {
      setStatProducto(null);
      return;
    }

    const buscarStats = async () => {
      try {
        // Acá es donde React se conecta con el nuevo código de Spring Boot
        const res = await fetchConToken(`/estadisticas/producto/${productoBuscadoId}`);
        
        if (res.ok) {
          const data = await res.json();
          setStatProducto(data);
        } else {
          // Si devuelve 404, significa que el producto nunca se vendió. Ponemos todo en 0.
          setStatProducto({
            nombre: infoProductoSeleccionado?.nombre || 'Producto',
            totalVendido: 0,
            totalRecaudado: 0,
            ultimaFecha: null
          });
        }
      } catch (error) {
        console.error("Error buscando stats del producto:", error);
      }
    };
    buscarStats();
  }, [productoBuscadoId, infoProductoSeleccionado]);

  // ==========================================
  // MATEMÁTICA VISUAL PARA EL GRÁFICO (SVG)
  // ==========================================
  const esMismoDia = fechaInicio === fechaFin;
  const esRangoValido = fechaInicio && fechaFin && (new Date(fechaInicio) <= new Date(fechaFin));
  
  const totalPeriodo = datosGrafico.reduce((acc, d) => acc + (d.venta || 0), 0);
  const maxValor = Math.max(...datosGrafico.map(d => d.venta), 0);
  const maxVenta = maxValor > 0 ? maxValor * 1.2 : 100;

  const chartWidth = 700;
  const chartHeight = 180;
  const offsetX = esMismoDia ? 50 : 60;
  const offsetY = 20;

  const puntosGrafico = datosGrafico.map((d, index) => {
    const divisor = Math.max(datosGrafico.length - 1, 1);
    const x = offsetX + (index * (chartWidth / divisor));
    const y = offsetY + chartHeight - ((d.venta / maxVenta) * chartHeight);
    return { x, y, venta: d.venta, etiqueta: d.etiqueta, index };
  });

  const pathLinea = puntosGrafico.length > 0 ? `M ${puntosGrafico.map(p => `${p.x},${p.y}`).join(' L ')}` : '';
  const pathFondo = puntosGrafico.length > 0 ? `${pathLinea} L ${offsetX + chartWidth},${offsetY + chartHeight} L ${offsetX},${offsetY + chartHeight} Z` : '';

  // Acción al hacer clic en un producto del buscador
  const seleccionarProducto = (prod) => {
    setProductoBuscadoId(prod.id);
    setInfoProductoSeleccionado(prod);
    setBusquedaProducto(`${prod.nombre} (Cod: ${prod.codigoBarra || prod.id})`);
    setMostrarDropdownProducto(false);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans pb-24">
      
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Análisis y Estadísticas</h2>
        <p className="text-slate-500 mt-1">Métricas clave e historial de rendimiento de tu catálogo.</p>
      </div>

      {/* ========================================== */}
      {/* TARJETAS DE RESUMEN GLOBALES               */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ingresos del Mes</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 dark:text-white">${kpis.ingresosMes?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-xl">
              <span className="material-symbols-outlined text-[28px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className={`text-xs font-bold flex items-center px-2 py-1 rounded-md ${kpis.porcentajeMes >= 0 ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400'}`}>
              <span className="material-symbols-outlined text-[16px]">{kpis.porcentajeMes >= 0 ? 'trending_up' : 'trending_down'}</span>
              {Math.abs(kpis.porcentajeMes || 0).toFixed(1)}%
            </span>
            <span className="text-slate-400 text-xs font-medium">vs. mes pasado</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ventas de Hoy</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 dark:text-white">{kpis.ventasHoy} <span className="text-xl text-slate-400 font-medium">pedidos</span></h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
              <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className={`text-xs font-bold flex items-center px-2 py-1 rounded-md ${kpis.porcentajeHoy >= 0 ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400'}`}>
              <span className="material-symbols-outlined text-[16px]">{kpis.porcentajeHoy >= 0 ? 'trending_up' : 'trending_down'}</span>
              {Math.abs(kpis.porcentajeHoy || 0).toFixed(1)}%
            </span>
            <span className="text-slate-400 text-xs font-medium">vs. ayer</span>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* SECCIÓN DE GRÁFICOS Y FILTROS DE FECHA     */}
      {/* ========================================== */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rendimiento por Período</h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto w-full sm:w-auto">
              {[{ id: 'hoy', label: 'Hoy (Horas)' }, { id: '7', label: '7 Días' }, { id: '15', label: '15 Días' }, { id: '30', label: '30 Días' }, { id: 'custom', label: 'Personalizado' }].map(opcion => (
                <button
                  key={opcion.id}
                  onClick={() => setRangoSeleccionado(opcion.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    rangoSeleccionado === opcion.id ? 'bg-white dark:bg-slate-600 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  {opcion.label}
                </button>
              ))}
            </div>

            {rangoSeleccionado === 'custom' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-teal-500 shadow-sm">
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-2 py-1 text-xs bg-transparent outline-none dark:text-white" />
                <span className="text-slate-300">-</span>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-2 py-1 text-xs bg-transparent outline-none dark:text-white" />
              </div>
            )}
          </div>
        </div>

        {cargandoPeriodo ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined animate-spin text-4xl text-teal-500">sync</span>
            <p className="font-medium animate-pulse">Solicitando datos al servidor...</p>
          </div>
        ) : !esRangoValido ? (
          <div className="flex flex-col items-center justify-center h-64 text-amber-500 gap-2 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-dashed border-amber-200 dark:border-amber-800/50">
            <span className="material-symbols-outlined text-4xl">date_range</span>
            <p className="font-bold text-amber-700 dark:text-amber-500">Seleccioná un rango de fechas válido.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
            
            {totalPeriodo === 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-[2px]">
                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-2">query_stats</span>
                <p className="text-slate-500 font-bold text-lg">No hay ventas registradas en este período.</p>
              </div>
            )}

            <div className="flex items-start justify-between mb-8 z-0">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{esMismoDia ? 'Ventas por Hora' : 'Evolución Diaria'}</h4>
                <p className="text-sm text-slate-500">{esMismoDia ? 'Rendimiento del día seleccionado' : 'Facturación por día en el período'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recaudado (Rango)</p>
                <p className="text-3xl font-black text-teal-600 dark:text-teal-400">${totalPeriodo.toLocaleString('es-AR')}</p>
              </div>
            </div>
            
            <div className="relative flex-1 min-h-[300px] w-full mt-auto pb-6">
              
              {puntoHover && totalPeriodo > 0 && (
                <div 
                  className="absolute z-20 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
                  style={{ left: `calc(${(puntoHover.x / 800) * 100}%)`, top: `calc(${((puntoHover.y) / 300) * 100}% - 12px)` }}
                >
                  <div className="text-slate-300 text-[10px] uppercase mb-0.5">{esMismoDia ? 'Hora:' : ''} {puntoHover.etiqueta}</div>
                  <div className="text-sm">${puntoHover.venta.toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
                  <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-800"></div>
                </div>
              )}

              <svg className="absolute inset-0 w-full h-full overflow-visible z-0" viewBox="0 0 800 300" preserveAspectRatio="none">
                <g className="text-slate-400 font-sans text-[11px] font-medium" fill="currentColor">
                  <text x="0" y={offsetY + 4}>${Math.round(maxVenta).toLocaleString('es-AR')}</text>
                  <line x1={offsetX} y1={offsetY} x2={offsetX + chartWidth} y2={offsetY} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-20 dark:opacity-10" />
                  <text x="0" y={offsetY + (chartHeight / 2) + 4}>${Math.round(maxVenta / 2).toLocaleString('es-AR')}</text>
                  <line x1={offsetX} y1={offsetY + (chartHeight / 2)} x2={offsetX + chartWidth} y2={offsetY + (chartHeight / 2)} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-20 dark:opacity-10" />
                  <text x="0" y={offsetY + chartHeight + 4}>$0</text>
                  <line x1={offsetX} y1={offsetY + chartHeight} x2={offsetX + chartWidth} y2={offsetY + chartHeight} stroke="currentColor" strokeWidth="1" className="opacity-30 dark:opacity-20" />
                </g>

                {pathFondo && (
                  <>
                    <defs>
                      <linearGradient id="gradEstadistica" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#0d9488', stopOpacity:0.4}}></stop>
                        <stop offset="100%" style={{stopColor:'#0d9488', stopOpacity:0}}></stop>
                      </linearGradient>
                    </defs>
                    <path d={pathFondo} fill="url(#gradEstadistica)" />
                    <path d={pathLinea} fill="none" stroke="#0d9488" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {puntosGrafico.map((punto, i) => (
                      <g key={i} onMouseEnter={() => setPuntoHover(punto)} onMouseLeave={() => setPuntoHover(null)} className="cursor-pointer">
                        <circle cx={punto.x} cy={punto.y} r="20" fill="transparent" />
                        <circle cx={punto.x} cy={punto.y} r={puntoHover?.index === i ? "8" : "4"} fill={puntoHover?.index === i ? "#0d9488" : "#fff"} stroke="#0d9488" strokeWidth={puntoHover?.index === i ? "0" : "3"} className="transition-all duration-200 ease-out" />
                      </g>
                    ))}
                  </>
                )}
              </svg>

              <div className="absolute top-[210px] left-0 w-full h-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest z-0">
                {datosGrafico.map((d, index) => {
                  const salto = esMismoDia ? 3 : Math.ceil(datosGrafico.length / 8);
                  const mostrar = index % salto === 0 || index === datosGrafico.length - 1;
                  if (!mostrar) return null;

                  const divisor = Math.max(datosGrafico.length - 1, 1);
                  const xPos = offsetX + (index * (chartWidth / divisor));
                  const leftPercent = (xPos / 800) * 100;

                  return (
                    <span key={index} className="absolute transform -translate-x-1/2 whitespace-nowrap" style={{ left: `${leftPercent}%` }}>
                      {d.etiqueta}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ========================================== */}
        {/* RANKING TOP 5 EN EL PERIODO                */}
        {/* ========================================== */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">military_tech</span>
              Top 5 Más Vendidos
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">En este periodo</span>
          </div>
          
          <div className="space-y-4">
            {topProductosVendidos.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-30">production_quantity_limits</span>
                <p>No se registraron ventas.</p>
              </div>
            ) : (
              topProductosVendidos.map((prod, index) => (
                <div key={prod.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent transition-colors">
                  <div className={`size-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{prod.nombre}</p>
                    <p className="text-xs text-slate-500 font-medium">Recaudado: ${prod.recaudado?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-3 py-1 rounded-lg">
                      {prod.cantidad} unid.
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* BUSCADOR DE PRODUCTO INDIVIDUAL            */}
        {/* ========================================== */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">manage_search</span>
              Análisis por Producto
            </h4>
          </div>

          <div className="space-y-6">
            <div className="relative" ref={dropdownProductoRef}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Buscá un producto para analizar</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">search</span>
                <input 
                  type="text" 
                  placeholder="Nombre o código de barras..."
                  value={busquedaProducto}
                  onChange={(e) => {
                    setBusquedaProducto(e.target.value);
                    setMostrarDropdownProducto(true);
                    if(productoBuscadoId) setProductoBuscadoId(null); 
                  }}
                  onFocus={() => setMostrarDropdownProducto(true)}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border ${productoBuscadoId ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors shadow-sm`}
                />
              </div>

              {mostrarDropdownProducto && busquedaProducto && (
                <div className="absolute z-30 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {resultadosBusquedaProducto.length === 0 ? (
                    <div className="p-4 text-slate-500 text-sm text-center">Buscando producto...</div>
                  ) : (
                    resultadosBusquedaProducto.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => seleccionarProducto(p)} 
                        className="flex justify-between items-center p-4 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{p.nombre}</div>
                        <div className="text-xs text-slate-400 font-medium">Cod: {p.codigoBarra || p.id}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {productoBuscadoId && statProducto ? (
              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-5 space-y-4 animate-fade-in">
                <div>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Historial Global</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">{statProducto.nombre}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100/50 dark:border-slate-700 shadow-sm">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Total Vendido</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-200">{statProducto.totalVendido || 0}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100/50 dark:border-slate-700 shadow-sm">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Recaudación Histórica</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">${(statProducto.totalRecaudado || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-100 dark:border-slate-700/50">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Última Venta Registrada</span>
                  {statProducto.ultimaFecha ? (
                    <div className="flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-400">
                      <span className="material-symbols-outlined text-[18px]">event_available</span>
                      {new Date(statProducto.ultimaFecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <span className="material-symbols-outlined text-[18px]">event_busy</span>
                      Aún no hay registros de venta.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-30">query_stats</span>
                <p className="text-sm font-medium">Buscá un producto para ver sus estadísticas.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PantallaEstadisticas;