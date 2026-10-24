package lumato.desarrolo.tiendavirtual.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponseDTO {
    private String token;
    private Long usuarioId;
    private String email;
    private Long negocioId;
    private String nombreNegocio;
}