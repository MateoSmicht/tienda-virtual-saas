package lumato.desarrolo.tiendavirtual.repository;


import lumato.desarrolo.tiendavirtual.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByNegocioId(Long negocioId);
    Optional<Categoria> findByIdAndNegocioId(Long id, Long negocioId);
    Optional<Categoria> findByNombreIgnoreCaseAndNegocioId(String nombreLimpio, Long negocioId);


}