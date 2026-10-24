package lumato.desarrolo.tiendavirtual.utils;

import com.auth0.jwt.exceptions.JWTVerificationException;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.model.enums.Rol;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private Usuario usuarioFalso;

    @BeforeEach
    void setUp() {
        Negocio negocioFalso = new Negocio();
        negocioFalso.setId(1L);
        // Preparamos un usuario de prueba antes de cada test
        usuarioFalso = new Usuario();
        usuarioFalso.setId(99L);
        usuarioFalso.setEmail("seguridad@lumato.com");
        usuarioFalso.setRol(Rol.ADMIN);
        usuarioFalso.setNegocio(negocioFalso);
    }

    // ==========================================
    // TEST 1: Generación del Token
    // ==========================================
    @Test
    void generateToken_DebeRetornarUnStringConFormatoJWT() {
        // Act
        String token = JwtUtil.generateToken(usuarioFalso);

        // Assert
        assertNotNull(token, "El token no debería ser nulo");
        assertFalse(token.isEmpty(), "El token no debería estar vacío");

        // Un JWT real siempre tiene 3 partes separadas por puntos (Header.Payload.Signature)
        String[] partesDelToken = token.split("\\.");
        assertEquals(3, partesDelToken.length, "El token debe tener exactamente 3 partes separadas por puntos");
    }

    // ==========================================
    // TEST 2: Extracción exitosa del ID
    // ==========================================
    @Test
    void getUserIdByToken_ConTokenValido_DebeRetornarElIdDelUsuario() {
        // Arrange: Generamos un token real con nuestro utilitario
        String tokenValido = JwtUtil.generateToken(usuarioFalso);

        // Act: Lo desciframos
        String userIdExtraido = JwtUtil.getUserIdByToken(tokenValido);

        // Assert: Verificamos que el ID extraído sea el '99' que le pusimos al principio
        assertEquals("99", userIdExtraido);
    }

    // ==========================================
    // TEST 3: Rechazo de Tokens Falsos (Seguridad)
    // ==========================================
    @Test
    void getUserIdByToken_ConTokenInvalidoOAdulterado_DebeLanzarExcepcion() {
        // Arrange: Armamos un token que parece un JWT pero firmado por otra persona
        String tokenFalso = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5fQ.firma_inventada_123";

        // Act & Assert: Verificamos que la librería de Auth0 salte y lance una excepción de verificación
        assertThrows(JWTVerificationException.class, () -> {
            JwtUtil.getUserIdByToken(tokenFalso);
        }, "Debería lanzar JWTVerificationException si el token está adulterado");
    }
}