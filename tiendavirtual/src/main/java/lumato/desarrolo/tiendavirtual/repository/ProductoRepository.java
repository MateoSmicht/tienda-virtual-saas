package lumato.desarrolo.tiendavirtual.repository;

import jakarta.validation.constraints.NotBlank;
import lumato.desarrolo.tiendavirtual.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    Page<Producto> findAllByNegocioId(Long negocioId, Pageable pageable);

    Page<Producto> findByDisponibleTrueAndNegocioId(Long negocioId, Pageable pageable);


    Page<Producto> findByEsOfertaTrueAndDisponibleTrueAndNegocioId(Long negocioId, Pageable pageable);
    Optional<Producto> findByIdAndNegocioId(Long id, Long negocioId);

    Optional<Producto> findByCodigoBarraAndNegocioId(
            @NotBlank(message = "El código de barras es obligatorio") String codigoBarra,
            Long negocioId
    );

    // ==========================================
    // CONTEOS Y ESTADÍSTICAS MULTI-TENANT
    // ==========================================

    long countByNegocioId(Long negocioId);

    long countByPrecioOfertaGreaterThanAndNegocioId(Double precio, Long negocioId);

    long countByDisponibleTrueAndNegocioId(Long negocioId);

    long countByStockLessThanEqualAndNegocioId(Integer stock, Long negocioId);

    @Query("SELECT COALESCE(SUM(p.stock * p.ppp), 0) FROM Producto p WHERE p.stock > 0 AND p.negocio.id = :negocioId")
    Double calcularValorTotalInventarioPorNegocio(@Param("negocioId") Long negocioId);

    // ==========================================
    // CONSULTAS COMPLEJAS (CUSTOM QUERIES)
    // ==========================================

    @Query("SELECT p FROM Producto p WHERE p.subcategoria.categoria.id = :categoriaId AND p.negocio.id = :negocioId")
    List<Producto> buscarPorCategoriaMadreAndNegocioId(
            @Param("categoriaId") Long categoriaId,
            @Param("negocioId") Long negocioId
    );

    @Query("SELECT p FROM Producto p LEFT JOIN p.subcategoria s " +
            "WHERE p.negocio.id = :negocioId " +
            "AND (:busqueda IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR LOWER(p.codigoBarra) LIKE LOWER(CONCAT('%', :busqueda, '%'))) " +
            "AND (:categoriaId IS NULL OR s.categoria.id = :categoriaId) " +
            "AND (:subcategoriaId IS NULL OR p.subcategoria.id = :subcategoriaId) " +
            "AND (:stockMax IS NULL OR p.stock <= :stockMax) " +
            "AND (:todos = true OR p.disponible = true)")
    Page<Producto> buscarConFiltrosDinamicosMultiTenant(
            @Param("busqueda") String busqueda,
            @Param("categoriaId") Long categoriaId,
            @Param("subcategoriaId") Long subcategoriaId,
            @Param("stockMax") Integer stockMax,
            @Param("todos") boolean todos,
            @Param("negocioId") Long negocioId,
            Pageable pageable
    );

    @Modifying
    @Transactional
    @Query("UPDATE Producto p SET p.precio = p.precio * :factor WHERE p.proveedor.id = :proveedorId AND p.negocio.id = :negocioId")
    void aumentarPreciosPorProveedorAndNegocio(
            @Param("proveedorId") Long proveedorId,
            @Param("factor") Double factor,
            @Param("negocioId") Long negocioId
    );


    Optional<Producto> findFirstByCodigoBarra(String codigoBarras);
    Page<Producto> findByNegocioIdAndDisponibleTrueAndEsOfertaTrue(Long negocioId, Pageable pageable);
    Page<Producto> findByNegocioIdAndDisponibleTrue(Long negocioId,Pageable pageable);

    @Query("SELECT p FROM Producto p WHERE p.negocio.id = :negocioId AND p.disponible = true " +
            "AND (:categoriaId IS NULL OR p.subcategoria.categoria.id = :categoriaId) " +
            "AND (:subcategoriaId IS NULL OR p.subcategoria.id = :subcategoriaId) " +
            "AND (:busqueda IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')))")
    Page<Producto> findCatalogoPublicoFiltrado(
            @Param("negocioId") Long negocioId,
            @Param("categoriaId") Long categoriaId,
            @Param("subcategoriaId") Long subcategoriaId,
            @Param("busqueda") String busqueda,
            Pageable pageable
    );
}