package lumato.desarrolo.tiendavirtual.model;



import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
import lumato.desarrolo.tiendavirtual.model.enums.MetodoPago;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaPedido;
    private Double total;

    @Enumerated(EnumType.STRING)
    private MetodoPago metodoPago; // EFECTIVO, TRANSFERENCIA, MERCADO_PAGO

    @Enumerated(EnumType.STRING)
    private EstadoPedido estado; // PENDIENTE, PAGADO, ENTREGADO, CANCELADO
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = true)
    private Usuario usuario;


    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetallePedido> detalles = new ArrayList<>();

    private Long cajaId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;

    @Column(columnDefinition = "TEXT")
    private String mensaje;

    // Antes de guardar por primera vez en MySQL, seteamos la fecha y el estado inicial
    @PrePersist
    public void prePersist() {
        this.fechaPedido = LocalDateTime.now();
        if (this.estado == null) {
            this.estado = EstadoPedido.PENDIENTE;
        }
    }

    public void addDetalle(DetallePedido detalle) {
        detalles.add(detalle);
        detalle.setPedido(this);
    }

}