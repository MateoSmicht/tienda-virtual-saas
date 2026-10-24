package lumato.desarrolo.tiendavirtual.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificacionPedidoDTO {
    private Long pedidoId;
    private String mensaje;
    private String fecha;
}