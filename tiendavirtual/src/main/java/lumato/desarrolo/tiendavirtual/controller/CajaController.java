package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.model.Caja;
import lumato.desarrolo.tiendavirtual.model.MovimientoCaja;
import lumato.desarrolo.tiendavirtual.service.CajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/caja")
@CrossOrigin(origins = "*")
public class CajaController {

    @Autowired
    private CajaService cajaService; // ¡Única dependencia necesaria!

    @GetMapping("/actual")
    public ResponseEntity<Caja> obtenerCajaActual(@RequestHeader("Authorization") String authHeader) {
        Caja caja = cajaService.obtenerCajaActual(authHeader);
        if (caja != null) {
            return ResponseEntity.ok(caja);
        } else {
            return ResponseEntity.noContent().build();
        }
    }

    @PostMapping("/abrir")
    public ResponseEntity<?> abrirCaja(@RequestBody Map<String, Object> payload, @RequestHeader("Authorization") String authHeader) {
        try {
            Double montoInicial = Double.valueOf(payload.get("montoInicial").toString());
            Caja nuevaCaja = cajaService.abrirCaja(montoInicial, authHeader);
            return new ResponseEntity<>(nuevaCaja, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno al intentar abrir la caja.");
        }
    }

    @PutMapping("/cerrar")
    public ResponseEntity<?> cerrarCaja(@RequestParam Double monto, @RequestHeader("Authorization") String authHeader) {
        try {
            Caja cajaCerrada = cajaService.cerrarCaja(monto, authHeader);
            return ResponseEntity.ok(cajaCerrada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/movimiento")
    public ResponseEntity<?> registrarMovimiento(@RequestBody MovimientoCaja movimiento, @RequestHeader("Authorization") String authHeader) {
        try {
            MovimientoCaja nuevoMovimiento = cajaService.registrarMovimiento(movimiento, authHeader);
            return ResponseEntity.ok(nuevoMovimiento);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al guardar el movimiento.");
        }
    }

    @PutMapping("/movimiento/{id}/anular")
    public ResponseEntity<?> anularMovimiento(@PathVariable Long id) {
        try {
            cajaService.anularMovimiento(id);
            return ResponseEntity.ok(Map.of("mensaje", "Movimiento anulado correctamente."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al anular.");
        }
    }

    @GetMapping("/{id}/movimientos")
    public ResponseEntity<?> obtenerMovimientosPorCaja(@PathVariable Long id) {
        try {
            List<MovimientoCaja> movimientos = cajaService.obtenerMovimientosPorCaja(id);
            return ResponseEntity.ok(movimientos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al obtener los movimientos.");
        }
    }

    @GetMapping("/historial")
    public ResponseEntity<Page<Caja>> obtenerHistorial(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long cajeroId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {

        try {
            PageRequest pageable = PageRequest.of(page, size);
            Page<Caja> historial = cajaService.obtenerHistorialConFiltros(cajeroId, fechaInicio, fechaFin, pageable);
            return ResponseEntity.ok(historial);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}