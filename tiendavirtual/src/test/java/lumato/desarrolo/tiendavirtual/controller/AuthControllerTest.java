package lumato.desarrolo.tiendavirtual.controller;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lumato.desarrolo.tiendavirtual.dto.RequestLogin;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.model.enums.Rol;
import lumato.desarrolo.tiendavirtual.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // Apagamos el filtro para poder testear el endpoint libremente
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // mapper instanciado a mano
    private ObjectMapper objectMapper = new ObjectMapper();

    // Mockeamos el servicio que valida las credenciales
    @MockitoBean
    private AuthService authService;
    private RequestLogin credencialesValidas;
    private Usuario usuarioFalso;

    @BeforeEach
    void setUp() {
        Negocio negocioFalso = new Negocio();
        negocioFalso.setId(1L);
        when(authService.obtenerNegocioDelUsuarioActual()).thenReturn(negocioFalso);
        // 1. Armamos lo que enviaría el usuario desde React
        credencialesValidas = new RequestLogin();
        credencialesValidas.setEmail("admin@lumato.com");
        credencialesValidas.setPassword("123456");

        // 2. Armamos el usuario que devolvería la base de datos si todo está OK
        usuarioFalso = new Usuario();
        usuarioFalso.setNegocio(negocioFalso);
        usuarioFalso.setId(1L);
        usuarioFalso.setEmail("admin@lumato.com");
        usuarioFalso.setNombre("Mateo");
        usuarioFalso.setPassword("contraseña-hasheada-ilegible");
            usuarioFalso.setRol(Rol.ADMIN);

    }


    // TEST 1: Login Exitoso
    @Test
    void login_ConCredencialesCorrectas_DebeRetornarStatus200_Y_Token() throws Exception {
        // Arrange: Cuando el controller llame al servicio con este mail y pass, devolvemos el usuario
        when(authService.login("admin@lumato.com", "123456")).thenReturn(usuarioFalso);

        String requestJson = objectMapper.writeValueAsString(credencialesValidas);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk()) // Esperamos un 200 OK
                .andExpect(jsonPath("$.email").value("admin@lumato.com"))
                .andExpect(jsonPath("$.usuarioId").value(1))
                .andExpect(jsonPath("$.token").exists()); // Verificamos que el JWT se haya generado y exista
    }


    // TEST 2: Login Fallido (Contraseña Incorrecta)
    @Test
    void login_ConCredencialesIncorrectas_DebeRetornarErrorClient() throws Exception {
        // Arrange: Simulamos que el usuario puso mal la clave y el servicio explota con una Excepción
        when(authService.login(anyString(), anyString()))
                .thenThrow(new RuntimeException("Credenciales incorrectas"));

        String requestJson = objectMapper.writeValueAsString(credencialesValidas);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                        .andExpect(status().isInternalServerError());
    }
}