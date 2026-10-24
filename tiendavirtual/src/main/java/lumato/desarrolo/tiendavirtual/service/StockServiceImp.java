package lumato.desarrolo.tiendavirtual.service;


import lumato.desarrolo.tiendavirtual.dto.IngresoStockDTO;
import lumato.desarrolo.tiendavirtual.dto.ItemIngresoStockDTO;
import lumato.desarrolo.tiendavirtual.dto.ResumenBoletaDTO;
import lumato.desarrolo.tiendavirtual.model.*;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimientoStock;
import lumato.desarrolo.tiendavirtual.repository.MovimientoStockRepository;
import lumato.desarrolo.tiendavirtual.repository.ProductoRepository;
import lumato.desarrolo.tiendavirtual.repository.ProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StockServiceImp implements StockService {

    @Autowired
    private MovimientoStockRepository movimientoStockRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private AuthService authService;


    @Override
    @Transactional
    public void registrarIngresoMasivo(IngresoStockDTO dto, String authHeader) {
        Usuario usuarioActual = authService.obtenerUsuarioDelToken(authHeader);
        Negocio negocioActual = usuarioActual.getNegocio();

        Proveedor proveedor = null;
        if (dto.getProveedorId() != null) {
            proveedor = proveedorRepository.findByIdAndNegocioId(dto.getProveedorId(), negocioActual.getId()).orElse(null);
        }

        LocalDateTime fechaLote = LocalDateTime.now();

        for (ItemIngresoStockDTO item : dto.getItems()) {
            Producto producto = productoRepository.findByCodigoBarraAndNegocioId(item.getCodigoBarras(), negocioActual.getId())
                    .orElseThrow(() -> new RuntimeException("El producto con código " + item.getCodigoBarras() + " no existe."));

            Integer stockActual = (producto.getStock() != null) ? producto.getStock() : 0;
            Double pppActual = (producto.getPpp() != null) ? producto.getPpp() : 0.0;
            Double nuevoPppIngresado = (item.getPpp() != null) ? item.getPpp() : pppActual;
            Integer cantidadIngresada = (item.getCantidad() != null) ? item.getCantidad() : 0;

            if (cantidadIngresada > 0) {
                Double valorInventarioActual = stockActual * pppActual;
                Double valorNuevoIngreso = cantidadIngresada * nuevoPppIngresado;
                Integer nuevoStock = stockActual + cantidadIngresada;
                Double nuevoPpp = (valorInventarioActual + valorNuevoIngreso) / nuevoStock;

                producto.setStock(nuevoStock);
                producto.setPpp(Math.round(nuevoPpp * 100.0) / 100.0);

                MovimientoStock movimiento = new MovimientoStock();
                movimiento.setFecha(fechaLote);
                movimiento.setProducto(producto);
                movimiento.setCantidad(cantidadIngresada);
                movimiento.setTipo(TipoMovimientoStock.COMPRA_PROVEEDOR);
                movimiento.setUsuario(usuarioActual);
                movimiento.setProveedor(proveedor);
                movimiento.setNegocio(negocioActual);
                movimiento.setDetalle("Ingreso por lote/remito. PPP ponderado a: $" + producto.getPpp());

                movimientoStockRepository.save(movimiento);
            } else {
                producto.setStock(stockActual);
                producto.setPpp(nuevoPppIngresado);
            }

            if (item.getPrecio() != null) {
                producto.setPrecio(item.getPrecio());
            }

            productoRepository.save(producto);
        }
    }
    @Override
    public Page<MovimientoStock> obtenerHistorialGeneral(TipoMovimientoStock tipo, LocalDateTime inicio, LocalDateTime fin, Pageable pageable) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return movimientoStockRepository.buscarHistorialConFiltros(negocioId, tipo, inicio, fin, pageable);
    }
    @Override
    public List<MovimientoStock> obtenerBoletaPorMovimiento(Long idMovimiento) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        // Buscamos un movimiento para saber su fecha exacta, y luego traemos todos los "hermanos" de esa fecha
        MovimientoStock mov = movimientoStockRepository.findById(idMovimiento).orElseThrow();
        return movimientoStockRepository.findByNegocioIdAndFecha(negocioId, mov.getFecha());
    }


    @Override
    public Page<MovimientoStock> obtenerHistorialGeneral(Pageable pageable) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return movimientoStockRepository.findByNegocioIdOrderByFechaDesc(negocioId, pageable);
    }
    @Override
    public Page<ResumenBoletaDTO> obtenerBoletasAgrupadas(TipoMovimientoStock tipo, LocalDateTime inicio, LocalDateTime fin, Pageable pageable) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return movimientoStockRepository.buscarBoletasAgrupadas(negocioId, tipo, inicio, fin, pageable);
    }
}