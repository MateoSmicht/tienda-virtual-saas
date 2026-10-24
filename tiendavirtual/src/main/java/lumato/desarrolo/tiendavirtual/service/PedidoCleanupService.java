package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.Pedido;
import lumato.desarrolo.tiendavirtual.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

import static lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido.CANCELADO;
import static lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido.PENDIENTE;
import static lumato.desarrolo.tiendavirtual.model.enums.MetodoPago.MERCADO_PAGO;

@Service
public class PedidoCleanupService {

    @Autowired
    private PedidoRepository pedidoRepository;

    // Se ejecuta automáticamente cada 5 minutos
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cancelarPedidosHuerfanos() {
        LocalDateTime limite = LocalDateTime.now().minusMinutes(16);

        // TAREA GLOBAL: Buscamos pedidos web abandonados (sin caja asignada)
        List<Pedido> pedidosAbandonados = pedidoRepository
                .findByEstadoAndMetodoPagoAndFechaPedidoBeforeAndCajaIdIsNull(PENDIENTE, MERCADO_PAGO, limite);

        for (Pedido pedido : pedidosAbandonados) {

            pedido.setEstado(CANCELADO);
            pedidoRepository.save(pedido);

            System.out.println("Sistema: Pedido WEB huérfano #" + pedido.getId() +
                    " (Negocio: " + pedido.getNegocio().getNombre() +
                    ") cancelado por timeout.");
        }
    }
}