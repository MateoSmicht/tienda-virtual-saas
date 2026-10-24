package lumato.desarrolo.tiendavirtual.dto;

import java.util.List;

public record CategoriaPublicaDTO(
        Long id,
        String nombre,
        String icono,
        List<SubcategoriaPublicaDTO> subcategorias
) {}