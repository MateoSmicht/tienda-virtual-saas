package lumato.desarrolo.tiendavirtual.repository;

import lumato.desarrolo.tiendavirtual.model.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {
    Optional<Banner> findByNegocioId(Long negocioId);
}
