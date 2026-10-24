package lumato.desarrolo.tiendavirtual.repository;

import lumato.desarrolo.tiendavirtual.model.Caja;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoCaja;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface CajaRepository extends JpaRepository<Caja, Long> {

    Optional<Caja> findByEstadoCajaAndNegocioId(EstadoCaja estado, Long negocioId);

    @Query("SELECT c FROM Caja c WHERE c.negocio.id = :negocioId AND " +
            "(:cajeroId IS NULL OR c.idUsuario = :cajeroId) AND " +
            "(CAST(:fechaInicio AS timestamp) IS NULL OR c.fechaApertura >= :fechaInicio) AND " +
            "(CAST(:fechaFin AS timestamp) IS NULL OR c.fechaApertura <= :fechaFin) " +
            "ORDER BY c.fechaApertura DESC")
    Page<Caja> buscarCajasFiltrosMultiTenant(
            @Param("cajeroId") Long cajeroId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            @Param("negocioId") Long negocioId,
            Pageable pageable);

    Page<Caja> findByNegocioIdOrderByFechaAperturaDesc(Long negocioId, Pageable pageable);

    Optional<Caja> findByEstadoCajaAndIdUsuarioAndNegocioId(EstadoCaja estadoCaja, Long idUsuario, Long negocioId);
}