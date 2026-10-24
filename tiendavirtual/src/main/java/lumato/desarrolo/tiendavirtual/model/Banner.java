package lumato.desarrolo.tiendavirtual.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "configuracion_banner")
@Data
@NoArgsConstructor
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String etiqueta;
    private String titulo;
    private String subtitulo;
    private String imagenUrl;
    private String productoDestacado;
    private String variante;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;
}
