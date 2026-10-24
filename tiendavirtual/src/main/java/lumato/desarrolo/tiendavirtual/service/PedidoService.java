package lumato.desarrolo.tiendavirtual.service;


import lumato.desarrolo.tiendavirtual.dto.NotificacionPedidoDTO;
import lumato.desarrolo.tiendavirtual.dto.PedidoRequestDTO;
import lumato.desarrolo.tiendavirtual.dto.PedidoResponseDTO;
import lumato.desarrolo.tiendavirtual.model.Pedido;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface PedidoService {
    PedidoResponseDTO procesarNuevaCompra(PedidoRequestDTO request,String authHeader);
    List<Pedido> obtenerTodosLosPedidos();
    Pedido obtenerPedidoPorId(Long id);
    Pedido cambiarEstadoPedido(Long id, EstadoPedido nuevoEstado, String authHeader);
    void eliminarPedido(Long id);
    List<Pedido> obtenerPedidosPorRangoDeFechas(LocalDateTime inicio, LocalDateTime fin);
    List<Pedido> obtenerUltimos5Pedidos();
    Page<Pedido> obtenerPedidosPaginadosYFiltrados(int page, int size, EstadoPedido estado, LocalDateTime inicio, LocalDateTime fin);
    List<NotificacionPedidoDTO> obtenerUltimasNotificaciones();
    List<Pedido> obtenerPedidosDeUsuario(Long usuarioId);
    Pedido eliminarItemYRecalcular(Long pedidoId, Long productoId);
    Pedido modificarCantidadYRecalcular(Long pedidoId, Long productoId, Integer nuevaCantidad);

    @Transactional
    Pedido agregarItemYRecalcular(Long pedidoId, Long productoId, Integer cantidadSuma);

    Page<PedidoResponseDTO> obtenerHistorialDTOPaginado(Long usuarioId, int page, int size);
}
