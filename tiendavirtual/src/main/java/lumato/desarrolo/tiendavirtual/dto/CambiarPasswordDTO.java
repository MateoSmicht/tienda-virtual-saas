package lumato.desarrolo.tiendavirtual.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CambiarPasswordDTO {

    @NotBlank(message = "La contraseña actual es obligatoria")
    private String passwordActual;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    private String passwordNueva;
}
