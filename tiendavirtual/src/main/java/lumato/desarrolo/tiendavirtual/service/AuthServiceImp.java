package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.PasswordResetToken;
import lumato.desarrolo.tiendavirtual.model.Usuario;
import lumato.desarrolo.tiendavirtual.repository.PasswordResetTokenRepository;
import lumato.desarrolo.tiendavirtual.repository.UsuarioRepository;
import lumato.desarrolo.tiendavirtual.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImp implements AuthService {

    @Autowired
    private UsuarioRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private EmailService emailService;
    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Override
    public Usuario login(String email, String password) {
        // 1. Buscamos el usuario por email
        Optional<Usuario> userOpt = userRepository.findByEmail(email);

        // 2. Si existe, verificamos que la contraseña cruda coincida con el hash de la BD
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return userOpt.get();
        }

        // 3. Si falla, tiramos una excepción estándar de Spring Security
        throw new BadCredentialsException("Email o contraseña incorrectos");
    }

    @Override
    public Usuario obtenerUsuarioDelToken(String authHeader) {
        // 1. Verificamos que el header traiga el token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("No estás autorizado para hacer esto. Faltan credenciales.");
        }

        // 2. Limpiamos la palabra Bearer
        String token = authHeader.replace("Bearer ", "");

        // 3. Usamos tu JwtUtil exactamente como lo tenías en "mis-pedidos"
        Long userId = Long.parseLong(JwtUtil.getUserIdByToken(token));

        // 4. Buscamos al usuario en la base de datos
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("El usuario del token ya no existe en la base de datos"));
    }

    @Override
    public Negocio obtenerNegocioDelUsuarioActual() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof Usuario) {
            return ((Usuario) principal).getNegocio();
        }
        throw new RuntimeException("No se encontró un negocio asociado al usuario actual");
    }

    @Transactional
    @Override
    public void solicitarRecuperacionPassword(String email) {
        // 1. Buscamos al usuario
        Usuario usuario = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No existe una cuenta con ese correo electrónico."));

        // 2. Por seguridad, borramos cualquier token viejo que haya pedido antes y no usó
        passwordResetTokenRepository.deleteByUsuario(usuario);

        // 3. Generamos un código seguro y único
        String token = UUID.randomUUID().toString();

        // 4. Lo guardamos en la base de datos con 1 hora de validez
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsuario(usuario);
        resetToken.setFechaExpiracion(LocalDateTime.now().plusHours(1));
        passwordResetTokenRepository.save(resetToken);

        // 5. Mandamos el mail
        emailService.enviarEmailRecuperacion(usuario.getEmail(), token);
    }

    @Transactional
    @Override
    public void resetearPassword(String token, String nuevaPassword) {
        // 1. Buscamos el token en la BD
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("El enlace de recuperación es inválido."));

        // 2. Verificamos que no esté vencido
        if (resetToken.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken); // Lo borramos porque ya no sirve
            throw new RuntimeException("El enlace ha expirado. Por favor solicitá uno nuevo.");
        }

        // 3. Obtenemos el dueño del token y le cambiamos la clave
        Usuario usuario = resetToken.getUsuario();
        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        userRepository.save(usuario);

        // 4. Destruimos el token para que no se pueda volver a usar
        passwordResetTokenRepository.delete(resetToken);
    }


}