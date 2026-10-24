package lumato.desarrolo.tiendavirtual.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ProductoStatDTO {
    private String nombre;
    private Long totalVendido;
    private Double totalRecaudado;
    private LocalDateTime ultimaFecha;
}
