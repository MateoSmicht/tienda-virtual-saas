package lumato.desarrolo.tiendavirtual.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lumato.desarrolo.tiendavirtual.repository.UsuarioRepository;
import lumato.desarrolo.tiendavirtual.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collections;

@Component
public class CustomAccessFilter implements Filter {

    // Inyectamos el repo para poder buscar el ROL del usuario
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        // 1. Si es una solicitud CORS de Pre-flight (OPTIONS), la dejamos pasar directo
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Intentamos leer el Token JWT
        try {
            String header = request.getHeader("Authorization");

            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                String userId = JwtUtil.getUserIdByToken(token);

                // Buscamos al usuario en la BD para saber su ROL real
                usuarioRepository.findById(Long.parseLong(userId)).ifPresent(usuario -> {

                    // ACÁ ESTÁ LA MAGIA: Le avisamos a Spring qué ROL tiene esta persona
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority(usuario.getRol().name());

                    // Armamos la credencial oficial con sus permisos
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            usuario,
                            null,
                            Collections.singletonList(authority)
                    );

                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            System.out.println("Aviso JWT: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}