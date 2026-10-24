package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import org.springframework.transaction.annotation.Transactional;

public interface AuthService {
    Usuario login(String email, String password);

    Usuario obtenerUsuarioDelToken(String authHeader);

    Negocio obtenerNegocioDelUsuarioActual();

    @Transactional
    void solicitarRecuperacionPassword(String email);

    @Transactional
    void resetearPassword(String token, String nuevaPassword);
}
