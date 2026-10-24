package lumato.desarrolo.tiendavirtual.dto;

import lombok.Data;

@Data
public class OfertaDTO {

    private Double porcentaje; // Ej: 10.0 para un 10%
    private Double precioFijo; // Ej: 1000.0 para clavarlo en ese precio

}