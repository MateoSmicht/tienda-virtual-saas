package lumato.desarrolo.tiendavirtual.service;


import lumato.desarrolo.tiendavirtual.model.Pedido;
import org.springframework.scheduling.annotation.Async;

public interface EmailService {
    void enviarAvisoDeNuevoPedido(Pedido pedido);

    @Async
    void enviarEmailRecuperacion(String emailDestino, String token);
}