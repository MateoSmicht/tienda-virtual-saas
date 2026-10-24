package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.dto.ProductoStatsDTO;
import lumato.desarrolo.tiendavirtual.dto.ProductoSugeridoDTO;
import lumato.desarrolo.tiendavirtual.exception.CodigoBarraDuplicadoException;
import lumato.desarrolo.tiendavirtual.exception.ProductoNoEncontradoException;
import lumato.desarrolo.tiendavirtual.exception.StockInsuficienteException;
import lumato.desarrolo.tiendavirtual.model.MovimientoStock;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Producto;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimientoStock;
import lumato.desarrolo.tiendavirtual.repository.MovimientoStockRepository;
import lumato.desarrolo.tiendavirtual.repository.NegocioRepository;
import lumato.desarrolo.tiendavirtual.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProductoServiceImp implements ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private MovimientoStockRepository movimientoStockRepository; // Asegurate de tenerlo inyectado
    @Autowired
    private NegocioRepository negocioRepository;

    @Override
    public Page<Producto> obtenerOfertas(int page, int size) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        Pageable pageable = PageRequest.of(page, size);

        return productoRepository.findByEsOfertaTrueAndDisponibleTrueAndNegocioId(negocioId, pageable);
    }

    @Override
    public Page<Producto> obtenerTodosAdmin(Pageable pageable) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return productoRepository.findAllByNegocioId(negocioId, pageable);
    }

    @Override
    public Page<Producto> obtenerCatalogoDisponible(Pageable pageable) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return productoRepository.findByDisponibleTrueAndNegocioId(negocioId, pageable);
    }

    @Override
    public Producto guardarProducto(Producto producto) {
        Negocio negocio = authService.obtenerNegocioDelUsuarioActual();
        Optional<Producto> existente = productoRepository.findByCodigoBarraAndNegocioId(producto.getCodigoBarra(), negocio.getId());
        if (existente.isPresent() && !existente.get().getId().equals(producto.getId())) {
            throw new CodigoBarraDuplicadoException("El código de barras " + producto.getCodigoBarra() + " ya está registrado en tu tienda.");
        }
        if (producto.getDisponible() == null) {
            producto.setDisponible(true);
        }

        producto.setNegocio(negocio);
        return productoRepository.save(producto);
    }

    @Override
    public void eliminarProducto(Long id) {

        Producto producto = obtenerPorId(id);
        productoRepository.delete(producto);
    }
    @Override
    public Producto buscarPorCodigoBarraSaaS(String codigoBarra, String authHeader) {
        // Sacamos el ID del negocio del token
        Long negocioId = authService.obtenerUsuarioDelToken(authHeader).getNegocio().getId();

        return productoRepository.findByCodigoBarraAndNegocioId(codigoBarra, negocioId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado."));
    }

    @Override
    public Producto obtenerPorId(Long id) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return (Producto) productoRepository.findByIdAndNegocioId(id, negocioId)
                .orElseThrow(() -> new ProductoNoEncontradoException("No se encontró el producto o no tienes permisos para verlo."));
    }

    @Override
    public void modificarProducto(Long id, Producto productoModificado) {
        Producto existente = obtenerPorId(id); // Valida propiedad y existencia
        productoModificado.setId(existente.getId());
        guardarProducto(productoModificado);
    }



    @Override
    @Transactional
    public Producto ingresarStock(Long id, Integer cantidad, Double precioCompra, String authHeader) {

        // 1. Identificamos quién es y de qué local es (Blindaje SaaS)
        Usuario usuarioActual = authService.obtenerUsuarioDelToken(authHeader);
        Long negocioId = usuarioActual.getNegocio().getId();

        // 2. Buscamos el producto asegurando que sea de su negocio
        Producto producto = productoRepository.findByIdAndNegocioId(id, negocioId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado o no pertenece a este negocio"));

        // 3. TU LÓGICA DE PPP (Intacta)
        Integer stockActual = (producto.getStock() != null) ? producto.getStock() : 0;
        Double pppActual = (producto.getPpp() != null) ? producto.getPpp() : 0.0;

        if (cantidad != null && cantidad > 0) {
            Double valorInventarioActual = stockActual * pppActual;
            Double valorNuevoIngreso = cantidad * precioCompra;

            Integer nuevoStock = stockActual + cantidad;
            Double nuevoPpp = (valorInventarioActual + valorNuevoIngreso) / nuevoStock;

            producto.setStock(nuevoStock);
            producto.setPpp(Math.round(nuevoPpp * 100.0) / 100.0);

            // 4. Registro inmutable en el Kardex
            MovimientoStock movimiento = new MovimientoStock();
            movimiento.setFecha(LocalDateTime.now());
            movimiento.setProducto(producto);
            movimiento.setCantidad(cantidad); // Positivo
            movimiento.setTipo(TipoMovimientoStock.AJUSTE_MANUAL_INGRESO);
            movimiento.setUsuario(usuarioActual);
            movimiento.setNegocio(usuarioActual.getNegocio());
            movimiento.setDetalle("Ingreso rápido con escáner. PPP ponderado a: $" + producto.getPpp());

            movimientoStockRepository.save(movimiento);
        }

        return productoRepository.save(producto);
    }

    @Override
    public Producto descontarStock(Long id, Integer cantidadComprada) {
        Producto producto = obtenerPorId(id);
        Boolean controla = (producto.getControlarStock() != null) ? producto.getControlarStock() : false;

        if (controla) {
            Integer stockActual = (producto.getStock() != null) ? producto.getStock() : 0;

            if (stockActual >= cantidadComprada) {
                producto.setStock(stockActual - cantidadComprada);
                return productoRepository.save(producto);
            } else {
                throw new StockInsuficienteException("Stock insuficiente para: " + producto.getNombre() + ". Stock actual: " + stockActual);
            }
        }
        return producto;
    }

    @Override
    public Producto aplicarOferta(Long id, Double porcentaje, Double precioFijo) {
        Producto producto = obtenerPorId(id);

        if (producto.getPrecio() != null) {
            if (precioFijo != null) {
                producto.setPrecioOferta(precioFijo);
            } else if (porcentaje != null) {
                Double descuento = producto.getPrecio() * (porcentaje / 100.0);
                producto.setPrecioOferta(Math.round((producto.getPrecio() - descuento) * 100.0) / 100.0);
            }
            producto.setEsOferta(true);
            return productoRepository.save(producto);
        }
        throw new RuntimeException("El producto no tiene un precio base para aplicar oferta.");
    }

    @Override
    public Producto quitarOferta(Long id) {
        Producto producto = obtenerPorId(id);
        producto.setEsOferta(false);
        producto.setPrecioOferta(null);
        return productoRepository.save(producto);
    }

    @Transactional
    @Override
    public void aplicarOfertaMasiva(Long categoriaId, Double porcentaje) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        // Buscamos las categorías filtrando también por el negocio correspondiente
        List<Producto> productos = productoRepository.buscarPorCategoriaMadreAndNegocioId(categoriaId, negocioId);

        for (Producto producto : productos) {
            aplicarOferta(producto.getId(), porcentaje, null);
        }
    }


    @Override
    public long contProductosOferta(){
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return productoRepository.countByPrecioOfertaGreaterThanAndNegocioId(0.0, negocioId);
    }

    @Override
    public ProductoStatsDTO obtenerEstadisticasInventario() {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        long total = productoRepository.countByNegocioId(negocioId);
        long activos = productoRepository.countByDisponibleTrueAndNegocioId(negocioId);
        long sinStock = productoRepository.countByStockLessThanEqualAndNegocioId(0, negocioId);
        Double valorInventario = productoRepository.calcularValorTotalInventarioPorNegocio(negocioId);

        if (valorInventario == null) valorInventario = 0.0;

        return new ProductoStatsDTO(total, activos, sinStock, valorInventario);
    }

    @Override
    public Page<Producto> obtenerProductosPaginadosYFiltrados(int page, int size, boolean todos, String busqueda, Long categoriaId, Long subcategoriaId, Integer stockMax) {
        Pageable pageable = PageRequest.of(page, size);
        if (busqueda != null && busqueda.trim().isEmpty()) busqueda = null;

        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();

        return productoRepository.buscarConFiltrosDinamicosMultiTenant(busqueda, categoriaId, subcategoriaId, stockMax, todos, negocioId, pageable);
    }

    @Transactional
    @Override
    public void aumentarPreciosPorProveedor(Long proveedorId, Double porcentaje) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        Double factor = 1 + (porcentaje / 100);

        productoRepository.aumentarPreciosPorProveedorAndNegocio(proveedorId, factor, negocioId);
    }

    @Override
    public ProductoSugeridoDTO buscarSugerenciaGlobal(String codigoBarras) {
        // Evitamos buscar si mandan un código vacío
        if (codigoBarras == null || codigoBarras.trim().isEmpty()) {
            return null;
        }

        Optional<Producto> productoGlobal = productoRepository.findFirstByCodigoBarra(codigoBarras);

        if (productoGlobal.isPresent()) {
            Producto p = productoGlobal.get();

            // Si el producto existe en otro local, extraemos solo lo visual/descriptivo
            ProductoSugeridoDTO sugerencia = new ProductoSugeridoDTO();
            sugerencia.setNombre(p.getNombre());
            sugerencia.setDescripcion(p.getDescripcion());
            sugerencia.setImagenUrl(p.getImagenUrl());

            return sugerencia;
        }

        return null; // Si nadie en toda la plataforma lo cargó, devolvemos null
    }


    @Override
    public Page<Producto> obtenerCatalogoPorTiendaSlug(String slug, int page, int size, String busqueda, Long categoriaId, Long subcategoriaId) {

        Negocio negocio = negocioRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("La tienda no existe."));

        if (negocio.getEcommerceHabilitado() == null || !negocio.getEcommerceHabilitado()) {
            throw new RuntimeException("CATALOGO_INACTIVO");
        }

        Pageable pageable = PageRequest.of(page, size);

        // Usamos nuestro nuevo método filtrado
        return productoRepository.findCatalogoPublicoFiltrado(
                negocio.getId(),
                categoriaId,
                subcategoriaId,
                busqueda,
                pageable
        );
    }

    @Override
    public Page<Producto> obtenerOfertasPorTiendaSlug(String slug, int page, int size) {

        // 1. Buscamos el negocio por la URL
        Negocio negocio = negocioRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("La tienda no existe."));

        // 2. REGLA DE NEGOCIO: Verificamos si tiene el e-commerce habilitado
        if (negocio.getEcommerceHabilitado() == null || !negocio.getEcommerceHabilitado()) {
            throw new RuntimeException("CATALOGO_INACTIVO");
        }

        // 3. Traemos solo las ofertas de ese local específico
        Pageable pageable = PageRequest.of(page, size);
        return productoRepository.findByNegocioIdAndDisponibleTrueAndEsOfertaTrue(negocio.getId(), pageable);
    }

    @Override
    public Producto obtenerProductoPublico(Long id, String slug) {
        // 1. Validamos la tienda
        Negocio negocio = negocioRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("La tienda no existe."));

        if (negocio.getEcommerceHabilitado() == null || !negocio.getEcommerceHabilitado()) {
            throw new RuntimeException("CATALOGO_INACTIVO");
        }

        // 2. Buscamos el producto
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // 3. REGLA DE SEGURIDAD SAAS: Verificamos que el producto sea de esta tienda y esté activo
        if (!producto.getNegocio().getId().equals(negocio.getId()) || !producto.getDisponible()) {
            throw new RuntimeException("El producto no está disponible");
        }

        return producto;
    }
}



