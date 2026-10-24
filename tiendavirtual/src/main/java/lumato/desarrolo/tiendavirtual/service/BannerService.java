package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.Banner;

public interface BannerService {
    Banner obtenerBannerActivo();
    Banner actualizarBanner(Banner datosNuevos);
    Banner obtenerBannerPorTiendaSlug(String slug);
}
