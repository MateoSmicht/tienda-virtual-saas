package lumato.desarrolo.tiendavirtual.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreType;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lumato.desarrolo.tiendavirtual.model.enums.Rol;

import static lumato.desarrolo.tiendavirtual.model.enums.Rol.CLIENTE;

@Entity
@Table(name = "usuarios")
@Data
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message = "el nombre no puede estar vacío")
    private String nombre;

    @NotBlank(message = "el apellido no puede estar vacío")
    private String apellido;

    private String telefono;
    @Column(unique = true, nullable = false)
    @Email(message = "El formato del email no es válido")
    @NotBlank(message = "El email no puede estar vacío")

    private String email;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @NotBlank(message = "La password no puede estar vacío")
    @Column(length = 255, nullable = false)
    private String password;
    @JsonIgnore
    private Rol rol;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;


}