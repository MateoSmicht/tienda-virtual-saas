package lumato.desarrolo.tiendavirtual.dto;
import lombok.Data;

@Data
public class ResetPasswordDTO {
    private String token;
    private String nuevaPassword;
}