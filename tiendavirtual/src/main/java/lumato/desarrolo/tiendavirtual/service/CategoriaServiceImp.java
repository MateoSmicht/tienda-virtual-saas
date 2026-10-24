package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.exception.CategoriaDuplicadaException;
import lumato.desarrolo.tiendavirtual.model.Categoria;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Subcategoria;
import lumato.desarrolo.tiendavirtual.repository.CategoriaRepository;
import lumato.desarrolo.tiendavirtual.repository.NegocioRepository;
import lumato.desarrolo.tiendavirtual.repository.SubcategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoriaServiceImp implements CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private SubcategoriaRepository subcategoriaRepository;

    @Autowired
    private AuthService authService;
    @Autowired
    private NegocioRepository negocioRepository;

    // --- CATEGORÍAS PRINCIPALES ---

    @Override
    public List<Categoria> obtenerCategorias() {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return categoriaRepository.findByNegocioId(negocioId);
    }

    @Override
    public Categoria obtenerPorId(Long id) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return categoriaRepository.findByIdAndNegocioId(id, negocioId)
                .orElseThrow(() -> new RuntimeException("No se encontró la categoría o no tienes permisos."));
    }

    @Override
    public Categoria modificarCategoria(Long id, Categoria categoriaModificada) {

        Categoria categoriaExistente = obtenerPorId(id);

        categoriaExistente.setNombre(categoriaModificada.getNombre());
        categoriaExistente.setIcono(categoriaModificada.getIcono());
        return categoriaRepository.save(categoriaExistente);
    }

    @Override
    public Categoria crearCategoria(Categoria categoria) {
        Negocio negocioActual = authService.obtenerNegocioDelUsuarioActual();
        String nombreLimpio = categoria.getNombre().trim();


        if (categoriaRepository.findByNombreIgnoreCaseAndNegocioId(nombreLimpio, negocioActual.getId()).isPresent()) {
            throw new CategoriaDuplicadaException("La categoría principal '" + nombreLimpio + "' ya existe en tu catálogo.");
        }

        categoria.setNombre(nombreLimpio);
        categoria.setNegocio(negocioActual); // Sellamos con el ID de la tienda
        return categoriaRepository.save(categoria);
    }

    @Override
    public void eliminarCategoria(Long id) {
        Categoria categoria = obtenerPorId(id);
        categoriaRepository.delete(categoria);
    }

    // --- SUBCATEGORÍAS ---

    @Override
    public List<Subcategoria> obtenerSubcategoriasPorCategoria(Long categoriaId) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        obtenerPorId(categoriaId);

        return subcategoriaRepository.findByCategoriaIdAndNegocioId(categoriaId, negocioId);
    }

    @Override
    public Subcategoria crearSubcategoria(Long categoriaId, Subcategoria subcategoria) {
        Negocio negocioActual = authService.obtenerNegocioDelUsuarioActual();

        Categoria categoriaPadre = obtenerPorId(categoriaId);

        String nombreLimpio = subcategoria.getNombre().trim();


        if (subcategoriaRepository.findByNombreIgnoreCaseAndCategoriaIdAndNegocioId(nombreLimpio, categoriaId, negocioActual.getId()).isPresent()) {
            throw new CategoriaDuplicadaException("La subcategoría '" + nombreLimpio + "' ya existe dentro de " + categoriaPadre.getNombre());
        }

        subcategoria.setNombre(nombreLimpio);
        subcategoria.setCategoria(categoriaPadre);
        subcategoria.setNegocio(negocioActual);

        return subcategoriaRepository.save(subcategoria);
    }

    @Override
    public void eliminarSubcategoria(Long id) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        Subcategoria subcategoria = subcategoriaRepository.findByIdAndNegocioId(id, negocioId)
                .orElseThrow(() -> new RuntimeException("Subcategoría no encontrada o sin permisos."));

        subcategoriaRepository.delete(subcategoria);
    }



    @Override
    public List<Categoria> obtenerCategoriasPorTiendaSlug(String slug) {
        // 1. Buscamos el negocio por la URL
        Negocio negocio = negocioRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("La tienda no existe."));

        // 2. Control de seguridad (Opcional, pero recomendado):
        // Si no pagó el e-commerce, ni siquiera le mostramos las categorías
        if (negocio.getEcommerceHabilitado() == null || !negocio.getEcommerceHabilitado()) {
            throw new RuntimeException("CATALOGO_INACTIVO");
        }

        // 3. Devolvemos las categorías de ese local
        return categoriaRepository.findByNegocioId(negocio.getId());
    }
}