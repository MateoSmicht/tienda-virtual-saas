package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.dto.*;
import lumato.desarrolo.tiendavirtual.exception.StockInsuficienteException;
import lumato.desarrolo.tiendavirtual.model.*;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimientoStock;
import lumato.desarrolo.tiendavirtual.repository.MovimientoStockRepository;
import lumato.desarrolo.tiendavirtual.repository.PedidoRepository;
import lumato.desarrolo.tiendavirtual.repository.ProductoRepository;
import lumato.desarrolo.tiendavirtual.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido.PAGADO;
import static lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido.PENDIENTE;

@Service
public class PedidoServiceImp implements PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoService productoService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private MercadoPagoService mercadoPagoService;

    @Autowired
    private CajaService cajaService;

    @Autowired
    private AuthService authService;

    @Autowired
    private MovimientoStockRepository movimientoStockRepository;

    @Autowired
    private ProductoRepository productoRepository; // Lo inyectamos para guardar el stock devuelto

    @Override
    @Transactional
    public PedidoResponseDTO procesarNuevaCompra(PedidoRequestDTO request, String authHeader) {

        Usuario ejecutorCompra = authService.obtenerUsuarioDelToken(authHeader);
        Negocio negocioActual = ejecutorCompra.getNegocio();

        Usuario cliente = null;
        Long cajeroId = null;

        if (ejecutorCompra.getRol().name().equals("ADMIN") || ejecutorCompra.getRol().name().equals("CAJERO")) {
            cajeroId = ejecutorCompra.getId();
            if (request.getUsuarioId() != null) {
                cliente = usuarioRepository.findById(request.getUsuarioId()).orElse(null);
            }
        } else {
            cliente = ejecutorCompra;
        }

        Pedido pedido = new Pedido();
        pedido.setUsuario(cliente);
        pedido.setMetodoPago(request.getMetodoPago());
        pedido.setNegocio(negocioActual);
        pedido.setMensaje(request.getMensaje());

        if (cajeroId != null) {
            Caja cajaActual = cajaService.obtenerCajaActual(authHeader);
            if (cajaActual == null) {
                throw new IllegalStateException("Error: No tenés una caja abierta para facturar.");
            }
            pedido.setCajaId(cajaActual.getId());
        } else {
            pedido.setCajaId(null);
        }

        Double totalPedido = 0.0;

        for (ItemCarritoDTO item : request.getItems()) {
            Producto productoActualizado = productoService.obtenerPorId(item.getProductoId());

            Boolean controla = (productoActualizado.getControlarStock() != null) ? productoActualizado.getControlarStock() : false;
            if (controla) {
                Integer stockActual = (productoActualizado.getStock() != null) ? productoActualizado.getStock() : 0;
                if (stockActual < item.getCantidad()) {
                    throw new StockInsuficienteException("No hay stock suficiente para crear el pedido de: " + productoActualizado.getNombre());
                }
            }

            Double precioACobrar = productoActualizado.getPrecio();
            if (productoActualizado.getEsOferta() && productoActualizado.getPrecioOferta() != null) {
                precioACobrar = productoActualizado.getPrecioOferta();
            }

            DetallePedido detalle = new DetallePedido();
            detalle.setProducto(productoActualizado);
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(precioACobrar);
            detalle.setNegocio(negocioActual);

            pedido.addDetalle(detalle);
            totalPedido += (precioACobrar * item.getCantidad());
        }

        pedido.setEstado(pedidoPorCajeroPAGADO(ejecutorCompra));
        pedido.setTotal(totalPedido);
        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        if (pedidoGuardado.getCajaId() != null) {
            pedidoGuardado.getDetalles().forEach(detalle -> {
                // 1. Descontamos el stock físico en el momento
                productoService.descontarStock(detalle.getProducto().getId(), detalle.getCantidad());

                // 2. Registramos el movimiento inmutable en el Kardex
                MovimientoStock egresoVenta = new MovimientoStock();
                egresoVenta.setFecha(LocalDateTime.now());
                egresoVenta.setProducto(detalle.getProducto());
                egresoVenta.setCantidad(-detalle.getCantidad()); // Negativo explícito por ser egreso
                egresoVenta.setTipo(TipoMovimientoStock.VENTA);
                egresoVenta.setUsuario(ejecutorCompra); // El cajero que operó
                egresoVenta.setNegocio(negocioActual);
                egresoVenta.setDetalle("Venta directa en mostrador. Pedido #" + pedidoGuardado.getId());

                movimientoStockRepository.save(egresoVenta);
            });
        }
        // =========================================================================

        PedidoResponseDTO response = new PedidoResponseDTO();
        response.setIdPedido(pedidoGuardado.getId());
        response.setEstado(pedidoGuardado.getEstado().name());
        response.setTotal(pedidoGuardado.getTotal());
        response.setMetodoPago(pedidoGuardado.getMetodoPago().name());
        response.setFecha(pedidoGuardado.getFechaPedido());

        String nombreCliente = (cliente != null) ? cliente.getNombre() : "Consumidor Final";
        response.setMensaje("¡Venta registrada con éxito a " + nombreCliente + "!");

        if (pedidoGuardado.getCajaId() == null) {
            try {
                emailService.enviarAvisoDeNuevoPedido(pedidoGuardado);
            } catch (Exception e) {
                System.out.println("Error al enviar el correo: " + e.getMessage());
            }
        }

        if (pedidoGuardado.getMetodoPago().name().equals("MERCADO_PAGO")) {
            String link = mercadoPagoService.crearLinkDePago(pedidoGuardado);
            response.setLinkDePago(link);
        }

        return response;
    }
    private EstadoPedido pedidoPorCajeroPAGADO(Usuario user){
        if (user.getRol().name().equals("ADMIN") || user.getRol().name().equals("CAJERO")) {
            return PAGADO;
        }
        return PENDIENTE;
    }

    public Page<Pedido> obtenerPedidosPaginadosYFiltrados(int page, int size, EstadoPedido estado, LocalDateTime inicio, LocalDateTime fin) {
        Pageable pageable = PageRequest.of(page, size);
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return pedidoRepository.buscarPedidosConFiltrosMultiTenant(estado, inicio, fin, negocioId, pageable);
    }

    @Override
    public List<Pedido> obtenerTodosLosPedidos() {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return pedidoRepository.findByNegocioId(negocioId);
    }

    @Override
    public Pedido obtenerPedidoPorId(Long id) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return pedidoRepository.findByIdAndNegocioId(id, negocioId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado o no tienes permiso para verlo."));
    }



    @Transactional
    @Override
    public Pedido cambiarEstadoPedido(Long id, EstadoPedido nuevoEstado, String authHeader) {

        Usuario usuarioActual = authService.obtenerUsuarioDelToken(authHeader);
        Negocio negocioActual = usuarioActual.getNegocio();
        Pedido pedido = obtenerPedidoPorId(id);

        EstadoPedido estadoActual = pedido.getEstado();

        // 1. ¿El estado actual ya tenía el stock descontado?
        boolean stockYaDescontado = (estadoActual == EstadoPedido.PAGADO || estadoActual == EstadoPedido.ENTREGADO);

        // 2. ¿El nuevo estado exige que el stock esté descontado?
        boolean nuevoEstadoRequiereDescuento = (nuevoEstado == EstadoPedido.PAGADO || nuevoEstado == EstadoPedido.ENTREGADO);

        // ==========================================
        // CASO A: DESCONTAR STOCK (Avanza a Pagado/Entregado)
        // ==========================================
        if (!stockYaDescontado && nuevoEstadoRequiereDescuento) {
            System.out.println("Descontando stock. Pedido #" + id + " pasó a " + nuevoEstado);

            pedido.getDetalles().forEach(detalle -> {
                // Descontamos el stock físico
                productoService.descontarStock(detalle.getProducto().getId(), detalle.getCantidad());

                // Anotamos en el Kardex
                MovimientoStock egreso = new MovimientoStock();
                egreso.setFecha(LocalDateTime.now());
                egreso.setProducto(detalle.getProducto());
                egreso.setCantidad(-detalle.getCantidad()); // Negativo
                egreso.setTipo(TipoMovimientoStock.VENTA);
                egreso.setUsuario(usuarioActual);
                egreso.setNegocio(negocioActual);
                egreso.setDetalle("Stock descontado. Pedido #" + id + " (" + nuevoEstado + ")");
                movimientoStockRepository.save(egreso);
            });
        }

        // ==========================================
        // CASO B: DEVOLVER STOCK (Retrocede a Pendiente/Cancelado)
        // ==========================================
        if (stockYaDescontado && !nuevoEstadoRequiereDescuento) {
            System.out.println("Devolviendo stock. Pedido #" + id + " retrocedió a " + nuevoEstado);

            pedido.getDetalles().forEach(detalle -> {
                Producto producto = detalle.getProducto();

                // Sumamos el stock físico directamente
                Integer stockActual = (producto.getStock() != null) ? producto.getStock() : 0;
                producto.setStock(stockActual + detalle.getCantidad());
                productoRepository.save(producto);

                // Anotamos en el Kardex
                MovimientoStock devolucion = new MovimientoStock();
                devolucion.setFecha(LocalDateTime.now());
                devolucion.setProducto(producto);
                devolucion.setCantidad(detalle.getCantidad()); // Positivo
                devolucion.setTipo(TipoMovimientoStock.DEVOLUCION_CLIENTE);
                devolucion.setUsuario(usuarioActual);
                devolucion.setNegocio(negocioActual);
                devolucion.setDetalle("Stock devuelto. Pedido #" + id + " (" + nuevoEstado + ")");
                movimientoStockRepository.save(devolucion);
            });
        }

        // 3. Finalmente, guardamos el nuevo estado
        pedido.setEstado(nuevoEstado);
        return pedidoRepository.save(pedido);
    }

    @Override
    public void eliminarPedido(Long id) {
        Pedido pedido = obtenerPedidoPorId(id);
        pedidoRepository.delete(pedido);
    }

    @Override
    public List<Pedido> obtenerPedidosPorRangoDeFechas(LocalDateTime inicio, LocalDateTime fin) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return pedidoRepository.findByFechaPedidoBetweenAndNegocioId(inicio, fin, negocioId);
    }

    @Override
    public List<Pedido> obtenerUltimos5Pedidos() {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return pedidoRepository.findTop5ByNegocioIdOrderByFechaPedidoDesc(negocioId);
    }

    @Override
    public List<NotificacionPedidoDTO> obtenerUltimasNotificaciones() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM HH:mm");
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        return pedidoRepository.findTop5ByNegocioIdOrderByFechaPedidoDesc(negocioId).stream()
                .map(p -> {
                    String nombre = (p.getUsuario() != null) ? p.getUsuario().getNombre() : "Usuario";
                    Double total = (p.getTotal() != null) ? p.getTotal() : 0.0;
                    String fechaStr = (p.getFechaPedido() != null) ? p.getFechaPedido().format(formatter) : "";

                    String mensaje = "Nuevo pedido de " + nombre + " monto total: $" + total;

                    return new NotificacionPedidoDTO(p.getId(), mensaje, fechaStr);
                })
                .toList();
    }

    @Override
    public List<Pedido> obtenerPedidosDeUsuario(Long usuarioId) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        // Nos aseguramos de que traiga los pedidos de ESE usuario y de ESTE negocio en particular.
        return pedidoRepository.findByUsuarioIdAndNegocioIdOrderByFechaPedidoDesc(usuarioId, negocioId);
    }


    @Override
    @Transactional(readOnly = true)
    public Page<PedidoResponseDTO> obtenerHistorialDTOPaginado(Long usuarioId, int page, int size) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        Pageable pageable = PageRequest.of(page, size);

        Page<Pedido> misPedidosPage = pedidoRepository.findByUsuarioIdAndNegocioIdOrderByFechaPedidoDesc(usuarioId, negocioId, pageable);

        return misPedidosPage.map(this::convertirAPedidoDTO);
    }

    private void recalcularTotal(Pedido pedido) {
        double nuevoTotal = pedido.getDetalles().stream()
                .mapToDouble(d -> d.getCantidad() * d.getPrecioUnitario())
                .sum();
        pedido.setTotal(Math.round(nuevoTotal * 100.0) / 100.0); // Redondeo a 2 decimales
    }



    @Override
    @Transactional
    public Pedido eliminarItemYRecalcular(Long pedidoId, Long productoId) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        Pedido pedido = pedidoRepository.findByIdAndNegocioId(pedidoId, negocioId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado."));

        // 🔥 REGLA DE ORO: Solo se edita si está PENDIENTE
        if (pedido.getEstado() != EstadoPedido.PENDIENTE) {
            throw new IllegalStateException("Para modificar los productos, primero debes pasar el pedido a estado PENDIENTE.");
        }

        boolean removido = pedido.getDetalles().removeIf(detalle -> detalle.getProducto().getId().equals(productoId));

        if (!removido) {
            throw new RuntimeException("El producto no existe en este pedido.");
        }

        recalcularTotal(pedido);
        return pedidoRepository.save(pedido);
    }

    @Override
    @Transactional
    public Pedido modificarCantidadYRecalcular(Long pedidoId, Long productoId, Integer nuevaCantidad) {
        if (nuevaCantidad <= 0) {
            return eliminarItemYRecalcular(pedidoId, productoId);
        }

        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        Pedido pedido = pedidoRepository.findByIdAndNegocioId(pedidoId, negocioId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado."));

        // 🔥 REGLA DE ORO: Solo se edita si está PENDIENTE
        if (pedido.getEstado() != EstadoPedido.PENDIENTE) {
            throw new IllegalStateException("Para modificar los productos, primero debes pasar el pedido a estado PENDIENTE.");
        }

        pedido.getDetalles().stream()
                .filter(detalle -> detalle.getProducto().getId().equals(productoId))
                .findFirst()
                .ifPresentOrElse(
                        detalle -> detalle.setCantidad(nuevaCantidad),
                        () -> { throw new RuntimeException("El producto no existe."); }
                );

        recalcularTotal(pedido);
        return pedidoRepository.save(pedido);
    }

    @Transactional
    @Override
    public Pedido agregarItemYRecalcular(Long pedidoId, Long productoId, Integer cantidadSuma) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        Pedido pedido = pedidoRepository.findByIdAndNegocioId(pedidoId, negocioId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado."));

        // 🔥 REGLA DE ORO: Solo se edita si está PENDIENTE
        if (pedido.getEstado() != EstadoPedido.PENDIENTE) {
            throw new IllegalStateException("Para modificar los productos, primero debes pasar el pedido a estado PENDIENTE.");
        }

        Optional<DetallePedido> detalleExistente = pedido.getDetalles().stream()
                .filter(d -> d.getProducto().getId().equals(productoId))
                .findFirst();

        if (detalleExistente.isPresent()) {
            DetallePedido detalle = detalleExistente.get();
            detalle.setCantidad(detalle.getCantidad() + cantidadSuma);
        } else {
            Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado."));

            DetallePedido nuevoDetalle = new DetallePedido();
            nuevoDetalle.setPedido(pedido);
            nuevoDetalle.setProducto(producto);
            nuevoDetalle.setCantidad(cantidadSuma);
            nuevoDetalle.setPrecioUnitario(producto.getEsOferta() ? producto.getPrecioOferta() : producto.getPrecio());
            nuevoDetalle.setNegocio(pedido.getNegocio());

            pedido.getDetalles().add(nuevoDetalle);
        }

        recalcularTotal(pedido);
        return pedidoRepository.save(pedido);
    }

    // ========================================================
    // MÉTODO AYUDANTE: Convierte Entidad -> DTO
    // ========================================================
    private PedidoResponseDTO convertirAPedidoDTO(Pedido pedido) {
        PedidoResponseDTO dto = new PedidoResponseDTO();

        dto.setIdPedido(pedido.getId());
        dto.setEstado(pedido.getEstado() != null ? pedido.getEstado().name() : "PENDIENTE");
        dto.setTotal(pedido.getTotal());
        dto.setMetodoPago(pedido.getMetodoPago() != null ? pedido.getMetodoPago().name() : "EFECTIVO");
        dto.setFecha(pedido.getFechaPedido());

        // Si el pedido se hizo por caja, pasamos el ID
        if (pedido.getCajaId() != null) {
            dto.setCajaId(pedido.getCajaId());
        }

        // Mapeamos los productos del carrito
        if (pedido.getDetalles() != null) {
            List<DetallePedidoDTO> itemsDTO = pedido.getDetalles().stream().map(detalle -> {
                DetallePedidoDTO item = new DetallePedidoDTO();
                item.setCantidad(detalle.getCantidad());
                item.setPrecioUnitario(detalle.getPrecioUnitario());

                if (detalle.getProducto() != null) {
                    item.setProductoId(detalle.getProducto().getId()); // Clave para que React pueda editar
                    item.setNombreProducto(detalle.getProducto().getNombre());
                    item.setImagenUrl(detalle.getProducto().getImagenUrl());
                } else {
                    item.setNombreProducto("Producto no disponible");
                }
                return item;
            }).collect(Collectors.toList());

            dto.setItems(itemsDTO);
        }

        return dto;
    }


}
