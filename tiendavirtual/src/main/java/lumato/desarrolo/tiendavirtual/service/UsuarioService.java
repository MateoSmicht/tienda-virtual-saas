package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.dto.EditarPerfilDTO;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.model.enums.Rol;

import java.util.List;

public interface UsuarioService {

    Usuario getUser(Long id);
    List<Usuario> getAllUsers();
    void removeUser(Long id);
    void addUser(Usuario user);
    void updateUser(Long id, Usuario updateUser);
    List<Usuario> searchUser(String termino);
    void cambiarPassword(Long id, String passwordActual, String passwordNueva);
    void actualizarPerfil(Long id, EditarPerfilDTO dto);
    void modificarRol(Long id, Rol rol);
}
