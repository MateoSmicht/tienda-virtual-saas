package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.dto.IngresoStockDTO;
import lumato.desarrolo.tiendavirtual.dto.ResumenBoletaDTO;
import lumato.desarrolo.tiendavirtual.model.MovimientoStock;
import lumato.desarrolo.tiendavirtual.model.Producto;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimientoStock;
import lumato.desarrolo.tiendavirtual.repository.ProductoRepository;
import lumato.desarrolo.tiendavirtual.service.AuthService;
import lumato.desarrolo.tiendavirtual.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
public class StockController {

    @Autowired
    private StockService stockService;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private AuthService authService;

    @GetMapping("/verificar/{codigoBarras}")
    public ResponseEntity<?> verificarCodigoBarras(@PathVariable String codigoBarras) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        Optional<Producto> producto = productoRepository.findByCodigoBarraAndNegocioId(codigoBarras, negocioId);

        if (producto.isPresent()) {
            return ResponseEntity.ok(producto.get()); // Retorna los datos básicos si ya existe
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("El producto no está registrado.");
    }


    @PostMapping("/ingreso")
    public ResponseEntity<?> registrarIngresoMasivo(@RequestBody IngresoStockDTO dto, @RequestHeader("Authorization") String authHeader) {
        try {
            stockService.registrarIngresoMasivo(dto, authHeader);
            return ResponseEntity.ok("Inventario actualizado y registrado en Kardex correctamente.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/general")
    public ResponseEntity<Page<MovimientoStock>> obtenerHistorialGeneral(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TipoMovimientoStock tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        LocalDateTime inicio = (fechaInicio != null) ? fechaInicio.atStartOfDay() : null;
        LocalDateTime fin = (fechaFin != null) ? fechaFin.atTime(23, 59, 59) : null;

        Page<MovimientoStock> historial = stockService.obtenerHistorialGeneral(tipo, inicio, fin, PageRequest.of(page, size));
        return ResponseEntity.ok(historial);
    }

    @GetMapping("/boleta/{id}")
    public ResponseEntity<List<MovimientoStock>> verDetalleBoleta(@PathVariable Long id) {
        return ResponseEntity.ok(stockService.obtenerBoletaPorMovimiento(id));
    }


    @GetMapping("/boletas")
    public ResponseEntity<Page<ResumenBoletaDTO>> obtenerBoletasAgrupadas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TipoMovimientoStock tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        LocalDateTime inicio = (fechaInicio != null) ? fechaInicio.atStartOfDay() : null;
        LocalDateTime fin = (fechaFin != null) ? fechaFin.atTime(23, 59, 59) : null;

        Page<ResumenBoletaDTO> boletas = stockService.obtenerBoletasAgrupadas(tipo, inicio, fin, PageRequest.of(page, size));
        return ResponseEntity.ok(boletas);
    }
}