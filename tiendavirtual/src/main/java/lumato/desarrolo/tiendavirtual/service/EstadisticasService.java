package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.dto.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EstadisticasService {
    KpiDTO obtenerKpisGlobales();
    List<TopProductoDTO> obtenerTop5Productos(LocalDateTime inicio, LocalDateTime fin);
    ProductoStatDTO obtenerStatsProducto(Long productoId);
    List<PuntoGraficoDTO> obtenerDatosGrafico(LocalDateTime inicio, LocalDateTime fin);
    Optional<ProductoStatDTO> obtenerEstadisticasHistoricasDeProducto(Long id);
}
