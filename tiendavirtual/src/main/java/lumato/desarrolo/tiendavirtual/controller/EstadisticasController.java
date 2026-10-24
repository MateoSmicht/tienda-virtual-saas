package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.dto.*;
import lumato.desarrolo.tiendavirtual.service.EstadisticasServiceImp;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/estadisticas")
@CrossOrigin(origins = "*")
public class EstadisticasController {

    @Autowired
    private EstadisticasServiceImp estadisticasService;

    @GetMapping("/kpis")
    public ResponseEntity<KpiDTO> getKpis() {
        return ResponseEntity.ok(estadisticasService.obtenerKpisGlobales());
    }

    @GetMapping("/top-productos")
    public ResponseEntity<List<TopProductoDTO>> getTopProductos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(LocalTime.MAX);
        return ResponseEntity.ok(estadisticasService.obtenerTop5Productos(inicio, fin));
    }

    @GetMapping("/grafico")
    public ResponseEntity<List<PuntoGraficoDTO>> getGrafico(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(LocalTime.MAX);
        return ResponseEntity.ok(estadisticasService.obtenerDatosGrafico(inicio, fin));
    }


    @GetMapping("/producto/{id}")
    public ResponseEntity<ProductoStatDTO> obtenerStatsIndividuales(@PathVariable Long id) {
        return estadisticasService.obtenerEstadisticasHistoricasDeProducto(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

}