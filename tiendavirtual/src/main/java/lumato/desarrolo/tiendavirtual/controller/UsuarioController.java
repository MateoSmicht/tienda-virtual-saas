package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.dto.CambiarPasswordDTO;
import lumato.desarrolo.tiendavirtual.dto.EditarPerfilDTO;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.model.enums.Rol;
import lumato.desarrolo.tiendavirtual.service.AuthService;
import lumato.desarrolo.tiendavirtual.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioService service;

    // INYECTAMOS NUESTRO CEREBRO DE SEGURIDAD
    @Autowired
    private AuthService authService;

    // =================================================================
    // ENDPOINTS DE ADMINISTRACIÓN (Debe protegerse en SecurityFilterChain para rol ADMIN)
    // =================================================================

    @GetMapping("/user/{id}")
    public Usuario getUser(@PathVariable Long id) {
        return service.getUser(id);
    }

    @GetMapping("/user")
    public List<Usuario> getAllUsers() {
        return service.getAllUsers();
    }

    @DeleteMapping("/user/{id}")
    public void removeUser(@PathVariable Long id) {
        service.removeUser(id);
    }

    @PostMapping("/register")
    public void register(@RequestBody Usuario user) {
        service.addUser(user);
    }

    @PutMapping("/user/{id}")
    public void updateUser(@PathVariable Long id, @RequestBody Usuario updateUser) {
        service.updateUser(id, updateUser);
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Usuario>> buscarClientes(@RequestParam String termino) {
        return ResponseEntity.ok(service.searchUser(termino));
    }

    @PutMapping("/user/{id}/rol")
    public ResponseEntity<?> modificarRol(@PathVariable Long id, @RequestParam Rol rol) {
        try {
            service.modificarRol(id, rol);
            return ResponseEntity.ok(Map.of("mensaje", "Rol actualizado correctamente a " + rol));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // =================================================================
    // ENDPOINTS DE PERFIL PERSONAL (Anti-IDOR usando AuthService)
    // =================================================================

    @GetMapping("/user/me")
    public ResponseEntity<?> obtenerMiPerfil(@RequestHeader("Authorization") String authHeader) {
        // Mirá qué limpio queda: el servicio hace todo el trabajo
        Usuario usuario = authService.obtenerUsuarioDelToken(authHeader);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/user/me")
    public ResponseEntity<?> actualizarMiPerfil(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody EditarPerfilDTO dto) {
        try {
            Usuario usuario = authService.obtenerUsuarioDelToken(authHeader);
            service.actualizarPerfil(usuario.getId(), dto);

            return ResponseEntity.ok(Map.of("mensaje", "Perfil actualizado correctamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/user/me/password")
    public ResponseEntity<?> cambiarMiPassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CambiarPasswordDTO dto) {
        try {
            Usuario usuario = authService.obtenerUsuarioDelToken(authHeader);
            service.cambiarPassword(usuario.getId(), dto.getPasswordActual(), dto.getPasswordNueva());

            return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada con éxito"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Token inválido o expirado"));
        }
    }
}