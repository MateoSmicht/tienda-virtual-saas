package lumato.desarrolo.tiendavirtual.controller;


import lumato.desarrolo.tiendavirtual.dto.*;
import lumato.desarrolo.tiendavirtual.model.Pedido;
import lumato.desarrolo.tiendavirtual.model.enums.EstadoPedido;
import lumato.desarrolo.tiendavirtual.service.PedidoService;
import lumato.desarrolo.tiendavirtual.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "*")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    // Endpoint Web: POST /api/pedido
    @PostMapping
    public ResponseEntity<PedidoResponseDTO> realizarCompra(
            @RequestBody PedidoRequestDTO request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Le pasamos el request y el token al servicio
            PedidoResponseDTO response = pedidoService.procesarNuevaCompra(request, authHeader);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            System.out.println("Error al procesar pedido: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<Page<Pedido>> verTodosLosPedidos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) EstadoPedido estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        // las convertimos a LocalDateTime (inicio del día y fin del día)
        LocalDateTime inicio = (fechaInicio != null) ? fechaInicio.atStartOfDay() : null;
        LocalDateTime fin = (fechaFin != null) ? fechaFin.atTime(23, 59, 59) : null;

        Page<Pedido> pedidos = pedidoService.obtenerPedidosPaginadosYFiltrados(page, size, estado, inicio, fin);

        return ResponseEntity.ok(pedidos);
    }

    // Endpoint Admin: GET /api/pedidos/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Pedido> verDetallePedido(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(pedidoService.obtenerPedidoPorId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Pedido> cambiarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {

        EstadoPedido nuevoEstado = EstadoPedido.valueOf(body.get("nuevoEstado"));
        Pedido pedidoActualizado = pedidoService.cambiarEstadoPedido(id, nuevoEstado, authHeader);
        return ResponseEntity.ok(pedidoActualizado);
    }

    // Endpoint Admin: DELETE /api/pedidos/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPedido(@PathVariable Long id) {
        pedidoService.eliminarPedido(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/recientes")
    public ResponseEntity<List<Pedido>> obtenerPedidosRecientes() {
        List<Pedido> ultimosPedidos = pedidoService.obtenerUltimos5Pedidos();
        return ResponseEntity.ok(ultimosPedidos);
    }

    @GetMapping("/notificaciones")
    public ResponseEntity<List<NotificacionPedidoDTO>> obtenerNotificaciones() {
        return ResponseEntity.ok(pedidoService.obtenerUltimasNotificaciones());
    }

    @GetMapping("/mis-pedidos")
    public ResponseEntity<?> obtenerMisPedidos(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = Long.parseLong(JwtUtil.getUserIdByToken(token));

            Page<PedidoResponseDTO> misPedidosPaginados = pedidoService.obtenerHistorialDTOPaginado(userId, page, size);
            return ResponseEntity.ok(misPedidosPaginados);

        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "No autorizado o token inválido"));
        }
    }

    // Endpoint para eliminar un producto del pedido
    @DeleteMapping("/{pedidoId}/items/{productoId}")
    public ResponseEntity<Pedido> eliminarItemDePedido(
            @PathVariable Long pedidoId,
            @PathVariable Long productoId) {

        Pedido pedidoActualizado = pedidoService.eliminarItemYRecalcular(pedidoId, productoId);
        return ResponseEntity.ok(pedidoActualizado);
    }

    // Endpoint para modificar la cantidad de un producto
    @PutMapping("/{pedidoId}/items/{productoId}")
    public ResponseEntity<Pedido> modificarCantidadItem(
            @PathVariable Long pedidoId,
            @PathVariable Long productoId,
            @RequestParam Integer cantidad) {

        Pedido pedidoActualizado = pedidoService.modificarCantidadYRecalcular(pedidoId, productoId, cantidad);
        return ResponseEntity.ok(pedidoActualizado);
    }

    // Endpoint para agregar item nuevo
    @PostMapping("/{pedidoId}/items")
    public ResponseEntity<Pedido> agregarItemAPedido(
            @PathVariable Long pedidoId,
            @RequestParam Long productoId,
            @RequestParam Integer cantidad) {

        Pedido pedidoActualizado = pedidoService.agregarItemYRecalcular(pedidoId, productoId, cantidad);
        return ResponseEntity.ok(pedidoActualizado);
    }
}