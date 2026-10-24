package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.service.MercadoPagoService;
import lumato.desarrolo.tiendavirtual.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class MercadoPagoController {

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private MercadoPagoService mercadoPagoService;

    @PostMapping("/notificacion")
    public ResponseEntity<Void> recibirNotificacion(
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestParam Map<String, String> allParams) {

        // 1. Headers para saltar el bloqueo de ngrok en entorno de desarrollo
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add("ngrok-skip-browser-warning", "true");

        try {
            System.out.println("📩 ¡LLEGÓ UNA NOTIFICACIÓN DE MERCADO PAGO!");
            System.out.println("Parámetros URL: " + allParams);

            String paymentId = null;
            Long negocioId = null;

            // 2. ATRAPAMOS EL ID DEL NEGOCIO (El corazón del SaaS)
            if (allParams.containsKey("negocioId")) {
                negocioId = Long.parseLong(allParams.get("negocioId"));
            }

            // 3. Intentamos sacar el ID del pago de todos los lugares posibles
            if (allParams.containsKey("id")) paymentId = allParams.get("id");
            else if (allParams.containsKey("data.id")) paymentId = allParams.get("data.id");
            else if (payload != null && payload.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                if (data != null && data.containsKey("id")) {
                    paymentId = data.get("id").toString();
                }
            }

            // 4. Validamos y procesamos
            if (paymentId != null && negocioId != null && !paymentId.equals("123456")) {
                System.out.println("🔎 PROCESANDO PAGO REAL ID: " + paymentId + " | NEGOCIO ID: " + negocioId);
                mercadoPagoService.procesarNotificacion(Long.parseLong(paymentId), negocioId);
            } else if (negocioId == null) {
                System.err.println("⚠️ Notificación ignorada: No se recibió el parámetro 'negocioId' en la URL.");
            }

        } catch (Exception e) {
            System.err.println("❌ Error en el Webhook: " + e.getMessage());
        }

        // Siempre devolvemos 200 OK rápido para que MP no reintente a lo loco
        return ResponseEntity.ok().headers(headers).build();
    }
}