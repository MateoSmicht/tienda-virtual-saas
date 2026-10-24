package lumato.desarrolo.tiendavirtual.exception;

import lombok.Data;

@Data
public class ErrorDetalle {
    private String mensaje;
    private int codigo;

    public ErrorDetalle(String mensaje, int codigo) {
        this.mensaje = mensaje;
        this.codigo = codigo;
    }

}