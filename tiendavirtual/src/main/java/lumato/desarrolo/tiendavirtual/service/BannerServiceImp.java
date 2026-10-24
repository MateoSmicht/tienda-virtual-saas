package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.Banner;
import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.repository.BannerRepository;
import lumato.desarrolo.tiendavirtual.repository.NegocioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BannerServiceImp implements BannerService {

    @Autowired
    private BannerRepository bannerRepository;

    @Autowired
    private AuthService authService;
    @Autowired
    private NegocioRepository negocioRepository;

    @Override
    public Banner obtenerBannerActivo() {
        Negocio negocioActual = authService.obtenerNegocioDelUsuarioActual();

        return bannerRepository.findByNegocioId(negocioActual.getId())
                .orElseGet(() -> {
                    Banner defaultBanner = new Banner();
                    defaultBanner.setEtiqueta("Oferta de Temporada");
                    defaultBanner.setTitulo("Elegancia en cada Gota.");
                    defaultBanner.setSubtitulo("Hasta 40% de descuento en artículos seleccionados.");
                    defaultBanner.setImagenUrl("https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000&auto=format&fit=crop");
                    defaultBanner.setProductoDestacado("Producto Estrella");
                    defaultBanner.setVariante("banner");
                    defaultBanner.setNegocio(negocioActual);

                    return bannerRepository.save(defaultBanner);
                });
    }

    @Override
    public Banner actualizarBanner(Banner datosNuevos) {
        Banner bannerActual = obtenerBannerActivo();

        bannerActual.setEtiqueta(datosNuevos.getEtiqueta());
        bannerActual.setTitulo(datosNuevos.getTitulo());
        bannerActual.setSubtitulo(datosNuevos.getSubtitulo());
        bannerActual.setImagenUrl(datosNuevos.getImagenUrl());
        bannerActual.setProductoDestacado(datosNuevos.getProductoDestacado());
        bannerActual.setVariante(datosNuevos.getVariante());

        return bannerRepository.save(bannerActual);
    }




    @Override
    public Banner obtenerBannerPorTiendaSlug(String slug) {
        // 1. Buscamos el negocio
        Negocio negocio = negocioRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("La tienda no existe."));

        // 2. Control del plan de suscripción
        if (negocio.getEcommerceHabilitado() == null || !negocio.getEcommerceHabilitado()) {
            throw new RuntimeException("CATALOGO_INACTIVO");
        }

        // 3. Traemos su banner (o null si no configuró ninguno todavía)
        return bannerRepository.findByNegocioId(negocio.getId()).orElse(null);
    }
}