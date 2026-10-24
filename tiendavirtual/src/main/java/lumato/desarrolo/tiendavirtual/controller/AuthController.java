package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.dto.AuthResponseDTO;
import lumato.desarrolo.tiendavirtual.dto.RecuperarPasswordDTO;
import lumato.desarrolo.tiendavirtual.dto.RequestLogin;
import lumato.desarrolo.tiendavirtual.dto.ResetPasswordDTO;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.service.AuthService;
import lumato.desarrolo.tiendavirtual.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService service;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody RequestLogin request) {
        // Si la contraseña está mal, el servicio lanza la excepción.
        Usuario user = service.login(request.getEmail(), request.getPassword());

        // Generamos el token
        String token = JwtUtil.generateToken(user);

        Long negocioId = user.getNegocio().getId();
        String nombreNegocio = user.getNegocio().getNombre();

        return ResponseEntity.ok(new AuthResponseDTO(token, user.getId(), user.getEmail(), negocioId, nombreNegocio));
    }

    @PostMapping("/recuperar-password")
    public ResponseEntity<?> solicitarRecuperacion(@RequestBody RecuperarPasswordDTO dto) {
        try {
            service.solicitarRecuperacionPassword(dto.getEmail());
            // Siempre devolvemos OK aunque el mail falle, para evitar ataques de enumeración (saber si un mail existe)
            return ResponseEntity.ok(Map.of("mensaje", "Si el correo existe, se envió un enlace."));
        } catch (RuntimeException e) {
            // Manejamos el error pero le devolvemos un mensaje seguro al cliente
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> confirmarNuevaPassword(@RequestBody ResetPasswordDTO dto) {
        try {
            service.resetearPassword(dto.getToken(), dto.getNuevaPassword());
            return ResponseEntity.ok(Map.of("mensaje", "Contraseña cambiada con éxito."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
