package lumato.desarrolo.tiendavirtual.controller;


import lumato.desarrolo.tiendavirtual.dto.CategoriaPublicaDTO;
import lumato.desarrolo.tiendavirtual.dto.SubcategoriaPublicaDTO;
import lumato.desarrolo.tiendavirtual.model.Categoria;
import lumato.desarrolo.tiendavirtual.model.Producto;
import lumato.desarrolo.tiendavirtual.model.Subcategoria;
import lumato.desarrolo.tiendavirtual.service.CategoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categorias")
@CrossOrigin(origins = "*")
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;


    @GetMapping
    public ResponseEntity<List<Categoria>> listarCategorias() {
        return ResponseEntity.ok(categoriaService.obtenerCategorias());
    }

    @GetMapping("/{id}")
    public Categoria buscarPorId(@PathVariable Long id) {
        return(categoriaService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<Categoria> crearCategoria(@RequestBody Categoria categoria) {
        return ResponseEntity.ok(categoriaService.crearCategoria(categoria));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCategoria(@PathVariable Long id) {
        categoriaService.eliminarCategoria(id);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/{id}")
    public ResponseEntity<Categoria> modificarCategoria(@PathVariable Long id,
                                  @RequestBody Categoria categoriaModificado) {
        Categoria actualizada = categoriaService.modificarCategoria(id, categoriaModificado);
        return ResponseEntity.ok(actualizada);
    }




    @GetMapping("/{categoriaId}/subcategorias")
    public ResponseEntity<List<Subcategoria>> listarSubcategorias(@PathVariable Long categoriaId) {
        return ResponseEntity.ok(categoriaService.obtenerSubcategoriasPorCategoria(categoriaId));
    }


    @PostMapping("/{categoriaId}/subcategorias")
    public ResponseEntity<Subcategoria> crearSubcategoria(
            @PathVariable Long categoriaId,
            @RequestBody Subcategoria subcategoria) {
        try {
            return ResponseEntity.ok(categoriaService.crearSubcategoria(categoriaId, subcategoria));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/subcategorias/{id}")
    public ResponseEntity<Void> eliminarSubcategoria(@PathVariable Long id) {
        categoriaService.eliminarSubcategoria(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/publico")
    public ResponseEntity<?> obtenerCategoriasPublicas(@RequestParam String tiendaSlug) {
        try {
            // 1. Buscás las categorías crudas en la base de datos (según como lo tengas en tu Service)
            List<Categoria> categoriasCrudas = categoriaService.obtenerCategoriasPorTiendaSlug(tiendaSlug);

            // 2. Las pasás por el colador para limpiarlas
            List<CategoriaPublicaDTO> categoriasSeguras = categoriasCrudas.stream().map(cat -> {

                // Limpiamos las subcategorías de adentro
                List<SubcategoriaPublicaDTO> subsSeguras = cat.getSubcategorias().stream()
                        .map(sub -> new SubcategoriaPublicaDTO(sub.getId(), sub.getNombre()))
                        .collect(Collectors.toList());

                // Armamos la categoría limpia
                return new CategoriaPublicaDTO(cat.getId(), cat.getNombre(), cat.getIcono(), subsSeguras);

            }).collect(Collectors.toList());

            // 3. Devolvés el JSON liviano y seguro
            return ResponseEntity.ok(categoriasSeguras);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}