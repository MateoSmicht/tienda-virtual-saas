package lumato.desarrolo.tiendavirtual.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PedidoResponseDTO {

    @JsonProperty("id") // Hace que React lo lea como "pedido.id"
    private Long idPedido;

    private String estado;
    private Double total;
    private String metodoPago;
    private LocalDateTime fecha;
    private String mensaje;
    private String linkDePago;
    private List<DetallePedidoDTO> items;
    private Long cajaId;

    public PedidoResponseDTO() {}
}