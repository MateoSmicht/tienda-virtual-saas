package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.exception.EmailDuplicadoException;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.repository.NegocioRepository; // 👈 Importamos el repositorio de negocios
import lumato.desarrolo.tiendavirtual.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT) // Evita fallos por stubs no utilizados en algunos tests
class UsuarioServiceImpTest {

    @Mock
    private UsuarioRepository repository;

    @Mock
    private NegocioRepository negocioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthService authService;

    @InjectMocks
    private UsuarioServiceImp usuarioService;

    private Usuario usuarioFalso;
    private Negocio negocioFalso;

    @BeforeEach
    void setUp() {
        negocioFalso = new Negocio();
        negocioFalso.setId(1L);
        negocioFalso.setSlug("smisanperfumeria");
        when(authService.obtenerNegocioDelUsuarioActual()).thenReturn(negocioFalso);

        usuarioFalso = new Usuario();
        usuarioFalso.setNegocio(negocioFalso);
        usuarioFalso.setId(1L);
        usuarioFalso.setNombre("Mateo");
        usuarioFalso.setEmail("mateo@lumato.com");
        usuarioFalso.setPassword("clave123");
    }

    // ==========================================
    // TESTS DE CREAR USUARIO
    // ==========================================
    @Test
    void addUser_ConEmailNuevo_DebeEncriptarPassword_Y_Guardar() {
        // 1. Configuramos el mock para que el repositorio encuentre la tienda mediante el slug
        Negocio negocioVperfumery = new Negocio();
        negocioVperfumery.setSlug("vperfumery");

        when(repository.findByEmail("mateo@lumato.com")).thenReturn(Optional.empty());
        when(negocioRepository.findBySlug("vperfumery")).thenReturn(Optional.of(negocioVperfumery)); // 👈 Corregido el mock
        when(passwordEncoder.encode("clave123")).thenReturn("clave_encriptada_$$$");

        // 2. Pasamos ambos argumentos al método actualizado
        usuarioService.addUser(usuarioFalso, "vperfumery");

        assertEquals("clave_encriptada_$$$", usuarioFalso.getPassword());
        assertEquals(negocioVperfumery, usuarioFalso.getNegocio()); // Verificamos que se haya asignado el negocio correcto
        verify(repository, times(1)).save(usuarioFalso);
    }

    @Test
    void addUser_ConEmailDuplicado_DebeLanzarExcepcion() {
        Usuario otroUsuario = new Usuario();
        otroUsuario.setEmail("mateo@lumato.com");
        when(repository.findByEmail("mateo@lumato.com")).thenReturn(Optional.of(otroUsuario));

        // Como la validación del email duplicado ocurre antes de buscar la tienda,
        // pasamos el slug y el método debe fallar inmediatamente por el email duplicado.
        assertThrows(EmailDuplicadoException.class, () -> {
            usuarioService.addUser(usuarioFalso, "vperfumery");
        });

        verify(repository, never()).save(any(Usuario.class));
    }

    // ==========================================
    // TESTS DE CAMBIAR CONTRASEÑA
    // ==========================================

    @Test
    void cambiarPassword_ConPasswordActualCorrecta_DebeGuardarNuevaClave() {
        usuarioFalso.setPassword("clave_vieja_hash");

        // Mockeamos ambas opciones (findById y findByIdAndNegocioId) para asegurar que el SaaS las encuentre
        when(repository.findById(1L)).thenReturn(Optional.of(usuarioFalso));
        when(repository.findByIdAndNegocioId(1L, 1L)).thenReturn(Optional.of(usuarioFalso));

        when(passwordEncoder.matches("clave_vieja_plana", "clave_vieja_hash")).thenReturn(true);
        when(passwordEncoder.encode("clave_nueva")).thenReturn("clave_nueva_hash");

        usuarioService.cambiarPassword(1L, "clave_vieja_plana", "clave_nueva");

        assertEquals("clave_nueva_hash", usuarioFalso.getPassword());
        verify(repository).save(usuarioFalso);
    }

    @Test
    void cambiarPassword_ConPasswordActualIncorrecta_DebeLanzarExcepcion() {
        usuarioFalso.setPassword("clave_vieja_hash");

        // Mockeamos ambas opciones para que el servicio encuentre al usuario
        when(repository.findById(1L)).thenReturn(Optional.of(usuarioFalso));
        when(repository.findByIdAndNegocioId(1L, 1L)).thenReturn(Optional.of(usuarioFalso));

        when(passwordEncoder.matches("clave_equivocada", "clave_vieja_hash")).thenReturn(false);

        RuntimeException excepcion = assertThrows(RuntimeException.class, () -> {
            usuarioService.cambiarPassword(1L, "clave_equivocada", "clave_nueva");
        });

        assertEquals("La contraseña actual es incorrecta", excepcion.getMessage());
        verify(repository, never()).save(any(Usuario.class));
    }
}