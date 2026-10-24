package lumato.desarrolo.tiendavirtual.repository;

import lumato.desarrolo.tiendavirtual.model.MovimientoCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Long> {

    List<MovimientoCaja> findByCajaIdAndNegocioId(Long cajaId, Long negocioId);

    Optional<MovimientoCaja> findByIdAndNegocioId(Long id, Long negocioId);

    List<MovimientoCaja> findByNegocioId(Long negocioId);
}