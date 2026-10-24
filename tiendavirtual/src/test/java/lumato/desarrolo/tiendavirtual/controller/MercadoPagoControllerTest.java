package lumato.desarrolo.tiendavirtual.controller;

import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;
import lumato.desarrolo.tiendavirtual.service.MercadoPagoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // Apagamos la seguridad para simular el webhook
class MercadoPagoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private MercadoPagoService mercadoPagoService;

    // ==========================================
    // TEST 1: ID en URL y Negocio ID presente
    // ==========================================
    @Test
    void recibirNotificacion_ConIdEnParametrosUrl_Y_NegocioId_DebeLlamarAlServicio_Y_Retornar200() throws Exception {
        // Arrange: Preparamos el mock con los DOS parámetros (Payment ID y Negocio ID)
        doNothing().when(mercadoPagoService).procesarNotificacion(987654L, 1L);

        // Act & Assert: Simulamos la URL que creamos en tu MercadoPagoServiceImp
        mockMvc.perform(post("/api/pagos/notificacion?data.id=987654&negocioId=1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Verify: Comprobamos que el controller extrajo exitosamente ambos números
        verify(mercadoPagoService).procesarNotificacion(987654L, 1L);
    }

    // ==========================================
    // TEST 2: ID en Body y Negocio ID en URL
    // ==========================================
    @Test
    void recibirNotificacion_ConIdEnElBody_Y_NegocioId_DebeLlamarAlServicio_Y_Retornar200() throws Exception {
        // Arrange
        doNothing().when(mercadoPagoService).procesarNotificacion(555555L, 2L);

        // Armamos el JSON tramposo que manda Mercado Pago
        Map<String, Object> data = new HashMap<>();
        data.put("id", "555555");
        Map<String, Object> payload = new HashMap<>();
        payload.put("data", data);

        String jsonPayload = objectMapper.writeValueAsString(payload);

        // Act & Assert: Pasamos el JSON en el body y el negocioId en la URL
        mockMvc.perform(post("/api/pagos/notificacion?negocioId=2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk());

        // Verify
        verify(mercadoPagoService).procesarNotificacion(555555L, 2L);
    }

    // ==========================================
    // TEST 3: Seguridad Multi-Tenant (Falta el ID del negocio)
    // ==========================================
    @Test
    void recibirNotificacion_SinNegocioId_NoDebeLlamarAlServicio_Pero_Retornar200() throws Exception {
        // Act & Assert: Mandamos un pago real pero sin el ID del inquilino
        mockMvc.perform(post("/api/pagos/notificacion?data.id=111111")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk()); // Debe dar 200 para que MP no reintente colapsando el servidor

        // Verify: Aseguramos que el servicio NUNCA se llamó, evitando errores de null pointer en base de datos
        verify(mercadoPagoService, never()).procesarNotificacion(anyLong(), anyLong());
    }
}