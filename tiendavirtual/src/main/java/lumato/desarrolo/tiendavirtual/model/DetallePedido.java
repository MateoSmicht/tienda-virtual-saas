package lumato.desarrolo.tiendavirtual.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "detalle_pedidos")
@Data
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer cantidad;

    private Double precioUnitario;

    // Relación con el producto físico
    @ManyToOne
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    // Relación con la cabecera del pedido
    @ManyToOne
    @JoinColumn(name = "pedido_id", nullable = false)
    @JsonIgnore // Esto evita bucles infinitos cuando Spring convierte los datos a JSON
    private Pedido pedido;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "negocio_id", nullable = false)

    private Negocio negocio;

    public DetallePedido() {}

}