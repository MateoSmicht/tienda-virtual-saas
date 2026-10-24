import { useState, useEffect } from 'react';
import { fetchConToken } from '../../services/api';

const PantallaDashboard = () => {
  // Estados para los datos limpios que vienen del backend
  const [kpis, setKpis] = useState({ ingresosMes: 0, ventasHoy: 0 });
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ofertasActivas, setOfertasActivas] = useState(0);
  const [ultimosPedidos, setUltimosPedidos] = useState([]);
  
  const [cargando, setCargando] = useState(true);
  const [puntoHover, setPuntoHover] = useState(null);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        // Calculamos las fechas para los últimos 7 días (Horario local seguro)
        const formatearFechaLocal = (d) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const hoy = new Date();
        const hace7Dias = new Date();
        hace7Dias.setDate(hoy.getDate() - 6);

        const strHoy = formatearFechaLocal(hoy);
        const strHace7 = formatearFechaLocal(hace7Dias);

        // ✅ CORREGIDO: Destructuramos con los nombres correctos
        const [resKpis, resGrafico, resTop, cantidadOfertas, resPedidos] = await Promise.all([
          fetchConToken('/estadisticas/kpis').then(r => r.json()),
          fetchConToken(`/estadisticas/grafico?fechaInicio=${strHace7}&fechaFin=${strHoy}`).then(r => r.json()),
          fetchConToken(`/estadisticas/top-productos?fechaInicio=${strHace7}&fechaFin=${strHoy}`).then(r => r.json()),
          fetchConToken('/productos/ofertas/cantidad').then(r => r.json()), 
          fetchConToken('/pedidos/recientes').then(r => r.json()) 
        ]);

        // Seteamos los estados directamente con la info procesada
        setKpis(resKpis);
        setDatosGrafico(resGrafico);
        setTopProductos(resTop.slice(0, 4)); 
        
        setOfertasActivas(cantidadOfertas);

        const arrayPedidos = resPedidos.content || resPedidos || [];
        const pedidosOrdenados = arrayPedidos
          .sort((a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido))
          .slice(0, 5);
          
        setUltimosPedidos(pedidosOrdenados);

      } catch (err) {
        console.error("Error cargando datos del dashboard:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarDashboard();
  }, []);

  // ==========================================
  // LÓGICA DEL GRÁFICO (Solo SVG, sin cálculos pesados)
  // ==========================================
  const maxValor = Math.max(...datosGrafico.map(d => d.venta), 0);
  const maxVenta = maxValor > 0 ? maxValor * 1.2 : 100;
  const totalSemana = datosGrafico.reduce((acc, d) => acc + (d.venta || 0), 0);

  const chartWidth = 700;
  const chartHeight = 180;
  const offsetX = 60; 
  const offsetY = 20; 

  const puntosGrafico = datosGrafico.map((d, index) => {
    const divisor = Math.max(datosGrafico.length - 1, 1);
    const x = offsetX + (index * (chartWidth / divisor));
    const y = offsetY + chartHeight - ((d.venta / maxVenta) * chartHeight);
    return { x, y, venta: d.venta, etiqueta: d.etiqueta, index };
  });

  const pathLinea = puntosGrafico.length > 0 ? `M ${puntosGrafico.map(p => `${p.x},${p.y}`).join(' L ')}` : '';
  const pathFondo = puntosGrafico.length > 0 ? `${pathLinea} L ${offsetX + chartWidth},${offsetY + chartHeight} L ${offsetX},${offsetY + chartHeight} Z` : '';

  const BadgeEstado = ({ estado }) => {
    const estilos = {
      'PENDIENTE': 'bg-amber-100 text-amber-700',
      'PAGADO': 'bg-emerald-100 text-emerald-700',
      'ENVIADO': 'bg-blue-100 text-blue-700',
      'CANCELADO': 'bg-red-100 text-red-700',
      'ENTREGADO': 'bg-slate-100 text-slate-700',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${estilos[estado] || estilos['PENDIENTE']}`}>
        {estado}
      </span>
    );
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-teal-500">sync</span>
        <p className="font-medium animate-pulse">Sincronizando panel principal...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans pb-24">
      
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Resumen General</h2>
        <p className="text-slate-500 mt-1">Un pantallazo de cómo viene tu negocio hoy.</p>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ingresos del Mes</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 dark:text-white">${kpis.ingresosMes?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[28px]">payments</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ventas Hoy</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 dark:text-white">{kpis.ventasHoy}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[28px]">shopping_basket</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ofertas Activas</p>
              <h3 className="text-4xl font-black mt-2 text-slate-900 dark:text-white">{ofertasActivas}</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[28px]">local_offer</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRÁFICO DE TENDENCIA SEMANAL */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Tendencia Semanal</h4>
              <p className="text-sm text-slate-500">Recaudación de los últimos 7 días</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total 7 días</p>
              <p className="text-2xl font-black text-teal-600 dark:text-teal-400">${totalSemana.toLocaleString('es-AR')}</p>
            </div>
          </div>
          
          <div className="relative flex-1 min-h-[250px] w-full mt-auto">
            {puntoHover && (
              <div 
                className="absolute z-20 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-100"
                style={{ left: `calc(${(puntoHover.x / 800) * 100}%)`, top: `calc(${((puntoHover.y) / 250) * 100}% - 12px)` }}
              >
                <div className="text-slate-300 text-[10px] uppercase mb-0.5">{puntoHover.etiqueta}</div>
                <div className="text-sm">${puntoHover.venta.toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-800"></div>
              </div>
            )}

            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 800 250" preserveAspectRatio="none">
              <g className="text-slate-400 font-sans text-[11px] font-medium" fill="currentColor">
                <text x="0" y={offsetY + 4}>${Math.round(maxVenta).toLocaleString('es-AR')}</text>
                <line x1={offsetX} y1={offsetY} x2={offsetX + chartWidth} y2={offsetY} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-20 dark:opacity-10" />
                <text x="0" y={offsetY + (chartHeight / 2) + 4}>${Math.round(maxVenta / 2).toLocaleString('es-AR')}</text>
                <line x1={offsetX} y1={offsetY + (chartHeight / 2)} x2={offsetX + chartWidth} y2={offsetY + (chartHeight / 2)} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-20 dark:opacity-10" />
                <text x="0" y={offsetY + chartHeight + 4}>$0</text>
                <line x1={offsetX} y1={offsetY + chartHeight} x2={offsetX + chartWidth} y2={offsetY + chartHeight} stroke="currentColor" strokeWidth="1" className="opacity-30 dark:opacity-20" />
              </g>

              <defs>
                <linearGradient id="gradDash" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#0d9488', stopOpacity:0.3}}></stop>
                  <stop offset="100%" style={{stopColor:'#0d9488', stopOpacity:0}}></stop>
                </linearGradient>
              </defs>
              
              {pathFondo && <path d={pathFondo} fill="url(#gradDash)" />}
              {pathLinea && <path d={pathLinea} fill="none" stroke="#0d9488" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
              
              {puntosGrafico.map((punto, i) => (
                <g key={i} onMouseEnter={() => setPuntoHover(punto)} onMouseLeave={() => setPuntoHover(null)} className="cursor-pointer">
                  <circle cx={punto.x} cy={punto.y} r="25" fill="transparent" />
                  <circle cx={punto.x} cy={punto.y} r={puntoHover?.index === i ? "8" : "5"} fill={puntoHover?.index === i ? "#0d9488" : "#fff"} stroke="#0d9488" strokeWidth={puntoHover?.index === i ? "0" : "3"} className="transition-all duration-200 ease-out" />
                </g>
              ))}
            </svg>

            <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest translate-y-full pt-4" style={{ marginLeft: `${(offsetX/800)*100}%`, marginRight: '0%'}}>
              {datosGrafico.map((d, index) => (
                <span key={index} className="flex-1 text-center -ml-4 truncate">{d.etiqueta}</span>
              ))}
            </div>
          </div>
        </div>

        {/* TOP PRODUCTOS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Destacados Semanales</h4>
          </div>
          <div className="space-y-5 flex-1">
            {topProductos.length === 0 ? (
              <p className="text-slate-500 text-sm text-center mt-10">No hay ventas recientes.</p>
            ) : (
              topProductos.map((prod, i) => (
                <div key={prod.id} className="flex items-center gap-4 group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700 p-2 rounded-xl transition-colors -mx-2">
                  <div className={`size-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 transition-colors">{prod.nombre}</p>
                    <p className="text-xs text-slate-500 truncate font-medium mt-0.5">Recaudado: ${prod.recaudado?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-lg">{prod.cantidad} un.</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ÚLTIMOS PEDIDOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Últimos Movimientos</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-5">Orden</th>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5">Fecha</th>
                <th className="px-6 py-5 font-bold">Total</th>
                <th className="px-6 py-5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ultimosPedidos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-30">receipt_long</span>
                    <p>Todavía no hay ventas registradas.</p>
                  </td>
                </tr>
              ) : (
                ultimosPedidos.map(pedido => (
                  <tr key={pedido.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">#{pedido.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {pedido.usuario?.nombre} {pedido.usuario?.apellido}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          {pedido.metodoPago || 'No especificado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {new Date(pedido.fechaPedido).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                      ${pedido.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <BadgeEstado estado={pedido.estado} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default PantallaDashboard;