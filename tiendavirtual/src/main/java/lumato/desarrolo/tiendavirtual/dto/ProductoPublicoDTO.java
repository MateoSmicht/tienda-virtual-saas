package lumato.desarrolo.tiendavirtual.dto;

public record ProductoPublicoDTO(
        Long id,
        String nombre,
        String descripcion,
        Double precio,
        Boolean esOferta,
        Double precioOferta,
        String imagenUrl,
        String codigoBarra,
        Integer stock
) {}