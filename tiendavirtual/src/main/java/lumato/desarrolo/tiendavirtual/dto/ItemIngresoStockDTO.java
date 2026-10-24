package lumato.desarrolo.tiendavirtual.dto;

import lombok.Data;

@Data
public class ItemIngresoStockDTO {
    private String codigoBarras;
    private Integer cantidad;
    private Double ppp;
    private Double precio;

}