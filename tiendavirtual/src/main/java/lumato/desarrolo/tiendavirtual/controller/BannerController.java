package lumato.desarrolo.tiendavirtual.controller;

import lumato.desarrolo.tiendavirtual.model.Banner;
import lumato.desarrolo.tiendavirtual.service.BannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/banner")
@CrossOrigin(origins = "*")
public class BannerController {

    @Autowired
    private BannerService bannerService;

    // --------------------------------------------------------
    // MODO E-COMMERCE PÚBLICO (SaaS)
    // --------------------------------------------------------
    @GetMapping("/publico")
    public ResponseEntity<?> obtenerBannerPublico(@RequestParam String tiendaSlug) {
        try {
            Banner banner = bannerService.obtenerBannerPorTiendaSlug(tiendaSlug);
            if (banner == null) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(banner);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // --------------------------------------------------------
    // MODO PANEL ADMIN (Requiere Token)
    // --------------------------------------------------------
    @GetMapping
    public ResponseEntity<?> obtenerBanner() {
        try {
            // Este asumo que usa el AuthService para buscar por el usuario logueado
            Banner banner = bannerService.obtenerBannerActivo();
            if (banner == null) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(banner);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al buscar el banner");
        }
    }

    @PutMapping
    public ResponseEntity<Banner> actualizarBanner(@RequestBody Banner banner) {
        return ResponseEntity.ok(bannerService.actualizarBanner(banner));
    }
}