package lumato.desarrolo.tiendavirtual.service;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.core.MPRequestOptions;
import com.mercadopago.resources.payment.Payment;
import lumato.desarrolo.tiendavirtual.model.DetallePedido;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Pedido;
import lumato.desarrolo.tiendavirtual.model.Producto;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
import lumato.desarrolo.tiendavirtual.repository.NegocioRepository;
import lumato.desarrolo.tiendavirtual.repository.PedidoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MercadoPagoServiceImpTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private ProductoService productoService;

    @Mock
    private NegocioRepository negocioRepository; // <-- NUEVO MOCK NECESARIO

    @InjectMocks
    private MercadoPagoServiceImp mercadoPagoService;

    private Pedido pedidoFalso;
    private Producto productoFalso;
    private DetallePedido detalleFalso;
    private Negocio negocioFalso; // <-- NUEVO ACTOR

    @BeforeEach
    void setUp() {
        // 1. Armamos el Negocio falso con su Token
        negocioFalso = new Negocio();
        negocioFalso.setId(2L);
        negocioFalso.setNombre("Supermercado de Prueba");
        negocioFalso.setMpAccessToken("TEST-TOKEN-MERCADOPAGO-123");

        // 2. Armamos el escenario del carrito
        productoFalso = new Producto();
        productoFalso.setId(100L);
        productoFalso.setNombre("Perfume de prueba");

        detalleFalso = new DetallePedido();
        detalleFalso.setProducto(productoFalso);
        detalleFalso.setCantidad(2);

        // 3. Armamos el pedido y le inyectamos el negocio
        pedidoFalso = new Pedido();
        pedidoFalso.setId(1L);
        pedidoFalso.setEstado(EstadoPedido.PENDIENTE); // Aún no se pagó
        pedidoFalso.setDetalles(List.of(detalleFalso));
        pedidoFalso.setNegocio(negocioFalso);
    }

    // ==========================================
    // TEST 1: Pago Aprobado Descuenta Stock (Multi-Tenant)
    // ==========================================
    @Test
    void procesarNotificacion_ConPagoAprobado_DebeCambiarEstadoYDescontarStock() throws Exception {
        // 1. Arrange
        // Simulamos que el sistema encuentra el negocio para sacar el token
        when(negocioRepository.findById(2L)).thenReturn(Optional.of(negocioFalso));
        // Simulamos la búsqueda segura blindada por negocioId
        when(pedidoRepository.findByIdAndNegocioId(1L, 2L)).thenReturn(Optional.of(pedidoFalso));

        Payment mockPayment = mock(Payment.class);
        when(mockPayment.getStatus()).thenReturn("approved");
        when(mockPayment.getExternalReference()).thenReturn("1"); // ID del pedido

        try (MockedConstruction<PaymentClient> mockedClient = mockConstruction(PaymentClient.class,
                (mock, context) -> {
                    when(mock.get(anyLong(), any(MPRequestOptions.class))).thenReturn(mockPayment);
                })) {

            // 2. Act: Le pasamos el ID del pago y el ID del negocio (2L)
            mercadoPagoService.procesarNotificacion(123456789L, 2L);

            // 3. Assert
            assertEquals(EstadoPedido.PAGADO, pedidoFalso.getEstado());
            verify(productoService, times(1)).descontarStock(100L, 2);
            verify(pedidoRepository, times(1)).save(pedidoFalso);
        }
    }

    // ==========================================
    // TEST 2: Pago Ya Procesado (Evitar doble descuento)
    // ==========================================
    @Test
    void procesarNotificacion_ConPedidoYaPagado_NoDebeDescontarStockDeNuevo() throws Exception {
        // 1. Arrange: Cambiamos el estado a PAGADO desde el principio
        pedidoFalso.setEstado(EstadoPedido.PAGADO);

        when(negocioRepository.findById(2L)).thenReturn(Optional.of(negocioFalso));
        when(pedidoRepository.findByIdAndNegocioId(1L, 2L)).thenReturn(Optional.of(pedidoFalso));

        Payment mockPayment = mock(Payment.class);
        when(mockPayment.getStatus()).thenReturn("approved");
        when(mockPayment.getExternalReference()).thenReturn("1");

        try (MockedConstruction<PaymentClient> mockedClient = mockConstruction(PaymentClient.class,
                (mock, context) -> {
                    when(mock.get(anyLong(), any(MPRequestOptions.class))).thenReturn(mockPayment);
                })) {

            // 2. Act
            mercadoPagoService.procesarNotificacion(123456789L, 2L);

            // 3. Assert: Verificamos que el sistema NO descontó nada ni hizo un UPDATE innecesario
            verify(productoService, never()).descontarStock(anyLong(), anyInt());
            verify(pedidoRepository, never()).save(any(Pedido.class));
        }
    }
}