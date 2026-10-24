package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.Caja;
import lumato.desarrolo.tiendavirtual.model.MovimientoCaja;
import lumato.desarrolo.tiendavirtual.model.Pedido;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoCaja;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
import lumato.desarrolo.tiendavirtual.model.enums.MetodoPago;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimiento;
import lumato.desarrolo.tiendavirtual.repository.CajaRepository;
import lumato.desarrolo.tiendavirtual.repository.MovimientoCajaRepository;
import lumato.desarrolo.tiendavirtual.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CajaServiceImp implements CajaService {

    @Autowired
    private CajaRepository repository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Autowired
    private AuthService authService;

    @Override
    public Caja obtenerCajaActual(String authHeader) {
        Usuario cajero = authService.obtenerUsuarioDelToken(authHeader);
        Long negocioId = cajero.getNegocio().getId();

        return repository.findByEstadoCajaAndIdUsuarioAndNegocioId(EstadoCaja.ABIERTA, cajero.getId(), negocioId)
                .orElse(null);
    }

    @Override
    @Transactional
    public Caja abrirCaja(Double montoInicial, String authHeader) {
        Usuario cajero = authService.obtenerUsuarioDelToken(authHeader);
        Negocio negocioActual = cajero.getNegocio();

        if (obtenerCajaActual(authHeader) != null) {
            throw new IllegalStateException("Ya tenés un turno de caja abierto.");
        }

        Caja nuevaCaja = new Caja();
        nuevaCaja.setIdUsuario(cajero.getId());
        nuevaCaja.setMontoInicial(montoInicial);
        nuevaCaja.setEstadoCaja(EstadoCaja.ABIERTA);
        nuevaCaja.setFechaApertura(LocalDateTime.now());


        nuevaCaja.setNegocio(negocioActual);

        return repository.save(nuevaCaja);
    }

    @Override
    @Transactional
    public Caja cerrarCaja(Double montoCierreFisico, String authHeader) {
        Caja caja = obtenerCajaActual(authHeader);
        if (caja == null) {
            throw new RuntimeException("No tenés ninguna caja abierta para cerrar.");
        }

        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();


        List<Pedido> pedidosDelTurno = pedidoRepository.findByCajaIdAndNegocioId(caja.getId(), negocioId);

        List<Pedido> pedidosValidos = pedidosDelTurno.stream()
                .filter(p -> p.getEstado() != EstadoPedido.CANCELADO)
                .toList();

        Double ventasEfectivo = pedidosValidos.stream()
                .filter(p -> p.getMetodoPago().equals(MetodoPago.EFECTIVO))
                .mapToDouble(Pedido::getTotal)
                .sum();


        List<MovimientoCaja> movimientos = movimientoCajaRepository.findByCajaIdAndNegocioId(caja.getId(), negocioId);

        Double totalIngresosManuales = movimientos.stream()
                .filter(m -> m.getTipo() == TipoMovimiento.INGRESO && (m.getAnulado() == null || !m.getAnulado()))
                .mapToDouble(MovimientoCaja::getMonto)
                .sum();

        Double totalEgresosManuales = movimientos.stream()
                .filter(m -> m.getTipo() == TipoMovimiento.EGRESO && (m.getAnulado() == null || !m.getAnulado()))
                .mapToDouble(MovimientoCaja::getMonto)
                .sum();

        Double efectivoEsperado = caja.getMontoInicial() + ventasEfectivo + totalIngresosManuales - totalEgresosManuales;

        caja.setDiferencia(montoCierreFisico - efectivoEsperado);
        caja.setTotalEfectivo(ventasEfectivo);
        caja.setTotalIngresosExtra(totalIngresosManuales);
        caja.setTotalEgresosExtra(totalEgresosManuales);
        caja.setMontoCierre(montoCierreFisico);
        caja.setFechaCierre(LocalDateTime.now());
        caja.setEstadoCaja(EstadoCaja.CERRADA);

        return repository.save(caja);
    }

    @Override
    @Transactional
    public MovimientoCaja registrarMovimiento(MovimientoCaja movimiento, String authHeader) {
        Caja cajaActual = obtenerCajaActual(authHeader);
        if (cajaActual == null) {
            throw new RuntimeException("No tenés una caja abierta para registrar movimientos.");
        }

        Negocio negocioActual = authService.obtenerNegocioDelUsuarioActual();

        movimiento.setCaja(cajaActual);
        // Desnormalización de seguridad: El movimiento conoce de qué tienda es de forma directa
        movimiento.setNegocio(negocioActual);

        return movimientoCajaRepository.save(movimiento);
    }

    @Override
    public Page<Caja> obtenerHistorialCajasPaginado(Pageable pageable) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return repository.findByNegocioIdOrderByFechaAperturaDesc(negocioId, pageable);
    }

    @Override
    @Transactional
    public void anularMovimiento(Long id) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        MovimientoCaja movimiento = movimientoCajaRepository.findByIdAndNegocioId(id, negocioId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado."));

        if (movimiento.getCaja().getEstadoCaja() == EstadoCaja.CERRADA) {
            throw new IllegalStateException("No podés anular movimientos de cajas cerradas.");
        }

        movimiento.setAnulado(true);
        movimientoCajaRepository.save(movimiento);
    }

    @Override
    public List<MovimientoCaja> obtenerMovimientosPorCaja(Long cajaId) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        return movimientoCajaRepository.findByCajaIdAndNegocioId(cajaId, negocioId);
    }

    @Override
    public Page<Caja> obtenerHistorialConFiltros(Long cajeroId, LocalDateTime fechaInicio, LocalDateTime fechaFin, Pageable pageable) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        // Le pasamos el negocioId a la consulta con filtros dinámicos
        return repository.buscarCajasFiltrosMultiTenant(cajeroId, fechaInicio, fechaFin, negocioId, pageable);
    }
}