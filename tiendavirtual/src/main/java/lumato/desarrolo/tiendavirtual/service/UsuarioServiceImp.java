package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.dto.EditarPerfilDTO;
import lumato.desarrolo.tiendavirtual.exception.EmailDuplicadoException;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.model.enums.Rol;
import lumato.desarrolo.tiendavirtual.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioServiceImp implements UsuarioService {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Override
    public Usuario getUser(Long id) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return repository.findByIdAndNegocioId(id, negocioId).orElse(null);
    }

    @Override
    public List<Usuario> getAllUsers() {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return repository.findByNegocioId(negocioId);
    }

    @Override
    public void removeUser(Long id) {
        Usuario user = getUser(id);
        if (user != null) {
            repository.delete(user);
        } else {
            throw new RuntimeException("Usuario no encontrado o sin permisos para eliminarlo");
        }
    }

    @Override
    public void addUser(Usuario user) {
        if (repository.findByEmail(user.getEmail()).isPresent()) {
            throw new EmailDuplicadoException("El email " + user.getEmail() + " ya está registrado en otra cuenta.");
        }

        Negocio negocioActual = authService.obtenerNegocioDelUsuarioActual();
        user.setNegocio(negocioActual);

        user.setRol(Rol.CLIENTE);

        String hashPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashPassword);

        repository.save(user);
    }

    @Override
    public void updateUser(Long id, Usuario updateUser) {
        Usuario existente = getUser(id);
        if (existente == null) throw new RuntimeException("Usuario no encontrado");

        updateUser.setId(existente.getId());
        updateUser.setNegocio(existente.getNegocio());
        repository.save(updateUser);
    }

    @Override
    public List<Usuario> searchUser(String termino) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return repository.buscarPorTerminoMultiTenant(termino, negocioId);
    }

    @Override
    public void cambiarPassword(Long id, String passwordActual, String passwordNueva) {
        Usuario usuario = getUser(id);
        if (usuario == null) throw new RuntimeException("Usuario no encontrado");

        if (!passwordEncoder.matches(passwordActual, usuario.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        usuario.setPassword(passwordEncoder.encode(passwordNueva));
        repository.save(usuario);
    }

    @Override
    public void actualizarPerfil(Long id, EditarPerfilDTO dto) {
        Usuario usuario = getUser(id);
        if (usuario == null) throw new RuntimeException("Usuario no encontrado");

        if (!usuario.getEmail().equals(dto.getEmail())) {
            if (repository.findByEmail(dto.getEmail()).isPresent()) {
                throw new RuntimeException("El email " + dto.getEmail() + " ya está en uso por otra cuenta.");
            }
            usuario.setEmail(dto.getEmail());
        }

        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setTelefono(dto.getTelefono());

        repository.save(usuario);
    }

    @Override
    public void modificarRol(Long id, Rol rol) {
        Usuario user = getUser(id);
        if (user == null) throw new RuntimeException("Usuario no encontrado");

        user.setRol(rol);
        repository.save(user);
    }
}