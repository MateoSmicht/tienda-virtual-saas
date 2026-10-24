package lumato.desarrolo.tiendavirtual.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoCaja;

import java.time.LocalDateTime;

@Entity
@Table(name = "caja")
@Data
public class Caja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long idUsuario;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaApertura;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCierre;
    private EstadoCaja estadoCaja;
    private Double montoInicial;
    private Double montoCierre;
    private Double diferencia;
    private Double totalMercadoPago;
    private Double totalTransferencia;
    private Double totalEfectivo;
    private Double totalIngresosExtra;
    private Double totalEgresosExtra;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;


}
