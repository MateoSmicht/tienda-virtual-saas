package lumato.desarrolo.tiendavirtual.repository;

import lumato.desarrolo.tiendavirtual.dto.ProductoStatDTO;
import lumato.desarrolo.tiendavirtual.model.Pedido;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
import lumato.desarrolo.tiendavirtual.model.enums.MetodoPago;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    // ==========================================
    // MÉTODOS BÁSICOS MULTI-TENANT (Spring Data)
    // ==========================================

    List<Pedido> findByNegocioId(Long negocioId);

    Optional<Pedido> findByIdAndNegocioId(Long id, Long negocioId);

    List<Pedido> findByCajaIdAndNegocioId(Long idCaja, Long negocioId);

    List<Pedido> findByFechaPedidoBetweenAndNegocioId(LocalDateTime fechaInicio, LocalDateTime fechaFin, Long negocioId);

    List<Pedido> findByUsuarioIdAndNegocioIdOrderByFechaPedidoDesc(Long usuarioId, Long negocioId);

    List<Pedido> findTop5ByNegocioIdOrderByFechaPedidoDesc(Long negocioId);

    List<Pedido> findByEstadoAndMetodoPagoAndFechaPedidoBeforeAndNegocioId(
            EstadoPedido estado,
            MetodoPago metodoPago,
            LocalDateTime limite,
            Long negocioId
    );

    // ==========================================
    // CONSULTAS COMPLEJAS Y ESTADÍSTICAS (CON FILTRO DE NEGOCIO)
    // ==========================================

    @Query("SELECT p FROM Pedido p WHERE p.negocio.id = :negocioId " +
            "AND (:estado IS NULL OR p.estado = :estado) " +
            "AND (cast(:inicio as date) IS NULL OR p.fechaPedido >= :inicio) " +
            "AND (cast(:fin as date) IS NULL OR p.fechaPedido <= :fin) " +
            "ORDER BY p.fechaPedido DESC")
    Page<Pedido> buscarPedidosConFiltrosMultiTenant(
            @Param("estado") EstadoPedido estado,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("negocioId") Long negocioId,
            Pageable pageable
    );


    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.negocio.id = :negocioId AND p.fechaPedido >= :inicio AND p.fechaPedido <= :fin AND p.estado != 'CANCELADO'")
    Double sumIngresosEntreFechas(
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("negocioId") Long negocioId
    );

    // Cantidad de ventas acotada al negocio
    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.negocio.id = :negocioId AND p.fechaPedido >= :inicio AND p.fechaPedido <= :fin AND p.estado != 'CANCELADO'")
    Long countPedidosEntreFechas(
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("negocioId") Long negocioId
    );


    @Query("SELECT p.fechaPedido, p.total FROM Pedido p WHERE p.negocio.id = :negocioId AND p.fechaPedido >= :inicio AND p.fechaPedido <= :fin AND p.estado != 'CANCELADO'")
    List<Object[]> findVentasParaGrafico(
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("negocioId") Long negocioId
    );

    @Query("SELECT new lumato.desarrolo.tiendavirtual.dto.ProductoStatDTO(" +
            "d.producto.nombre, " +
            "SUM(CAST(d.cantidad AS long)), " +
            "SUM(d.cantidad * d.precioUnitario), " +
            "MAX(d.pedido.fechaPedido)) " +
            "FROM DetallePedido d " +
            "WHERE d.pedido.negocio.id = :negocioId AND d.producto.id = :productoId AND d.pedido.estado = lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido.PAGADO " +
            "GROUP BY d.producto.id, d.producto.nombre")
    Optional<ProductoStatDTO> obtenerEstadisticasHistoricasPorProducto(
            @Param("productoId") Long productoId,
            @Param("negocioId") Long negocioId
    );

    List<Pedido> findByEstadoAndMetodoPagoAndFechaPedidoBeforeAndCajaIdIsNull(
            EstadoPedido estado,
            MetodoPago metodoPago,
            LocalDateTime limite
    );

    Page<Pedido> findByUsuarioIdAndNegocioIdOrderByFechaPedidoDesc(Long usuarioId, Long negocioId, Pageable pageable);
}