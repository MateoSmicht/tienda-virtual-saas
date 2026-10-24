package lumato.desarrolo.tiendavirtual.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lumato.desarrolo.tiendavirtual.model.enums.TipoMovimiento;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_caja")
@Data
public class MovimientoCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TipoMovimiento tipo;
    private Double monto;
    private String motivo;

    private LocalDateTime fecha;
    //Vinculamos a una caja en estado "abierta"
    @ManyToOne
    @JoinColumn(name = "caja_id", nullable = false)
    private Caja caja;

    @Column(columnDefinition = "boolean default false")
    private Boolean anulado = false;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;
}