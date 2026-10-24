package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.repository.NegocioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/negocios")
@CrossOrigin(origins = "*")
public class NegocioController {

    @Autowired
    private NegocioRepository negocioRepository;

    @GetMapping("/publico/datos")
    public ResponseEntity<?> obtenerDatosPublicosTienda(@RequestParam String tiendaSlug) {
        return negocioRepository.findBySlug(tiendaSlug)
                .map(negocio -> {
                    if (negocio.getEcommerceHabilitado() == null || !negocio.getEcommerceHabilitado()) {
                        return ResponseEntity.badRequest().body(java.util.Map.of("error", "CATALOGO_INACTIVO"));
                    }

                    return ResponseEntity.ok(java.util.Map.of(
                            "nombre", negocio.getNombre(),
                            "cbu", negocio.getCbu() != null ? negocio.getCbu() : "",
                            "alias", negocio.getAlias() != null ? negocio.getAlias() : "",
                            "costoEnvio", negocio.getCostoEnvio() != null ? negocio.getCostoEnvio() : 0.0,
                            "costoServicio", negocio.getCostoServicio() != null ? negocio.getCostoServicio() : 0.0,
                            "whatsapp", negocio.getTelefonoWhatsapp() != null ? negocio.getTelefonoWhatsapp() : ""
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
