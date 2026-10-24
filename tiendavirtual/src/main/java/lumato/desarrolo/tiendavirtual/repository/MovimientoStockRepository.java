package lumato.desarrolo.tiendavirtual.repository;

import lumato.desarrolo.tiendavirtual.dto.ResumenBoletaDTO;
import lumato.desarrolo.tiendavirtual.model.MovimientoStock;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimientoStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long> {


    // Auditoría general del comercio
    Page<MovimientoStock> findByNegocioIdOrderByFechaDesc(Long negocioId, Pageable pageable);
    Page<MovimientoStock> findByProductoIdAndNegocioIdOrderByFechaDesc(Long productoId, Long negocioId, Pageable pageable);

    // Consulta dinámica a prueba de nulos para los filtros
    @Query("SELECT m FROM MovimientoStock m WHERE m.negocio.id = :negocioId " +
            "AND (:tipo IS NULL OR m.tipo = :tipo) " +
            "AND (cast(:inicio as date) IS NULL OR m.fecha >= :inicio) " +
            "AND (cast(:fin as date) IS NULL OR m.fecha <= :fin) " +
            "ORDER BY m.fecha DESC")
    Page<MovimientoStock> buscarHistorialConFiltros(
            @Param("negocioId") Long negocioId,
            @Param("tipo") TipoMovimientoStock tipo,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            Pageable pageable
    );

    // Búsqueda de todos los ítems de una boleta por su fecha exacta
    List<MovimientoStock> findByNegocioIdAndFecha(Long negocioId, LocalDateTime fecha);

    @Query("SELECT new lumato.desarrolo.tiendavirtual.dto.ResumenBoletaDTO(" +
            "MIN(m.id), m.fecha, m.tipo, u.nombre, p.nombre, COUNT(m.id), SUM(m.cantidad)) " +
            "FROM MovimientoStock m " +
            "LEFT JOIN m.usuario u " +
            "LEFT JOIN m.proveedor p " +
            "WHERE m.negocio.id = :negocioId " +
            "AND (:tipo IS NULL OR m.tipo = :tipo) " +
            "AND (cast(:inicio as date) IS NULL OR m.fecha >= :inicio) " +
            "AND (cast(:fin as date) IS NULL OR m.fecha <= :fin) " +
            "GROUP BY m.fecha, m.tipo, u.nombre, p.nombre " +
            "ORDER BY m.fecha DESC")
    Page<ResumenBoletaDTO> buscarBoletasAgrupadas(
            @Param("negocioId") Long negocioId,
            @Param("tipo") TipoMovimientoStock tipo,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            Pageable pageable
    );
}
