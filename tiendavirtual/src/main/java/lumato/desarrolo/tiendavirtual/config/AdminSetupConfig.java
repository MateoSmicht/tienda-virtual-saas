package lumato.desarrolo.tiendavirtual.config;

import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.model.enums.Rol;
import lumato.desarrolo.tiendavirtual.repository.NegocioRepository;
import lumato.desarrolo.tiendavirtual.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AdminSetupConfig implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private NegocioRepository negocioRepository; // Necesitamos el repositorio del negocio

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        String emailAdmin = "admin@lumato.com";
        String emailNegocio = "contacto@lumato.com";

        Optional<Negocio> negocioExistente = negocioRepository.findByEmailContacto(emailNegocio);
        Negocio negocioBase;

        if (negocioExistente.isEmpty()) {
            negocioBase = new Negocio();
            negocioBase.setNombre("Lumato - Local Principal");
            negocioBase.setEmailContacto(emailNegocio);
            // Podrías setear un token de MP falso acá para pruebas:
            // negocioBase.setMpAccessToken("TEST-TOKEN-MOCK");

            negocioBase = negocioRepository.save(negocioBase);
            System.out.println("🏢 Negocio Base creado exitosamente.");
        } else {
            negocioBase = negocioExistente.get();
        }

        // 2. LA GALLINA: Creamos al Súper Administrador y lo atamos al Negocio
        Optional<Usuario> adminExistente = usuarioRepository.findByEmail(emailAdmin);

        if (adminExistente.isEmpty()) {
            Usuario admin = new Usuario();
            admin.setNombre("Super");
            admin.setApellido("Admin");
            admin.setEmail(emailAdmin);
            admin.setPassword(passwordEncoder.encode("admin1234"));
            admin.setRol(Rol.ADMIN);

            admin.setNegocio(negocioBase);

            usuarioRepository.save(admin);
            System.out.println("✅ Cuenta de Super Administrador creada y vinculada al negocio exitosamente.");
        } else {
            System.out.println("⚡ La base de datos ya está inicializada. Omitiendo creación.");
        }
    }
}