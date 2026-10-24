package lumato.desarrolo.tiendavirtual.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimientoStock;
import java.time.LocalDateTime;
@Data
@Entity
@Table(name = "movimiento_stock", indexes = {
        @Index(name = "idx_mov_stock_negocio_producto", columnList = "negocio_id, producto_id")
})
public class MovimientoStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad; // Valores positivos para ingresos, negativos para egresos

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoMovimientoStock tipo;

    private String detalle; // Notas operativas (Ej: "Remito Nro: 0001-00024412")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario; // El empleado responsable del movimiento

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor; // Opcional (solo aplica si es COMPRA_PROVEEDOR)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;



}