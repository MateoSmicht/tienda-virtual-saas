package lumato.desarrolo.tiendavirtual.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "negocios")
@Data
@NoArgsConstructor
public class Negocio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre; // Ej: "Ferretería San Martín"

    @Column(unique = true)
    private String slug; // Para la URL personalizada, ej: "ferreteria-san-martin"

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean ecommerceHabilitado = false;

    private String cuit;

    private String direccion;

    private String telefono;

    private String logoUrl;

    private String emailContacto;
    private Boolean activo = true; // Para poder suspender el servicio si no pagan la suscripción

    private LocalDateTime fechaRegistro = LocalDateTime.now();

    private String mpAccessToken;
    // --- Configuración de Pagos ---

    @Column(length = 22)
    private String cbu;

    private String alias;

    private Double costoEnvio;

    private Double costoServicio;

    private String telefonoWhatsapp; // Para que el cliente envíe el comprobante directo


}