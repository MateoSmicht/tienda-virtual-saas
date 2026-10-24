package lumato.desarrolo.tiendavirtual.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lumato.desarrolo.tiendavirtual.exception.CodigoBarraDuplicadoException;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Producto;
import lumato.desarrolo.tiendavirtual.service.AuthService;
import lumato.desarrolo.tiendavirtual.service.ProductoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // Instanciamos a mano con soporte para LocalDateTime para evitar el error de beans
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private ProductoService productoService;

    @MockitoBean
    private AuthService authService;

    private Producto productoFalso;
    private Negocio negocioFalso;

    @BeforeEach
    void setUp() {
        negocioFalso = new Negocio();
        negocioFalso.setId(1L);
        negocioFalso.setNombre("Tienda Test");

        when(authService.obtenerNegocioDelUsuarioActual()).thenReturn(negocioFalso);

        productoFalso = new Producto();
        productoFalso.setId(1L);
        productoFalso.setNegocio(negocioFalso);
        productoFalso.setNombre("Monitor 24 pulgadas");
        productoFalso.setCodigoBarra("123456789");
        productoFalso.setPrecio(150000.0);
    }

    // ==========================================
    // TESTS PARA POST: /api/productos
    // ==========================================

    @Test
    void crearProducto_ConDatosValidos_DebeRetornarStatus200_Y_Mensaje() throws Exception {
        when(productoService.guardarProducto(any(Producto.class))).thenReturn(productoFalso);

        String productoJson = objectMapper.writeValueAsString(productoFalso);

        mockMvc.perform(post("/api/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productoJson))
                .andExpect(status().isOk())
                .andExpect(content().string("Producto guardado correctamente"));
    }

    @Test
    void crearProducto_ConCodigoDuplicado_DebeRetornarStatus409Conflict() throws Exception {
        when(productoService.guardarProducto(any(Producto.class)))
                .thenThrow(new CodigoBarraDuplicadoException("El código ya existe"));

        String productoJson = objectMapper.writeValueAsString(productoFalso);

        mockMvc.perform(post("/api/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productoJson))
                .andExpect(status().isConflict());
    }

    // ==========================================
    // TESTS PARA GET: /api/productos/{id}
    // ==========================================

    @Test
    void buscarProducto_PorIdExistente_DebeRetornarStatus200_Y_ElProducto() throws Exception {
        when(productoService.obtenerPorId(1L)).thenReturn(productoFalso);

        mockMvc.perform(get("/api/productos/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Monitor 24 pulgadas"))
                .andExpect(jsonPath("$.codigoBarra").value("123456789"));
    }
}