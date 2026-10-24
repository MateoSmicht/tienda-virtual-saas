package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.Caja;
import lumato.desarrolo.tiendavirtual.model.MovimientoCaja;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface CajaService {
    Caja abrirCaja(Double montoInicial, String authHeader);
    Caja cerrarCaja(Double montoCierreFisico, String authHeader);
    Caja obtenerCajaActual(String authHeader);

    MovimientoCaja registrarMovimiento(MovimientoCaja movimiento, String authHeader);
    void anularMovimiento(Long id);
    List<MovimientoCaja> obtenerMovimientosPorCaja(Long cajaId);
    Page<Caja> obtenerHistorialConFiltros(Long cajeroId, LocalDateTime fechaInicio, LocalDateTime fechaFin, Pageable pageable);
    Page<Caja> obtenerHistorialCajasPaginado(Pageable pageable);

}
