package lumato.desarrolo.tiendavirtual.service;


import lumato.desarrolo.tiendavirtual.model.Categoria;
import lumato.desarrolo.tiendavirtual.model.Subcategoria;

import java.util.List;

public interface CategoriaService {
    // Gestión de Categorías Principales
    List<Categoria> obtenerCategorias();
    Categoria crearCategoria(Categoria categoria);
    void eliminarCategoria(Long id);
    Categoria obtenerPorId(Long id);
    Categoria modificarCategoria(Long id, Categoria cat);

    // Gestión de Subcategorías
    List<Subcategoria> obtenerSubcategoriasPorCategoria(Long categoriaId);
    Subcategoria crearSubcategoria(Long categoriaId, Subcategoria subcategoria);
    void eliminarSubcategoria(Long id);

    List<Categoria> obtenerCategoriasPorTiendaSlug(String slug);
}
