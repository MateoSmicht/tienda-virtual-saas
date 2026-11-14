package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.dto.CambiarPasswordDTO;
import lumato.desarrolo.tiendavirtual.dto.EditarPerfilDTO;
import lumato.desarrolo.tiendavirtual.dto.RegistroRequestDTO;
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

    @Autowired
    private AuthService authService;

    // =================================================================
    // ENDPOINTS DE ADMINISTRACIÓN Y LECTURA
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

    @PutMapping("/user/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Usuario usuarioActualizado) {
        service.updateUser(id, usuarioActualizado);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario actualizado con éxito"));
    }

    // =================================================================
    // 1. ENDPOINT PRIVADO (PANEL DE CONTROL)
    // Usado por PantallaClientes.jsx. Respeta el Rol enviado (ADMIN/CLIENTE).
    // =================================================================
    @PostMapping("/user")
    public ResponseEntity<?> crearUsuarioDesdePanel(@RequestBody RegistroRequestDTO request) {
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setNombre(request.getNombre());
        nuevoUsuario.setApellido(request.getApellido());
        nuevoUsuario.setEmail(request.getEmail());
        nuevoUsuario.setPassword(request.getPassword());
        nuevoUsuario.setTelefono(request.getTelefono());

        // Asignamos el rol que viene desde el <select> del frontend
        nuevoUsuario.setRol(request.getRol());

        service.addUser(nuevoUsuario, request.getTiendaSlug());

        return ResponseEntity.ok(Map.of("mensaje", "Usuario creado con éxito desde el panel"));
    }

    // =================================================================
    // 2. ENDPOINT PÚBLICO (STOREFRONT)
    // Usado por PantallaLoginCliente.jsx. Fuerza siempre el rol a CLIENTE.
    // =================================================================
    @PostMapping("/register")
    public ResponseEntity<?> registrarClientePublico(@RequestBody RegistroRequestDTO request) {
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setNombre(request.getNombre());
        nuevoUsuario.setApellido(request.getApellido());
        nuevoUsuario.setEmail(request.getEmail());
        nuevoUsuario.setPassword(request.getPassword());
        nuevoUsuario.setTelefono(request.getTelefono());

        // Usamos el método blindado de seguridad
        service.registrarNuevoClienteWeb(nuevoUsuario, request.getTiendaSlug());

        return ResponseEntity.ok(Map.of("mensaje", "Cliente registrado con éxito"));
    }
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
