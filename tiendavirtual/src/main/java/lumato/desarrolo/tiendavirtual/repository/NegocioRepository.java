package lumato.desarrolo.tiendavirtual.repository;

import lumato.desarrolo.tiendavirtual.model.Negocio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NegocioRepository extends JpaRepository<Negocio, Long> {

    // Busca un negocio por su email de contacto (útil para auditorías o validaciones)
    Optional<Negocio> findByEmailContacto(String emailContacto);

    // Opcional: Busca por el nombre exacto del comercio
    Optional<Negocio> findByNombreIgnoreCase(String nombre);

     // (ej: /tienda/perfumeria-lumato)
    Optional<Negocio> findBySlug(String slug);

}