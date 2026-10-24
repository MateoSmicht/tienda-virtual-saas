package lumato.desarrolo.tiendavirtual.repository;

import lumato.desarrolo.tiendavirtual.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // El inicio de sesión (Login) necesita buscar por email en toda la plataforma.
    // Por eso, este método NO lleva filtro de negocioId.
    Optional<Usuario> findByEmail(String email);

    // Métodos blindados Multi-Tenant
    Optional<Usuario> findByIdAndNegocioId(Long id, Long negocioId);

    List<Usuario> findByNegocioId(Long negocioId);

    @Query("SELECT u FROM Usuario u WHERE u.negocio.id = :negocioId AND (" +
            "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
            "LOWER(u.apellido) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :termino, '%')))")
    List<Usuario> buscarPorTerminoMultiTenant(
            @Param("termino") String termino,
            @Param("negocioId") Long negocioId
    );
}