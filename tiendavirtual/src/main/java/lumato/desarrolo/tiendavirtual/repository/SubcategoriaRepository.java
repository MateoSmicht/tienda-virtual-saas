package lumato.desarrolo.tiendavirtual.repository;


import lumato.desarrolo.tiendavirtual.model.Subcategoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubcategoriaRepository extends JpaRepository<Subcategoria, Long> {
    List<Subcategoria> findByCategoriaIdAndNegocioId(Long categoriaId, Long negocioId);
    Optional<Subcategoria> findByIdAndNegocioId(Long id, Long negocioId);
    Optional<Subcategoria> findByNombreIgnoreCaseAndCategoriaIdAndNegocioId(String nombreLimpio, Long categoriaId, Long negocioId);
}