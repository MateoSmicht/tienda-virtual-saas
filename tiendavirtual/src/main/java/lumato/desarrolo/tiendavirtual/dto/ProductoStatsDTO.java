package lumato.desarrolo.tiendavirtual.dto;

import lombok.Data;

@Data
public class ProductoStatsDTO {
    private long total;
    private long activos;
    private long sinStock;
    private double valorInventario;


    public ProductoStatsDTO(long total, long activos, long sinStock, double valorInventario) {
        this.total = total;
        this.activos = activos;
        this.sinStock = sinStock;
        this.valorInventario = valorInventario;
    }

}