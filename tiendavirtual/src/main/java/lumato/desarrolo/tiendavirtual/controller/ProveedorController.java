package lumato.desarrolo.tiendavirtual.controller;


import lumato.desarrolo.tiendavirtual.model.Proveedor;
import lumato.desarrolo.tiendavirtual.service.ProveedorService;
import lumato.desarrolo.tiendavirtual.service.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/proveedores")
@CrossOrigin(origins = "*")
public class ProveedorController {

    @Autowired
    private ProveedorService service;

    @Autowired
    private ProductoService productoService;

    @GetMapping
    public List<Proveedor> listar() { return service.listarTodos(); }

    @PostMapping
    public Proveedor crear(@RequestBody Proveedor proveedor) { return service.guardar(proveedor); }

    @PutMapping("/{id}")
    public Proveedor modificar(@PathVariable Long id, @RequestBody Proveedor p) { return service.modificar(id, p); }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) { service.eliminar(id); }

    // ENDPOINT DE AUMENTO MASIVO
    @PutMapping("/{id}/aumentar-precios")
    public ResponseEntity<?> aumentarPrecios(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        Double porcentaje = payload.get("porcentaje");
        productoService.aumentarPreciosPorProveedor(id, porcentaje);
        return ResponseEntity.ok(Map.of("mensaje", "Precios actualizados correctamente"));
    }
}
