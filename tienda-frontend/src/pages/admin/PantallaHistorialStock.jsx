import { useState, useEffect } from 'react';
import { traerBoletasAgrupadas, traerBoletaStock } from '../../services/api';

const PantallaHistorialStock = () => {
  const [boletas, setBoletas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [tipoFiltro, setTipoFiltro] = useState('COMPRA_PROVEEDOR');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Modal de Detalle
  const [boletaVisible, setBoletaVisible] = useState(false);
  const [itemsBoleta, setItemsBoleta] = useState([]);
  const [cargandoBoleta, setCargandoBoleta] = useState(false);

  const cargarAuditoria = async (page = 0) => {
    setCargando(true);
    try {
      const data = await traerBoletasAgrupadas(page, 20, tipoFiltro, fechaInicio, fechaFin);
      setBoletas(data.content || []);
      setTotalPaginas(data.totalPages || 0);
      setPaginaActual(data.number || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAuditoria(0);
  }, [tipoFiltro, fechaInicio, fechaFin]);

  const abrirBoleta = async (idReferencia) => {
    setBoletaVisible(true);
    setCargandoBoleta(true);
    try {
      // Usa el idReferencia para buscar todos los hermanos de esa misma fecha
      const detalles = await traerBoletaStock(idReferencia);
      setItemsBoleta(detalles);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoBoleta(false);
    }
  };

  const formatearFecha = (fechaBackend) => {
    if (!fechaBackend) return '';
    
    let fecha;
    
    // Caso 1: Spring Boot lo manda como String ISO (ej: "2026-05-24T14:30:00")
    if (typeof fechaBackend === 'string') {
      fecha = new Date(fechaBackend);
    } 
    // Caso 2: Spring Boot lo manda como Array (ej: [2026, 5, 24, 14, 30])
    else if (Array.isArray(fechaBackend)) {
      fecha = new Date(
        fechaBackend[0], 
        fechaBackend[1] - 1, // En JS los meses arrancan en 0
        fechaBackend[2], 
        fechaBackend[3] || 0, 
        fechaBackend[4] || 0
      );
    } else {
      return 'Fecha inválida';
    }

    // Lo formateamos bien prolijo al estilo argentino
    return fecha.toLocaleString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }) + ' hs';
  };

  const BadgeTipoMovimiento = ({ tipo }) => {
    const configs = {
      'VENTA': { color: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Venta / Egreso Caja' },
      'COMPRA_PROVEEDOR': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Remito Ingresado' },
      'AJUSTE_MANUAL_INGRESO': { color: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Ajuste / Sobrante' },
      'AJUSTE_MANUAL_EGRESO': { color: 'bg-red-50 text-red-700 border-red-200', label: 'Pérdida / Rotura' },
      'DEVOLUCION_CLIENTE': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Devolución' }
    };
    const config = configs[tipo] || { color: 'bg-slate-100 text-slate-700 border-slate-200', label: tipo };
    return <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${config.color}`}>{config.label}</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full pb-24">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Registro de Lotes y Auditoría</h2>
        <p className="text-slate-500 mt-1 font-medium">Controle los ingresos y movimientos físicos consolidados por operación.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="w-full md:w-64 relative">
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none focus:border-teal-500 transition-colors"
          >
            <option value="">Mostrar Todas las Operaciones</option>
            <option value="COMPRA_PROVEEDOR">Solo Cargas por Remito</option>
            <option value="AJUSTE_MANUAL_INGRESO">Solo Ajustes Rápidos</option>
            <option value="VENTA">Solo Ventas por Caja</option>
            <option value="AJUSTE_MANUAL_EGRESO">Solo Pérdidas / Roturas</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none">expand_more</span>
        </div>

        <div className="w-full md:w-auto flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-3 py-1.5 text-sm font-medium outline-none bg-transparent dark:text-white w-full" />
          <span className="text-slate-300">-</span>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-3 py-1.5 text-sm font-medium outline-none bg-transparent dark:text-white w-full" />
        </div>

        {(tipoFiltro !== 'COMPRA_PROVEEDOR' || fechaInicio || fechaFin) && (
          <button onClick={() => {setTipoFiltro('COMPRA_PROVEEDOR'); setFechaInicio(''); setFechaFin('');}} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 rounded-xl transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">close</span> Limpiar
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4 w-40">Fecha de Carga</th>
                <th className="px-6 py-4 w-48">Tipo de Movimiento</th>
                <th className="px-6 py-4">Proveedor / Referencia</th>
                <th className="px-6 py-4 text-center w-32">Dif. Productos</th>
                <th className="px-6 py-4 text-center w-32">Total Unidades</th>
                <th className="px-6 py-4 w-32">Operador</th>
                <th className="px-6 py-4 text-right w-32">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cargando ? (
                <tr><td colSpan="7" className="text-center py-16 text-slate-400"><span className="material-symbols-outlined animate-spin text-4xl mb-2 text-teal-500">sync</span></td></tr>
              ) : boletas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400">
                    <span className="material-symbols-outlined text-5xl mb-3 opacity-20">inventory_2</span>
                    <p className="font-medium text-sm">No se encontraron operaciones registradas.</p>
                  </td>
                </tr>
              ) : (
                boletas.map((bol, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-500">{formatearFecha(bol.fecha)}</td>
                    <td className="px-6 py-4"><BadgeTipoMovimiento tipo={bol.tipo} /></td>
                    <td className="px-6 py-4">
                      <span className="block font-black text-slate-900 dark:text-white line-clamp-1">
                        {bol.proveedor ? bol.proveedor : 'Múltiples / General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-black text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        {bol.cantidadProductos}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-black text-lg ${bol.totalUnidades > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {bol.totalUnidades > 0 ? '+' : ''}{bol.totalUnidades}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {bol.usuario}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => abrirBoleta(bol.idReferencia)} 
                        className="flex items-center gap-1 justify-end w-full text-xs font-black text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">receipt_long</span> Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500">Mostrando página <span className="font-bold">{paginaActual + 1}</span> de {totalPaginas || 1}</p>
          <div className="flex gap-2">
            <button disabled={paginaActual === 0} onClick={() => cargarAuditoria(paginaActual - 1)} className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-white transition-colors">Anterior</button>
            <button disabled={paginaActual >= totalPaginas - 1} onClick={() => cargarAuditoria(paginaActual + 1)} className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-white transition-colors">Siguiente</button>
          </div>
        </div>
      </div>

      {/* MODAL DETALLE LOTE (Igual al anterior, funciona con el idReferencia) */}
      {boletaVisible && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-600">inventory</span>
                  Detalle de la Operación
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Fecha: {itemsBoleta.length > 0 ? formatearFecha(itemsBoleta[0].fecha) : ''}
                </p>
              </div>
              <button onClick={() => setBoletaVisible(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {cargandoBoleta ? (
                <div className="text-center py-12"><span className="material-symbols-outlined animate-spin text-4xl text-teal-500">sync</span></div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  {itemsBoleta.map(item => (
                    <div key={item.id} className="p-4 flex justify-between items-center text-sm hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={`size-10 flex items-center justify-center rounded-xl text-sm font-black shrink-0 ${item.cantidad > 0 ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30' : 'bg-red-50 text-red-700 dark:bg-red-900/30'}`}>
                          {item.cantidad > 0 ? '+' : ''}{item.cantidad}
                        </span>
                        <div>
                          <span className="block font-black text-slate-900 dark:text-slate-200 text-base">{item.producto?.nombre}</span>
                          <span className="text-xs text-slate-400 font-mono">{item.producto?.codigoBarra}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Stock Resultante</span>
                        <span className="font-black text-slate-800 dark:text-white text-lg">{item.producto?.stock || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Movimientos Netos</span>
                <span className="text-2xl font-black text-teal-600">
                  {itemsBoleta.reduce((acc, item) => acc + item.cantidad, 0)}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PantallaHistorialStock;