package lumato.desarrolo.tiendavirtual.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopProductoDTO {
    private Long id;
    private String nombre;
    private Long cantidad;
    private Double recaudado;
}