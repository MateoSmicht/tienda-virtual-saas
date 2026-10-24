package lumato.desarrolo.tiendavirtual.dto;


import lombok.Data;

import java.util.List;
@Data
public class IngresoStockDTO {
    private Long proveedorId; // Puede venir nulo o vacío
    private List<ItemIngresoStockDTO> items;
}
