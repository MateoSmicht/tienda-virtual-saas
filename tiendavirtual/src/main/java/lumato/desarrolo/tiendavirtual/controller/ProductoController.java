package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.dto.*;
import lumato.desarrolo.tiendavirtual.model.Producto;
import lumato.desarrolo.tiendavirtual.service.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*") // Permite que tu frontend HTML/JS se conecte sin bloqueos de seguridad CORS
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @GetMapping
    public ResponseEntity<Page<Producto>> obtenerProductos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean todos,
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) Long subcategoriaId,
            @RequestParam(required = false) Integer stockMax) {

        Page<Producto> productos = productoService.obtenerProductosPaginadosYFiltrados(page, size, todos, busqueda, categoriaId, subcategoriaId, stockMax);
        return ResponseEntity.ok(productos);
    }

    // Endpoint: GET /api/productos/id
    @GetMapping("/{id}")
    public Producto buscarProducto(@PathVariable Long id) {
       return productoService.obtenerPorId(id);
    }

    @GetMapping("/ofertas")
    public ResponseEntity<Page<Producto>> verOfertas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Producto> ofertasPaginadas = productoService.obtenerOfertas(page, size);
        return ResponseEntity.ok(ofertasPaginadas);
    }

    // Endpoint admin: PUT /api/productos/id/estado
    @PutMapping("/{id}/estado")
    public ResponseEntity<String> cambiarEstado(@PathVariable Long id, @RequestParam Boolean disponible) {

        Producto producto = productoService.obtenerPorId(id);

        producto.setDisponible(disponible);

        productoService.guardarProducto(producto);

        return ResponseEntity.ok("Estado actualizado correctamente");
    }

    // Endpoint Admin: POST /api/productos
    @PostMapping
    public ResponseEntity<String> crearProducto(@RequestBody Producto producto) {
        productoService.guardarProducto(producto);
        return ResponseEntity.ok("Producto guardado correctamente");
    }

    // Endpoint Admin: DELETE /api/productos/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> borrarProducto(@PathVariable Long id) {
        productoService.eliminarProducto(id);
        return ResponseEntity.noContent().build(); // Devuelve un 204 No Content (éxito al borrar)
    }

    // Endpoint Admin/Caja: GET /api/productos/codigo/{codigoBarra}
    @GetMapping("/codigo/{codigoBarra}")
    public ResponseEntity<Producto> buscarProductoPorCodigo(
            @PathVariable String codigoBarra,
            @RequestHeader("Authorization") String authHeader) {

        // 2. Limpiamos el código
        String codigoLimpio = codigoBarra.trim();

        try {
            // 3. Delegamos al servicio pasando el Token (para aislar por negocio)
            Producto producto = productoService.buscarPorCodigoBarraSaaS(codigoLimpio, authHeader);
            return ResponseEntity.ok(producto);

        } catch (RuntimeException e) {
            // Si no existe o es de otro local, devolvemos 404
            return ResponseEntity.notFound().build();
        }
    }
    //Modoficar Producto
    @PutMapping("/{id}")
    public void modificarProducto(@PathVariable Long id,
                               @RequestBody Producto productoModificado) {
        productoService.modificarProducto(id, productoModificado);
    }


    // Endpoint Admin: PUT /api/productos/{id}/stock
    @PutMapping("/{id}/stock")
    public ResponseEntity<Producto> ingresarStock(
            @PathVariable Long id,
            @RequestBody IngresoUnidadStockDTO ingreso,
            @RequestHeader("Authorization") String authHeader) {

        try {
            Producto productoActualizado = productoService.ingresarStock(
                    id,
                    ingreso.getCantidad(),
                    ingreso.getPrecioCompra(),
                    authHeader
            );
            return ResponseEntity.ok(productoActualizado);
        } catch (RuntimeException e) {
            // Manejo de errores más limpio
            return ResponseEntity.notFound().build();
        }
    }

    // Endpoint Admin: PUT /api/productos/categoria/{categoriaId}/oferta
    @PutMapping("/categoria/{categoriaId}/oferta")
    public ResponseEntity<String> aplicarOfertaPorCategoria(
            @PathVariable Long categoriaId,
            @RequestBody OfertaDTO ofertaDTO) {

        if (ofertaDTO.getPorcentaje() == null) {
            return ResponseEntity.badRequest().body("Las ofertas masivas solo aceptan porcentaje.");
        }

        productoService.aplicarOfertaMasiva(categoriaId, ofertaDTO.getPorcentaje());

        return ResponseEntity.ok("Oferta masiva aplicada correctamente");
    }


    // Endpoint Admin: PUT /api/productos/{id}/oferta
    @PutMapping("/{id}/oferta")
    public ResponseEntity<Producto> aplicarOferta(
            @PathVariable Long id,
            @RequestBody OfertaDTO ofertaDTO) {

        Producto producto = productoService.aplicarOferta(id, ofertaDTO.getPorcentaje(), ofertaDTO.getPrecioFijo());

        if (producto != null) {
            return ResponseEntity.ok(producto);
        }
        return ResponseEntity.notFound().build();
    }

    // Endpoint Admin: DELETE /api/productos/{id}/oferta
    @DeleteMapping("/{id}/oferta")
    public ResponseEntity<Producto> quitarOferta(@PathVariable Long id) {
        Producto producto = productoService.quitarOferta(id);

        if (producto != null) {
            return ResponseEntity.ok(producto);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/ofertas/cantidad")
    public long cantProductosOferta(){
        return productoService.contProductosOferta();
    }
    // Endpoint: GET /api/productos/estadisticas
    @GetMapping("/estadisticas")
    public ResponseEntity<ProductoStatsDTO> obtenerEstadisticasInventario() {
        return ResponseEntity.ok(productoService.obtenerEstadisticasInventario());
    }

    // GET: /api/productos/sugerencia/{codigoBarras}
    @GetMapping("/sugerencia/{codigoBarras}")
    public ResponseEntity<ProductoSugeridoDTO> obtenerSugerenciaDeRed(@PathVariable String codigoBarras) {
        try {
            ProductoSugeridoDTO sugerencia = productoService.buscarSugerenciaGlobal(codigoBarras);

            if (sugerencia != null) {
                return ResponseEntity.ok(sugerencia);
            } else {
                return ResponseEntity.noContent().build(); // Devuelve 204 si no hay sugerencias
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    // =========================================================================
    // ENDPOINT PÚBLICO E-COMMERCE (SaaS) - NO REQUIERE TOKEN
    // =========================================================================

    @GetMapping("/publico/ofertas")
    public ResponseEntity<?> obtenerOfertasPublicas(
            @RequestParam String tiendaSlug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        try {
            // 1. Traemos las entidades originales de la BD
            Page<Producto> ofertas = productoService.obtenerOfertasPorTiendaSlug(tiendaSlug, page, size);

            // 2. Las pasamos por el filtro del DTO
            Page<ProductoPublicoDTO> ofertasSeguras = ofertas.map(p -> new ProductoPublicoDTO(
                    p.getId(),
                    p.getNombre(),
                    p.getDescripcion(),
                    p.getPrecio(),
                    p.getEsOferta(),
                    p.getPrecioOferta(),
                    p.getImagenUrl(),
                    p.getCodigoBarra(),
                    p.getStock()
            ));

            // 3. Devolvemos la lista limpia y sin costos
            return ResponseEntity.ok(ofertasSeguras);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/publico")
    public ResponseEntity<?> obtenerCatalogoPublico(
            @RequestParam String tiendaSlug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) Long subcategoriaId) {
        try {
            Page<Producto> catalogo = productoService.obtenerCatalogoPorTiendaSlug(
                    tiendaSlug, page, size, busqueda, categoriaId, subcategoriaId);

            Page<ProductoPublicoDTO> catalogoSeguro = catalogo.map(p -> new ProductoPublicoDTO(
                    p.getId(),
                    p.getNombre(),
                    p.getDescripcion(),
                    p.getPrecio(),
                    p.getEsOferta(),
                    p.getPrecioOferta(),
                    p.getImagenUrl(),
                    p.getCodigoBarra(),
                    p.getStock()
            ));

            return ResponseEntity.ok(catalogoSeguro);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/publico/{id}")
    public ResponseEntity<?> obtenerProductoPublicoPorId(
            @PathVariable Long id,
            @RequestParam String tiendaSlug) {
        try {
            Producto p = productoService.obtenerProductoPublico(id, tiendaSlug);


            ProductoPublicoDTO dtoSeguro = new ProductoPublicoDTO(
                    p.getId(),
                    p.getNombre(),
                    p.getDescripcion(),
                    p.getPrecio(),
                    p.getEsOferta(),
                    p.getPrecioOferta(),
                    p.getImagenUrl(),
                    p.getCodigoBarra(),
                    p.getStock()
            );

            return ResponseEntity.ok(dtoSeguro);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }


    }
