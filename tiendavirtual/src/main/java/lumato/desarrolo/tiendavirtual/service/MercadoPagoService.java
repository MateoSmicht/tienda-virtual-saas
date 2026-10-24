package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.Pedido;

public interface MercadoPagoService {
    String crearLinkDePago(Pedido pedido);
    void procesarNotificacion(Long paymentId, Long negocioId);
}