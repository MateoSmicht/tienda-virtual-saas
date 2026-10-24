package lumato.desarrolo.tiendavirtual.dto;


import lombok.Data;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
@Data
public class ActualizarEstadoDTO {
    private EstadoPedido nuevoEstado;
}