package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.dto.IngresoStockDTO;
import lumato.desarrolo.tiendavirtual.dto.ResumenBoletaDTO;
import lumato.desarrolo.tiendavirtual.model.MovimientoStock;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimientoStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface StockService {
    @Transactional
    void registrarIngresoMasivo(IngresoStockDTO dto, String authHeader);

    Page<MovimientoStock> obtenerHistorialGeneral(TipoMovimientoStock tipo, LocalDateTime inicio, LocalDateTime fin, Pageable pageable);

    List<MovimientoStock> obtenerBoletaPorMovimiento(Long idMovimiento);

    Page<MovimientoStock> obtenerHistorialGeneral(Pageable pageable);

    Page<ResumenBoletaDTO> obtenerBoletasAgrupadas(TipoMovimientoStock tipo, LocalDateTime inicio, LocalDateTime fin, Pageable pageable);
}
