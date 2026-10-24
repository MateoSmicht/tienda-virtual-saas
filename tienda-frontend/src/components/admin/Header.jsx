import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalEditarPerfil from '../../pages/store/ModalEditarPerfil';
import { fetchConToken } from '../../services/api'; 

const Header = () => {
  const [notificaciones, setNotificaciones] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  // Estados del Buscador Inteligente
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [mostrarResultadosBusqueda, setMostrarResultadosBusqueda] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);
  const buscadorRef = useRef(null);
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);

  // ==========================================
  // ESTADOS Y LÓGICA DE USUARIO
  // ==========================================
  const token = localStorage.getItem('token');
  const [nombreUsuario, setNombreUsuario] = useState('Admin');
  const [emailUsuario, setEmailUsuario] = useState('');
  const letraInicial = nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'A';

  useEffect(() => {
    const cargarDatosUsuario = async () => {
        if (token) {
            try {
                const res = await fetchConToken('/user/me');
                if (res.ok) {
                    const data = await res.json();
                    setNombreUsuario(data.nombre || data.email?.split('@')[0] || 'Admin');
                    setEmailUsuario(data.email || '');
                }
            } catch (error) {
                console.error("Error al cargar datos del usuario");
            }
        }
    };

    cargarDatosUsuario();
    
    // Escuchamos si el modal de perfil avisa que se cambiaron los datos
    window.addEventListener('perfilActualizado', cargarDatosUsuario);
    return () => window.removeEventListener('perfilActualizado', cargarDatosUsuario);
  }, [token]);

  const [listaNotificaciones, setListaNotificaciones] = useState([]);
  const [mostrarDropdownNoti, setMostrarDropdownNoti] = useState(false);

  const consultarNuevosPedidos = async () => {
    try {
      const res = await fetchConToken('/pedidos/notificaciones'); 
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

      const data = await res.json();
      setListaNotificaciones(data);
      
      const ultimoVisto = parseInt(localStorage.getItem('ultimoPedidoVisto')) || 0;
      const nuevos = data.filter(noti => noti.pedidoId > ultimoVisto).length;
      
      setNotificaciones(nuevos);
    } catch (err) {
      console.error("Error buscando notificaciones:", err);
    }
  };

  const abrirNotificaciones = () => {
    setMostrarDropdownNoti(!mostrarDropdownNoti);
    setMenuAbierto(false); 

    if (!mostrarDropdownNoti && listaNotificaciones.length > 0) {
      localStorage.setItem('ultimoPedidoVisto', listaNotificaciones[0].pedidoId);
      setNotificaciones(0); 
    }
  };

  useEffect(() => {
    consultarNuevosPedidos();
    const intervalo = setInterval(consultarNuevosPedidos, 10000); 
    return () => clearInterval(intervalo);
  }, []);

  const manejarCerrarSesion = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  // ========================================================
  // BUSCADOR INTELIGENTE DE RUTAS
  // ========================================================
  const rutasSistema = [
    { titulo: 'Panel Principal', ruta: '/dashboard', icono: 'home', keywords: ['inicio', 'home', 'panel', 'dashboard'] },
    { titulo: 'Hacer un Pedido', ruta: '/pedidos', icono: 'shopping_cart_checkout', keywords: ['pedido', 'venta', 'cobrar', 'facturar', 'nuevo pedido'] },
    { titulo: 'Ver Pedidos', ruta: '/pedidos', icono: 'receipt_long', keywords: ['historial', 'pedidos', 'ventas', 'ver pedidos'] },
    { titulo: 'Cargar Stock', ruta: '/productos/nuevo', icono: 'inventory_2', keywords: ['stock', 'inventario', 'productos', 'cargar', 'nuevo producto'] },
    { titulo: 'Registrar Usuario', ruta: '/clientes', icono: 'person_add', keywords: ['usuario', 'cliente', 'registrar', 'nuevo cliente'] },
    { titulo: 'Ver Estadísticas', ruta: '/estadisticas', icono: 'bar_chart', keywords: ['estadisticas', 'graficos', 'kpis', 'recaudacion'] },
    { titulo: 'Administrar Ofertas', ruta: '/ofertas', icono: 'local_offer', keywords: ['ofertas', 'eliminar oferta', 'dia', 'nueva oferta'] },
    { titulo: 'Administrar Categorias', ruta: '/categorias', icono: 'layers', keywords: ['categoria', 'eliminar categoira', 'subcategoria', 'nueva categoria'] },
    { titulo: 'Gestionar Productos', ruta: '/productos', icono: 'inventory', keywords: ['productos', 'eliminar producto', 'editar producto', 'nueva producto'] },
  ];
  
  useEffect(() => {
    if (!busqueda.trim()) {
      setResultadosBusqueda([]);
      setMostrarResultadosBusqueda(false);
      setIndiceSeleccionado(-1);
      return;
    }

    const terminoBusqueda = busqueda.toLowerCase();
    const filtrados = rutasSistema.filter(item => 
      item.titulo.toLowerCase().includes(terminoBusqueda) || 
      item.keywords.some(k => k.includes(terminoBusqueda))
    );

    setResultadosBusqueda(filtrados);
    setMostrarResultadosBusqueda(true);
    setIndiceSeleccionado(filtrados.length > 0 ? 0 : -1); 
  }, [busqueda]);

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setMostrarResultadosBusqueda(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const manejarTecladoBusqueda = (e) => {
    if (!mostrarResultadosBusqueda || resultadosBusqueda.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSeleccionado(prev => (prev < resultadosBusqueda.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSeleccionado(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (indiceSeleccionado >= 0 && indiceSeleccionado < resultadosBusqueda.length) {
        navegarARuta(resultadosBusqueda[indiceSeleccionado].ruta);
      }
    }
  };

  const navegarARuta = (ruta) => {
    navigate(ruta);
    setBusqueda('');
    setMostrarResultadosBusqueda(false);
  };

  // ========================================================
  // RENDER
  // ========================================================
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 sticky top-0 z-50">
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 text-primary lg:hidden">
          <span className="material-symbols-outlined text-primary">storefront</span>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Admin Portal</h2>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto relative w-full sm:w-auto justify-end">
        
        <div className="hidden sm:block relative z-50" ref={buscadorRef}>
          <label className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 material-symbols-outlined text-xl pointer-events-none">search</span>
            <input 
              className={`w-64 h-10 pl-10 pr-4 rounded-xl border-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/50 text-sm transition-all ${mostrarResultadosBusqueda ? 'ring-2 ring-teal-500/50 shadow-lg' : ''}`} 
              placeholder="Comandos rápidos (Ej: Stock, Ventas...)" 
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onFocus={() => busqueda.trim() && setMostrarResultadosBusqueda(true)}
              onKeyDown={manejarTecladoBusqueda}
            />
          </label>

          {mostrarResultadosBusqueda && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
              {resultadosBusqueda.length > 0 ? (
                <ul className="py-2">
                  <li className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sugerencias</li>
                  {resultadosBusqueda.map((resultado, idx) => (
                    <li 
                      key={idx}
                      onClick={() => navegarARuta(resultado.ruta)}
                      onMouseEnter={() => setIndiceSeleccionado(idx)}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                        indiceSeleccionado === idx 
                          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] opacity-70">{resultado.icono}</span>
                      {resultado.titulo}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  <span className="material-symbols-outlined text-3xl mb-2 opacity-30">search_off</span>
                  <p>No se encontraron rutas.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            onClick={abrirNotificaciones} 
            className="relative p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-full transition-colors"
            title="Notificaciones de ventas"
          >
            <span className="material-symbols-outlined">notifications</span>
            {notificaciones > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-bounce">
                {notificaciones}
              </span>
            )}
          </button>

          {mostrarDropdownNoti && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Últimas Ventas</h3>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {listaNotificaciones.length > 0 ? (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {listaNotificaciones.map((noti) => (
                      <li key={noti.pedidoId} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => navigate('/pedidos')}>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0 text-teal-600 dark:text-teal-400">
                            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
                              {noti.mensaje}
                            </p>
                            <span className="text-xs font-bold text-slate-400 mt-1 block">
                              {noti.fecha}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    <span className="material-symbols-outlined text-3xl opacity-30 mb-2">notifications_paused</span>
                    <p className="text-sm">No hay pedidos recientes.</p>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <button onClick={() => {navigate('/pedidos'); setMostrarDropdownNoti(false);}} className="w-full py-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors">
                  Ver todos los pedidos
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MENÚ DE USUARIO DESPLEGABLE */}
        <div className="relative">
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold border border-teal-200 dark:border-teal-800 hover:bg-teal-200 dark:hover:bg-teal-800/50 transition-colors focus:outline-none"
          >
            {letraInicial}
          </button>

          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Hola,</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={emailUsuario}>{nombreUsuario}</p>
              </div>
              <button 
                onClick={() => {
                  setMostrarModalPerfil(true);
                  setMenuAbierto(false); 
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">person</span> Editar Perfil
              </button>
              
              <button 
                onClick={manejarCerrarSesion}
                className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span> Cerrar Sesión
              </button>
            </div>
          )}
        </div>

      </div>
      {mostrarModalPerfil && (
        <ModalEditarPerfil onClose={() => setMostrarModalPerfil(false)} />
      )}
    </header>
  );
};

export default Header;