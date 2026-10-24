package lumato.desarrolo.tiendavirtual.dto;

import lombok.Data;

@Data
public class EditarPerfilDTO {
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
}