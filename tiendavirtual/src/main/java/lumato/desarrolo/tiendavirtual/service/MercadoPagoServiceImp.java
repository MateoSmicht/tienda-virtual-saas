package lumato.desarrolo.tiendavirtual.service;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.*;
import com.mercadopago.core.MPRequestOptions;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import lumato.desarrolo.tiendavirtual.model.MovimientoStock;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Pedido;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimientoStock;
import lumato.desarrolo.tiendavirtual.repository.MovimientoStockRepository;
import lumato.desarrolo.tiendavirtual.repository.NegocioRepository;
import lumato.desarrolo.tiendavirtual.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class MercadoPagoServiceImp implements MercadoPagoService {

    @Value("${mercado.pago.webhook.url}")
    private String webhookUrl;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ProductoService productoService;

    @Autowired
    private NegocioRepository negocioRepository;

    @Autowired
    private MovimientoStockRepository movimientoStockRepository;

    @Override
    public String crearLinkDePago(Pedido pedido) {
        try {
            // 1. Obtenemos el token del dueño del negocio
            Negocio negocio = pedido.getNegocio();
            String tokenDelLocal = negocio.getMpAccessToken();

            if (tokenDelLocal == null || tokenDelLocal.isEmpty()) {
                System.err.println("El negocio " + negocio.getNombre() + " no tiene configurado su Mercado Pago.");
                return null; // O lanzar una excepción personalizada
            }

            PreferenceClient client = new PreferenceClient();

            List<PreferenceItemRequest> items = new ArrayList<>();
            PreferenceItemRequest item = PreferenceItemRequest.builder()
                    .id("PEDIDO-" + pedido.getId())
                    .title("Compra en " + negocio.getNombre() + " - Pedido #" + pedido.getId())
                    .description("Artículos de carrito web")
                    .categoryId("home")
                    .quantity(1)
                    .unitPrice(new BigDecimal(pedido.getTotal().toString()))
                    .currencyId("ARS")
                    .build();
            items.add(item);

            List<PreferencePaymentTypeRequest> excludedPaymentTypes = new ArrayList<>();
            excludedPaymentTypes.add(PreferencePaymentTypeRequest.builder().id("ticket").build());
            excludedPaymentTypes.add(PreferencePaymentTypeRequest.builder().id("atm").build());

            PreferencePaymentMethodsRequest paymentMethods = PreferencePaymentMethodsRequest.builder()
                    .excludedPaymentTypes(excludedPaymentTypes)
                    .build();

            // EL TRUCO MULTI-TENANT: Le pasamos el negocioId en la URL del Webhook
            String urlNotificacion = webhookUrl + "/api/pagos/notificacion?negocioId=" + negocio.getId();

            OffsetDateTime ahora = OffsetDateTime.now();
            OffsetDateTime vencimiento = ahora.plusMinutes(15);
            PreferenceRequest request = PreferenceRequest.builder()
                    .items(items)
                    .paymentMethods(paymentMethods)
                    .notificationUrl(urlNotificacion) // <--- Acá va la URL con el parámetro
                    .externalReference(pedido.getId().toString())
                    .expires(true)
                    .expirationDateFrom(ahora)
                    .expirationDateTo(vencimiento)
                    .build();

            // 2. Usamos el token DEL LOCAL, no el global
            MPRequestOptions options = MPRequestOptions.builder()
                    .accessToken(tokenDelLocal)
                    .build();

            Preference preference = client.create(request, options);

            return preference.getInitPoint();

        } catch (MPApiException apiException) {
            System.out.println("❌ Error de la API de Mercado Pago:");
            return null;
        } catch (MPException e) {
            System.out.println("❌ Error interno de la librería: " + e.getMessage());
            return null;
        }
    }


    @Override
    public void procesarNotificacion(Long paymentId, Long negocioId) {
        try {
            // 1. Buscamos el negocio para saber con qué token verificar el pago
            Negocio negocio = negocioRepository.findById(negocioId)
                    .orElseThrow(() -> new RuntimeException("Negocio no encontrado en webhook"));

            String tokenDelLocal = negocio.getMpAccessToken();

            PaymentClient client = new PaymentClient();

            // 2. Le preguntamos a MP por el estado del pago usando el token de ese local
            MPRequestOptions options = MPRequestOptions.builder()
                    .accessToken(tokenDelLocal)
                    .build();

            Payment payment = client.get(paymentId, options);

            if ("approved".equals(payment.getStatus())) {
                Long idPedido = Long.parseLong(payment.getExternalReference());

                // 3. Blindaje de seguridad: Buscamos el pedido asegurando que sea de ESE negocio
                Pedido pedido = pedidoRepository.findByIdAndNegocioId(idPedido, negocioId)
                        .orElseThrow(() -> new RuntimeException("Pedido no encontrado o no pertenece al negocio"));

                if (pedido.getEstado() != EstadoPedido.PAGADO) {

                    pedido.setEstado(EstadoPedido.PAGADO);
                    System.out.println("📦 Descontando stock del pedido #" + idPedido);

                    pedido.getDetalles().forEach(detalle -> {
                        try {
                            productoService.descontarStock(
                                    detalle.getProducto().getId(),
                                    detalle.getCantidad()
                            );
                            MovimientoStock egresoWeb = new MovimientoStock();
                            egresoWeb.setFecha(LocalDateTime.now());
                            egresoWeb.setProducto(detalle.getProducto());
                            egresoWeb.setCantidad(-detalle.getCantidad()); // Negativo explícito
                            egresoWeb.setTipo(TipoMovimientoStock.VENTA);

                            // Si la compra fue web, el responsable es el propio cliente (o podés dejar un usuario del sistema)
                            egresoWeb.setUsuario(pedido.getUsuario());
                            egresoWeb.setNegocio(negocio);
                            egresoWeb.setDetalle("Venta online aprobada por pasarela. Pedido #" + idPedido);

                            movimientoStockRepository.save(egresoWeb);
                        } catch (Exception e) {
                            System.err.println("⚠️ Alerta de stock para " + detalle.getProducto().getNombre() + ": " + e.getMessage());
                        }
                    });

                    pedidoRepository.save(pedido);
                    System.out.println("✅ Base de Datos actualizada: Pedido #" + idPedido + " -> PAGADO");
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error al procesar webhook: " + e.getMessage());
        }
    }
}