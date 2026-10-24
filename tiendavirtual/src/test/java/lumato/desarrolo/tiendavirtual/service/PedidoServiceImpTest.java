package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.dto.ItemCarritoDTO;
import lumato.desarrolo.tiendavirtual.dto.PedidoRequestDTO;
import lumato.desarrolo.tiendavirtual.dto.PedidoResponseDTO;
import lumato.desarrolo.tiendavirtual.exception.StockInsuficienteException;
import lumato.desarrolo.tiendavirtual.model.*;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
import lumato.desarrolo.tiendavirtual.model.enums.MetodoPago;
import lumato.desarrolo.tiendavirtual.model.enums.Rol;
import lumato.desarrolo.tiendavirtual.repository.PedidoRepository;
import lumato.desarrolo.tiendavirtual.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT) // 👈 Evita errores por stubs no utilizados en el setUp
class PedidoServiceImpTest {

    @Mock private PedidoRepository pedidoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ProductoService productoService;
    @Mock private EmailService emailService;
    @Mock private MercadoPagoService mercadoPagoService;
    @Mock private AuthService autenticacionService;
    @Mock private CajaService cajaService;

    @InjectMocks
    private PedidoServiceImp pedidoService;

    private Usuario usuarioFalso;
    private Producto productoFalso;
    private PedidoRequestDTO requestFalso;
    private Negocio negocioFalso;

    @BeforeEach
    void setUp() {
        negocioFalso = new Negocio();
        negocioFalso.setId(1L);

        // Preparamos un usuario (Simulamos que es un cliente normal comprando desde su casa)
        usuarioFalso = new Usuario();
        usuarioFalso.setNegocio(negocioFalso);
        usuarioFalso.setId(1L);
        usuarioFalso.setNombre("Mateo");
        usuarioFalso.setEmail("mateo@test.com");
        usuarioFalso.setRol(Rol.CLIENTE);

        // Preparamos un producto
        productoFalso = new Producto();
        productoFalso.setNegocio(negocioFalso);
        productoFalso.setId(100L);
        productoFalso.setNombre("Teclado Mecánico");
        productoFalso.setPrecio(5000.0);
        productoFalso.setControlarStock(true);
        productoFalso.setStock(10);
        productoFalso.setEsOferta(false);

        // Preparamos el Carrito
        requestFalso = new PedidoRequestDTO();
        requestFalso.setUsuarioId(1L);
        requestFalso.setMetodoPago(MetodoPago.MERCADO_PAGO);

        ItemCarritoDTO item = new ItemCarritoDTO();
        item.setProductoId(100L);
        item.setCantidad(2);

        requestFalso.setItems(List.of(item));
    }

    @Test
    void procesarNuevaCompra_ConStockSuficiente_CalculaTotalYGeneraLink() {
        // ARRANGE
        when(autenticacionService.obtenerUsuarioDelToken(anyString())).thenReturn(usuarioFalso);
        when(productoService.obtenerPorId(100L)).thenReturn(productoFalso);

        Pedido pedidoGuardado = new Pedido();
        pedidoGuardado.setId(50L);
        pedidoGuardado.setNegocio(negocioFalso);
        pedidoGuardado.setEstado(EstadoPedido.PENDIENTE);
        pedidoGuardado.setMetodoPago(MetodoPago.MERCADO_PAGO);
        pedidoGuardado.setTotal(10000.0);
        when(pedidoRepository.save(any(Pedido.class))).thenReturn(pedidoGuardado);

        when(mercadoPagoService.crearLinkDePago(any(Pedido.class))).thenReturn("https://mercadopago.com/link-falso");

        // ACT
        PedidoResponseDTO response = pedidoService.procesarNuevaCompra(requestFalso, "Bearer token_falso");

        // ASSERT
        assertNotNull(response);
        assertEquals(10000.0, response.getTotal(), "El total debe ser 10000 (5000 * 2)");
        assertEquals("https://mercadopago.com/link-falso", response.getLinkDePago(), "Debe devolver el link de MP");

        verify(productoService, never()).descontarStock(anyLong(), anyInt());
        verify(emailService, times(1)).enviarAvisoDeNuevoPedido(any(Pedido.class));
    }

    @Test
    void procesarNuevaCompra_SinStockSuficiente_LanzaExcepcionYFrenaTodo() {
        // ARRANGE
        requestFalso.getItems().get(0).setCantidad(20);

        when(autenticacionService.obtenerUsuarioDelToken(anyString())).thenReturn(usuarioFalso);
        when(productoService.obtenerPorId(100L)).thenReturn(productoFalso);

        // ACT & ASSERT
        StockInsuficienteException ex = assertThrows(StockInsuficienteException.class, () -> {
            pedidoService.procesarNuevaCompra(requestFalso, "Bearer token_falso");
        });

        assertTrue(ex.getMessage().contains("No hay stock suficiente"));

        verify(pedidoRepository, never()).save(any(Pedido.class));
        verify(mercadoPagoService, never()).crearLinkDePago(any(Pedido.class));
    }
}