package lumato.desarrolo.tiendavirtual.dto;

import lombok.Data;

@Data
public class DetallePedidoDTO {
    private Long productoId;
    private String nombreProducto;
    private String imagenUrl;
    private Integer cantidad;
    private Double precioUnitario;
}