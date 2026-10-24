package lumato.desarrolo.tiendavirtual.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lumato.desarrolo.tiendavirtual.dto.NotificacionPedidoDTO;
import lumato.desarrolo.tiendavirtual.dto.PedidoRequestDTO;
import lumato.desarrolo.tiendavirtual.dto.PedidoResponseDTO;
import lumato.desarrolo.tiendavirtual.service.PedidoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // Apagamos el JWT y los filtros
class PedidoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // Instanciamos el mapper a mano para evitar el error de dependencias insatisfechas
    private ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private PedidoService pedidoService;

    private PedidoRequestDTO requestFalso;
    private PedidoResponseDTO responseFalso;
    private NotificacionPedidoDTO notificacionFalsa;

    @BeforeEach
    void setUp() {
        // 1. Preparamos el Request (lo que mandaría React)
        requestFalso = new PedidoRequestDTO();

        // 2. Preparamos el Response (lo que el servicio devolvería)
        responseFalso = new PedidoResponseDTO();


        // 3. Preparamos una notificación de mentira para probar la campanita
        notificacionFalsa = new NotificacionPedidoDTO(1L, "Nuevo pedido de Admin monto total: $1500.0", "12/05 14:30");
    }


    // TEST PARA POST: /api/pedidos
    @Test
    void realizarCompra_ConDatosValidos_DebeRetornarStatus201_Y_ResponseDTO() throws Exception {

        // Arrange: Le decimos a Mockito qué hacer.
        // Usamos any() en el segundo parámetro para que acepte el String del Token
        when(pedidoService.procesarNuevaCompra(any(PedidoRequestDTO.class), any())).thenReturn(responseFalso);

        String requestJson = objectMapper.writeValueAsString(requestFalso);

        // Act & Assert
        mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", "Bearer token_falso_de_prueba") // <-- AGREGAMOS EL HEADER PARA SIMULAR REALIDAD
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());
    }


    // TEST PARA GET: /api/pedidos/notificaciones
    @Test
    void obtenerNotificaciones_DebeRetornarListaDeNotificaciones_Y_Status200() throws Exception {
        // Arrange: Simulamos que la base de datos devuelve nuestra notificación falsa
        when(pedidoService.obtenerUltimasNotificaciones()).thenReturn(List.of(notificacionFalsa));

        // Act & Assert
        mockMvc.perform(get("/api/pedidos/notificaciones")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                // Verificamos que el JSON tenga la estructura exacta que espera React
                .andExpect(jsonPath("$[0].pedidoId").value(1))
                .andExpect(jsonPath("$[0].mensaje").value("Nuevo pedido de Admin monto total: $1500.0"))
                .andExpect(jsonPath("$[0].fecha").value("12/05 14:30"));
    }
}