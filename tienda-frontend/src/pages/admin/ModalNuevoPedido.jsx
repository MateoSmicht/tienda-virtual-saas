import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchConToken } from '../../services/api';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const ModalNuevoPedido = ({ onClose, onGuardadoExitoso }) => {
  // ==========================================
  // ESTADOS
  // ==========================================
  // Clientes
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [nuevoClienteId, setNuevoClienteId] = useState(null); 
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);
  const [indexClienteSelec, setIndexClienteSelec] = useState(-1);

  // Productos y Cámara
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [resultadosBusquedaProducto, setResultadosBusquedaProducto] = useState([]);
  const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);
  const [indexProductoSelec, setIndexProductoSelec] = useState(-1);
  const [escaneando, setEscaneando] = useState(false);
  
  // Carrito y Pago
  const [nuevosItemsCarrito, setNuevosItemsCarrito] = useState([]);
  const [nuevoMetodoPago, setNuevoMetodoPago] = useState('EFECTIVO');
  const [guardandoPedido, setGuardandoPedido] = useState(false);

  // Vuelto y Links
  const [mostrarModalVuelto, setMostrarModalVuelto] = useState(false);
  const [montoAbonado, setMontoAbonado] = useState('');
  const [linkMercadoPago, setLinkMercadoPago] = useState(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Referencias para Atajos y Focos
  const dropdownClienteRef = useRef(null);
  const dropdownProductoRef = useRef(null);
  const inputProductoRef = useRef(null);
  const inputClienteRef = useRef(null);
  const inputMontoAbonadoRef = useRef(null);

  const totalDelNuevoCarrito = nuevosItemsCarrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const cantidadTotalArticulos = nuevosItemsCarrito.reduce((acc, item) => acc + item.cantidad, 0);

  // ==========================================
  // LÓGICA DE COBRO
  // ==========================================
  const iniciarCheckout = useCallback(() => {
    if (!nuevoClienteId && nuevosItemsCarrito.length === 0) return alert("El ticket está vacío.");
    if (nuevosItemsCarrito.length === 0) return alert("Debes agregar al menos un producto.");
    
    if (nuevoMetodoPago === 'EFECTIVO') {
      setMontoAbonado(totalDelNuevoCarrito);
      setMostrarModalVuelto(true);
      setTimeout(() => inputMontoAbonadoRef.current?.focus(), 100);
    } else {
      guardarEnBackend();
    }
  }, [nuevosItemsCarrito, nuevoMetodoPago, totalDelNuevoCarrito, nuevoClienteId]);

  // ==========================================
  // ATAJOS DE TECLADO ROBUSTOS
  // ==========================================
  const manejarAtajosGlobales = (e) => {
    // Si la cámara o el vuelto están abiertos, anulamos atajos base
    if (escaneando) return;

    const key = e.key;
    const isAlt = e.altKey;

    if (key === 'F2' || (isAlt && (key === 'p' || key === 'P'))) {
      e.preventDefault();
      inputProductoRef.current?.focus();
    } else if (key === 'F3' || (isAlt && (key === 'c' || key === 'C'))) {
      e.preventDefault();
      inputClienteRef.current?.focus();
    } else if (key === 'F4' || (isAlt && (key === 'f' || key === 'F'))) {
      e.preventDefault();
      setNuevoClienteId(null);
      setBusquedaCliente('');
      inputProductoRef.current?.focus(); 
    } else if (key === 'F8' || key === 'F12' || (isAlt && key === 'Enter')) {
      e.preventDefault();
      if (!mostrarModalVuelto && nuevosItemsCarrito.length > 0) {
        iniciarCheckout();
      }
    } else if (key === 'Escape') {
      e.preventDefault();
      if (mostrarModalVuelto) {
        setMostrarModalVuelto(false);
        setTimeout(() => inputProductoRef.current?.focus(), 100);
      } else {
        onClose();
      }
    }
  };

  // ==========================================
  // EFECTOS INICIALES Y CÁMARA
  // ==========================================
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const res = await fetchConToken('/user'); 
        if (res.ok) {
          const data = await res.json();
          setListaUsuarios(data);
        }
      } catch (error) { console.error("Error cargando clientes:", error); }
    };
    cargarUsuarios();

    const handleClickFuera = (e) => {
      if (dropdownClienteRef.current && !dropdownClienteRef.current.contains(e.target)) setMostrarDropdownCliente(false);
      if (dropdownProductoRef.current && !dropdownProductoRef.current.contains(e.target)) setMostrarDropdownProducto(false);
    };
    document.addEventListener('mousedown', handleClickFuera);
    setTimeout(() => inputProductoRef.current?.focus(), 100);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  useEffect(() => {
    if (escaneando) {
      const scanner = new Html5QrcodeScanner("lector-camara-pos", {
        fps: 10,
        qrbox: { width: 300, height: 150 },
        formatsToSupport: [ 
            Html5QrcodeSupportedFormats.EAN_13, 
            Html5QrcodeSupportedFormats.UPC_A, 
            Html5QrcodeSupportedFormats.EAN_8 
        ]
      });

      scanner.render(
        (codigoLeido) => {
          scanner.clear();
          setEscaneando(false);
          setBusquedaProducto(codigoLeido);
          procesarEntradaProducto(codigoLeido);
        },
        (error) => {}
      );

      return () => {
        scanner.clear().catch(err => console.error("Error limpiando cámara", err));
      };
    }
  }, [escaneando]);

  // ==========================================
  // LÓGICA DE CLIENTES
  // ==========================================
  const manejarBusquedaCliente = (e) => {
    const termino = e.target.value;
    setBusquedaCliente(termino);
    setNuevoClienteId(null); 
    setIndexClienteSelec(-1);

    if (termino.trim().length > 0) {
      const filtrados = listaUsuarios.filter(u => 
        (u.nombre || '').toLowerCase().includes(termino.toLowerCase()) ||
        (u.apellido || '').toLowerCase().includes(termino.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(termino.toLowerCase())
      );
      setUsuariosFiltrados(filtrados);
      setMostrarDropdownCliente(true);
    } else {
      setUsuariosFiltrados([]);
      setMostrarDropdownCliente(false);
    }
  };

  const manejarNavegacionCliente = (e) => {
    if (!mostrarDropdownCliente || usuariosFiltrados.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndexClienteSelec(prev => (prev < usuariosFiltrados.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndexClienteSelec(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (indexClienteSelec >= 0) {
        seleccionarCliente(usuariosFiltrados[indexClienteSelec]);
      }
    }
  };

  const seleccionarCliente = (cliente) => {
    setNuevoClienteId(cliente.id);
    setBusquedaCliente(`${cliente.nombre} ${cliente.apellido}`);
    setMostrarDropdownCliente(false);
    inputProductoRef.current?.focus(); 
  };

  // ==========================================
  // LÓGICA DE PRODUCTOS (CON MULTIPLICADOR)
  // ==========================================
  useEffect(() => {
    if (!busquedaProducto.trim()) {
      setResultadosBusquedaProducto([]);
      setMostrarDropdownProducto(false);
      return;
    }
    // Si tiene multiplicador (*), no disparamos la búsqueda sugerida
    if (busquedaProducto.includes('*')) return;

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetchConToken(`/productos?todos=true&busqueda=${encodeURIComponent(busquedaProducto)}&page=0&size=10`);
        const data = await res.json();
        setResultadosBusquedaProducto(data.content || []);
        setIndexProductoSelec(-1);
        if (data.content && data.content.length > 0) setMostrarDropdownProducto(true);
      } catch (error) { console.error("Error buscando productos:", error); }
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [busquedaProducto]);

  const handleKeyDownProducto = async (e) => {
    if (mostrarDropdownProducto && resultadosBusquedaProducto.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndexProductoSelec(prev => (prev < resultadosBusquedaProducto.length - 1 ? prev + 1 : prev));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndexProductoSelec(prev => (prev > 0 ? prev - 1 : 0));
        return;
      }
    }

    if (e.key === 'Enter' && busquedaProducto.trim() !== '') {
      e.preventDefault();
      
      // Si está eligiendo de la lista desplegable
      if (mostrarDropdownProducto && indexProductoSelec >= 0 && !busquedaProducto.includes('*')) {
        agregarItemAlCarrito(resultadosBusquedaProducto[indexProductoSelec], 1);
        return;
      }

      // Si apretó Enter tipeando o escaneando directo
      procesarEntradaProducto(busquedaProducto.trim());
    }
  };

  const procesarEntradaProducto = async (texto) => {
    let cantidadIngresada = 1;
    let codigo = texto;

    if (texto.includes('*')) {
      const partes = texto.split('*');
      cantidadIngresada = parseInt(partes[0], 10) || 1;
      codigo = partes[1].trim();
    }

    try {
      const resCodigo = await fetchConToken(`/productos/codigo/${encodeURIComponent(codigo)}`);
      if (resCodigo.ok) {
        const productoEncontrado = await resCodigo.json();
        agregarItemAlCarrito(productoEncontrado, cantidadIngresada);
      } else {
        const res = await fetchConToken(`/productos?todos=true&busqueda=${encodeURIComponent(codigo)}&page=0&size=1`);
        const data = await res.json();
        if (data.content && data.content.length === 1) {
          agregarItemAlCarrito(data.content[0], cantidadIngresada);
        } else {
          alert("Producto no encontrado o búsqueda ambigua.");
        }
      }
    } catch (error) { console.error("Error en búsqueda rápida:", error); }
  };

  const agregarItemAlCarrito = (producto, cantidadSuma = 1) => {
    const existe = nuevosItemsCarrito.find(item => item.productoId === producto.id);
    if (existe) {
      setNuevosItemsCarrito(nuevosItemsCarrito.map(item => 
        item.productoId === producto.id ? { ...item, cantidad: item.cantidad + cantidadSuma } : item
      ));
    } else {
      setNuevosItemsCarrito([{
        productoId: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigoBarra || producto.id,
        precio: producto.precioOferta ? producto.precioOferta : producto.precio,
        cantidad: cantidadSuma
      }, ...nuevosItemsCarrito]); // Agregamos arriba para que el último escaneado se vea primero
    }
    setBusquedaProducto('');
    setResultadosBusquedaProducto([]);
    setMostrarDropdownProducto(false);
    inputProductoRef.current?.focus(); 
  };

  const cambiarCantidadItem = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setNuevosItemsCarrito(nuevosItemsCarrito.map(item => 
      item.productoId === productoId ? { ...item, cantidad: Number(nuevaCantidad) } : item
    ));
  };

  const eliminarItemDelCarrito = (prodId) => {
    setNuevosItemsCarrito(nuevosItemsCarrito.filter(item => item.productoId !== prodId));
    inputProductoRef.current?.focus();
  };

  // ==========================================
  // CONEXIÓN AL BACKEND
  // ==========================================
 const guardarEnBackend = async () => {
    setMostrarModalVuelto(false);
    setGuardandoPedido(true);

    const idCajeroLogueado = localStorage.getItem('usuarioId') || 1;

    const payload = {
      usuarioId: nuevoClienteId ? Number(nuevoClienteId) : null,
      cajaId: Number(idCajeroLogueado), 
      metodoPago: nuevoMetodoPago,
      items: nuevosItemsCarrito.map(item => ({ productoId: item.productoId, cantidad: item.cantidad }))
    };
    


    try {
      const response = await fetchConToken('/pedidos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.linkDePago) {
          setLinkMercadoPago(data.linkDePago);
        } else {
          onGuardadoExitoso(); 
        }
      } else {
        alert("Error al crear el pedido. Revisá la conexión o el stock.");
      }
    } catch (error) { alert("Error de conexión con el servidor."); } 
    finally { setGuardandoPedido(false); }
  };

  const manejarCobroEfectivo = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (Number(montoAbonado) >= totalDelNuevoCarrito) {
        guardarEnBackend();
      }
    }
  };

  const copiarAlPortapapeles = async () => {
    try {
      await navigator.clipboard.writeText(linkMercadoPago);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000); 
    } catch (err) { console.error('Error al copiar: ', err); }
  };

  // =========================================================
  // RENDER: PANTALLA DE ÉXITO (MERCADO PAGO)
  // =========================================================
  if (linkMercadoPago) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 bg-slate-900/90 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 sm:p-8 text-center justify-center">
          <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><span className="material-symbols-outlined text-[40px]">check_circle</span></div>
          <h2 className="text-2xl font-black mb-2 dark:text-white">¡Pedido Generado!</h2>
          <p className="text-slate-500 mb-8">El pedido se registró correctamente. Copiá el link de Mercado Pago para abonar.</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 mb-8 flex justify-between items-center gap-4">
            <span className="text-sm font-medium truncate flex-1 dark:text-slate-200">{linkMercadoPago}</span>
            <button onClick={copiarAlPortapapeles} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold">
              {linkCopiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <button onClick={onGuardadoExitoso} className="w-full py-4 rounded-xl font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Volver al Panel</button>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER: TERMINAL DE PUNTO DE VENTA NORMAL
  // =========================================================
  return (
    <div onKeyDownCapture={manejarAtajosGlobales}>
      
      {/* MODAL DEL ESCÁNER DE CÁMARA */}
      {escaneando && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-600">barcode_scanner</span>
                        Escanear Código
                    </h3>
                    <button onClick={() => {setEscaneando(false); inputProductoRef.current?.focus();}} className="text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div id="lector-camara-pos" className="w-full rounded-xl overflow-hidden border-2 border-teal-500/30 bg-black"></div>
                <p className="text-xs text-center text-slate-500 mt-4">Enfoque el código de barras dentro del recuadro.</p>
            </div>
        </div>
      )}

      {/* POS PRINCIPAL - FULL SCREEN CLEAN LAYOUT */}
      <div className="fixed inset-0 z-[70] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
        
        {/* HEADER DEL POS */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-teal-600 text-white p-2.5 rounded-xl shadow-md flex items-center">
              <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Caja Mostrador</h2>
              <div className="hidden md:flex gap-3 mt-1 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700">ALT+P</kbd> Producto</span>
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700">ALT+C</kbd> Cliente</span>
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700">ALT+F</kbd> C. Final</span>
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700">ALT+ENT</kbd> Cobrar</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors flex items-center gap-2 font-bold text-sm">
            <kbd className="hidden sm:inline-block bg-white dark:bg-slate-800 shadow-sm px-2 py-1 rounded border dark:border-slate-700 text-[10px]">ESC</kbd>
            <span>Cerrar POS</span>
          </button>
        </div>
        
        {/* CONTENEDOR FLEX */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* COLUMNA IZQUIERDA: BUSCADOR Y TICKET */}
          <div className="flex-[2] flex flex-col h-full z-10 border-r border-slate-200 dark:border-slate-800">
            
            {/* Buscador de Producto */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative shrink-0" ref={dropdownProductoRef}>
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 text-2xl font-black">barcode_scanner</span>
                  <input 
                    ref={inputProductoRef}
                    type="text" 
                    placeholder="Ej: 3*779... o busque por nombre (F2)"
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    onFocus={() => { if(resultadosBusquedaProducto.length > 0) setMostrarDropdownProducto(true) }}
                    onKeyDown={handleKeyDownProducto}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <button 
                  onClick={() => setEscaneando(true)}
                  className="flex items-center justify-center bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 border-2 border-slate-200 hover:border-teal-200 rounded-xl px-4 transition-colors shrink-0"
                  title="Escanear con cámara"
                >
                  <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
                </button>
              </div>
              
              {/* Dropdown Productos */}
              {mostrarDropdownProducto && busquedaProducto && !busquedaProducto.includes('*') && (
                <div className="absolute top-full left-6 right-6 mt-2 bg-white dark:bg-slate-800 border-2 border-teal-500 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50">
                  {resultadosBusquedaProducto.length === 0 ? (
                    <div className="p-4 text-slate-500 text-center font-bold">Buscando...</div>
                  ) : (
                    resultadosBusquedaProducto.map((p, index) => (
                      <div 
                        key={p.id} 
                        onClick={() => agregarItemAlCarrito(p)} 
                        onMouseEnter={() => setIndexProductoSelec(index)}
                        className={`flex justify-between items-center p-4 cursor-pointer border-b border-slate-100 dark:border-slate-700 transition-colors ${indexProductoSelec === index ? 'bg-teal-50 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                      >
                        <div>
                          <div className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                            {indexProductoSelec === index && <span className="material-symbols-outlined text-teal-500 text-[18px]">keyboard_double_arrow_right</span>}
                            {p.nombre}
                          </div>
                          <div className="text-sm text-slate-500 font-medium ml-6">Cod: {p.codigoBarra || p.id} | Stock: {p.stock}</div>
                        </div>
                        <div className="font-black text-teal-600 text-xl">
                          ${p.precioOferta ? p.precioOferta.toLocaleString() : p.precio.toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* LISTA DEL TICKET */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
              <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-black w-24 text-center">Cant.</th>
                      <th className="px-6 py-4 font-black">Detalle del Producto</th>
                      <th className="hidden md:table-cell px-6 py-4 font-black w-32 text-right">Unitario</th>
                      <th className="px-6 py-4 font-black w-40 text-right">Subtotal</th>
                      <th className="px-6 py-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {nuevosItemsCarrito.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-32 text-slate-400">
                          <span className="material-symbols-outlined text-7xl mb-4 opacity-20">shopping_basket</span>
                          <p className="text-xl font-black text-slate-500">Ticket Vacío</p>
                          <p className="text-sm mt-1">Escaneá un artículo para comenzar</p>
                        </td>
                      </tr>
                    ) : (
                      nuevosItemsCarrito.map(item => (
                        <tr key={item.productoId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-6 py-3">
                            <input 
                              type="number" min="1" 
                              value={item.cantidad} 
                              onChange={(e) => cambiarCantidadItem(item.productoId, e.target.value)} 
                              onFocus={(e) => e.target.select()}
                              className="w-full p-2 text-center bg-slate-100 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-black text-lg border border-transparent focus:bg-white" 
                            />
                          </td>
                          <td className="px-6 py-3">
                            <span className="block font-black text-lg leading-tight truncate">{item.nombre}</span>
                            <span className="text-xs text-slate-400 font-bold font-mono">{item.codigo}</span>
                          </td>
                          <td className="hidden md:table-cell px-6 py-3 text-right font-bold text-slate-500">${item.precio?.toLocaleString()}</td>
                          <td className="px-6 py-3 font-black text-right text-xl text-slate-900 dark:text-white">
                            ${(item.precio * item.cantidad).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button onClick={() => eliminarItemDelCarrito(item.productoId)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" title="Eliminar">
                              <span className="material-symbols-outlined text-[24px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: CONFIGURACIÓN Y COBRO */}
          <div className="w-full lg:w-[400px] shrink-0 flex flex-col bg-white dark:bg-slate-900 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-20">
            
            <div className="p-6 space-y-6 flex-1 lg:overflow-y-auto border-b border-slate-200 dark:border-slate-800">
              
              {/* BLOQUE CLIENTE */}
              <div className="relative" ref={dropdownClienteRef}>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">person</span> Cliente Asignado
                  </label>
                </div>
                
                {!nuevoClienteId ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 p-4 rounded-xl flex items-center justify-between mb-4 shadow-sm">
                    <div className="flex items-center gap-2 font-black text-base">
                      <span className="material-symbols-outlined">storefront</span> Consumidor Final
                    </div>
                  </div>
                ) : (
                  <div className="bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500 text-teal-800 dark:text-teal-400 p-4 rounded-xl flex items-center justify-between mb-4 shadow-sm">
                    <div className="font-black text-base flex-1 truncate pr-2">{busquedaCliente}</div>
                    <button onClick={() => {setNuevoClienteId(null); setBusquedaCliente(''); inputProductoRef.current?.focus()}} className="text-teal-600 hover:text-teal-800 bg-white dark:bg-slate-800 rounded-full size-8 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                )}

                <div className="relative">
                  <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">search</span>
                  <input 
                    ref={inputClienteRef}
                    type="text" 
                    placeholder="Buscar DNI/Nombre (Alt+C)..."
                    value={!nuevoClienteId ? busquedaCliente : ''}
                    onChange={manejarBusquedaCliente}
                    onKeyDown={manejarNavegacionCliente}
                    disabled={nuevoClienteId !== null}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 font-bold disabled:opacity-50 text-base transition-all"
                  />
                </div>

                {mostrarDropdownCliente && (
                  <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 border-2 border-teal-500 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {usuariosFiltrados.length === 0 ? (
                      <div className="p-4 text-sm text-center font-bold text-slate-500">No encontrado. <kbd className="bg-slate-100 dark:bg-slate-900 p-1 rounded ml-1 border">Alt+F</kbd> C. Final</div>
                    ) : (
                      usuariosFiltrados.map((u, index) => (
                        <div 
                          key={u.id} 
                          onClick={() => seleccionarCliente(u)} 
                          onMouseEnter={() => setIndexClienteSelec(index)}
                          className={`p-4 cursor-pointer border-b dark:border-slate-700 last:border-0 ${indexClienteSelec === index ? 'bg-teal-50 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                          <div className="font-black text-base text-slate-800 dark:text-slate-100">{u.nombre} {u.apellido}</div>
                          <div className="text-xs font-bold text-slate-400">{u.email}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* BLOQUE MÉTODO DE PAGO */}
              <div className="pt-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-3">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span> Método de Pago
                </label>
                <div className="relative">
                  <select 
                    value={nuevoMetodoPago} 
                    onChange={(e) => {setNuevoMetodoPago(e.target.value); inputProductoRef.current?.focus()}} 
                    className="w-full pl-4 pr-10 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white outline-none focus:border-teal-500 font-black text-base shadow-sm appearance-none cursor-pointer transition-all"
                  >
                    <option value="EFECTIVO">💵 Efectivo Contado</option>
                    <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                    <option value="MERCADO_PAGO">📱 Mercado Pago (Link)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            {/* BLOQUE TOTAL Y BOTÓN DE COBRO */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-slate-500 font-black uppercase tracking-widest text-xs block mb-1">Total a Cobrar</span>
                  <span className="text-xs font-black text-teal-700 bg-teal-100 dark:bg-teal-900/50 px-2.5 py-1 rounded-md inline-block">{cantidadTotalArticulos} artículos</span>
                </div>
                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                  ${totalDelNuevoCarrito.toLocaleString()}
                </span>
              </div>
              
              <button 
                onClick={iniciarCheckout} 
                disabled={guardandoPedido || nuevosItemsCarrito.length === 0} 
                className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${
                  (guardandoPedido || nuevosItemsCarrito.length === 0) 
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-teal-500/30'}`}
              >
                {guardandoPedido ? 'PROCESANDO...' : (
                  <>
                    <span className="material-symbols-outlined text-[28px]">point_of_sale</span> COBRAR (F12)
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL SECUNDARIO: CALCULADORA DE VUELTO (Efectivo) */}
      {/* ========================================================= */}
      {mostrarModalVuelto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col p-8 border border-slate-200 dark:border-slate-800">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-3xl text-teal-500">payments</span>
              Calculadora de Vuelto
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 mb-6 text-center border-2 border-slate-100 dark:border-slate-800">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest block mb-2">Total a Pagar</span>
              <span className="text-5xl font-black text-slate-900 dark:text-white">${totalDelNuevoCarrito.toLocaleString()}</span>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">El cliente abona con:</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-6 flex items-center text-slate-400 font-black text-2xl">$</span>
                  <input 
                    ref={inputMontoAbonadoRef}
                    type="number"
                    value={montoAbonado}
                    onChange={(e) => setMontoAbonado(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={manejarCobroEfectivo}
                    className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-teal-500 rounded-2xl text-4xl font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/20 transition-all shadow-inner"
                  />
                </div>
                <p className="hidden sm:block text-xs text-slate-400 font-bold text-right mt-3">Presioná <kbd className="bg-slate-100 dark:bg-slate-800 border px-1.5 py-0.5 rounded">ENTER</kbd> para confirmar</p>
              </div>

              <div className="p-5 bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-100 dark:border-teal-800/50 rounded-2xl flex justify-between items-center mt-6">
                <span className="text-sm font-black text-teal-800 dark:text-teal-400 uppercase tracking-widest">Dar Vuelto:</span>
                <span className={`text-4xl font-black ${Number(montoAbonado) - totalDelNuevoCarrito < 0 ? 'text-red-500' : 'text-teal-600'}`}>
                  ${(Number(montoAbonado) - totalDelNuevoCarrito).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-4 mt-auto">
              <button 
                onClick={() => {setMostrarModalVuelto(false); setTimeout(() => inputProductoRef.current?.focus(), 100);}} 
                className="flex-1 py-4 rounded-xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest text-sm"
              >
                Volver
              </button>
              <button 
                onClick={guardarEnBackend}
                disabled={Number(montoAbonado) < totalDelNuevoCarrito}
                className="flex-[2] py-4 rounded-xl font-black text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all shadow-lg shadow-teal-500/30 uppercase tracking-widest text-lg disabled:shadow-none"
              >
                Cerrar Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalNuevoPedido;