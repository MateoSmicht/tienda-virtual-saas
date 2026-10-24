package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.exception.StockInsuficienteException;
import lumato.desarrolo.tiendavirtual.model.Negocio; // 👈 Importante
import lumato.desarrolo.tiendavirtual.model.Producto;
import lumato.desarrolo.tiendavirtual.repository.ProductoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT) // Evita errores de stubs innecesarios
class ProductoServiceTestTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private AuthService authService; // 👈 Mock del servicio SaaS de autenticación

    @InjectMocks
    private ProductoServiceImp productoService;

    private Producto productoFalso;
    private Negocio negocioFalso;

    @BeforeEach
    void setUp() {
        // 1. Creamos el Negocio falso del SaaS
        negocioFalso = new Negocio();
        negocioFalso.setId(1L);
        negocioFalso.setNombre("Tienda Test");

        // 2. Simulamos que el usuario actual pertenece a este negocio
        when(authService.obtenerNegocioDelUsuarioActual()).thenReturn(negocioFalso);

        // 3. Preparamos el producto vinculado al negocio
        productoFalso = new Producto();
        productoFalso.setId(1L);
        productoFalso.setNombre("Silla Gamer");
        productoFalso.setControlarStock(true);
        productoFalso.setStock(10);
        productoFalso.setPrecio(1000.0);
        productoFalso.setNegocio(negocioFalso); // 👈 Vinculación SaaS
    }

    @Test
    void cuandoHayStock_descontarStock_RestaCorrectamente() {
        // Ajustá esto si tu repositorio usa findByIdAndNegocioId o findById
        // En lugar de (o además de) findById:
        when(productoRepository.findByIdAndNegocioId(1L, 1L)).thenReturn(Optional.of(productoFalso));
        when(productoRepository.save(any(Producto.class))).thenReturn(productoFalso);

        Producto resultado = productoService.descontarStock(1L, 3);

        assertEquals(7, resultado.getStock());
        verify(productoRepository, times(1)).save(productoFalso);
    }

    @Test
    void cuandoNoHayStock_descontarStock_LanzaExcepcion() {
        // En lugar de (o además de) findById:
        when(productoRepository.findByIdAndNegocioId(1L, 1L)).thenReturn(Optional.of(productoFalso));

        assertThrows(StockInsuficienteException.class, () -> {
            productoService.descontarStock(1L, 15);
        });

        verify(productoRepository, never()).save(any(Producto.class));
    }

    @Test
    void aplicarOferta_ConPrecioFijo_AplicaCorrectamente() {
        // En lugar de (o además de) findById:
        when(productoRepository.findByIdAndNegocioId(1L, 1L)).thenReturn(Optional.of(productoFalso));
        when(productoRepository.save(any(Producto.class))).thenReturn(productoFalso);

        Producto resultado = productoService.aplicarOferta(1L, null, 800.0);

        assertTrue(resultado.getEsOferta());
        assertEquals(800.0, resultado.getPrecioOferta());
        verify(productoRepository, times(1)).save(productoFalso);
    }

    @Test
    void aplicarOferta_ConPorcentaje_CalculaYRedondeaCorrectamente() {
        // En lugar de (o además de) findById:
        when(productoRepository.findByIdAndNegocioId(1L, 1L)).thenReturn(Optional.of(productoFalso));
        when(productoRepository.save(any(Producto.class))).thenReturn(productoFalso);

        Producto resultado = productoService.aplicarOferta(1L, 15.0, null);

        assertTrue(resultado.getEsOferta());
        assertEquals(850.0, resultado.getPrecioOferta());
    }

    @Test
    void aplicarOferta_SinPrecioBase_LanzaExcepcion() {
        productoFalso.setPrecio(null);
        // En lugar de (o además de) findById:
        when(productoRepository.findByIdAndNegocioId(1L, 1L)).thenReturn(Optional.of(productoFalso));

        RuntimeException excepcion = assertThrows(RuntimeException.class, () -> {
            productoService.aplicarOferta(1L, 10.0, null);
        });

        assertEquals("El producto no tiene un precio base para aplicar oferta.", excepcion.getMessage());
        verify(productoRepository, never()).save(any(Producto.class));
    }
}