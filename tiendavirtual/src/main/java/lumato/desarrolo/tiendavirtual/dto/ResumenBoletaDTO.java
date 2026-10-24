package lumato.desarrolo.tiendavirtual.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimientoStock;
import java.time.LocalDateTime;
@Data
@AllArgsConstructor
public class ResumenBoletaDTO {
    private Long idReferencia;
    private LocalDateTime fecha;
    private TipoMovimientoStock tipo;
    private String usuario;
    private String proveedor;
    private Long cantidadProductos; // Cuántos artículos distintos hay
    private Long totalUnidades;     // La suma de todas las cantidades

}