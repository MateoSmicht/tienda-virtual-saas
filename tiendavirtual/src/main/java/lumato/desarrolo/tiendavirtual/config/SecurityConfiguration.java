package lumato.desarrolo.tiendavirtual.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Autowired
    private CustomAccessFilter customAccessFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(request -> {
                    // 1. RUTAS 100% PÚBLICAS (No requieren token)
                    request.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                    request.requestMatchers("/api/register", "/api/auth/login", "/api/auth/recuperar-password",
                            "/api/productos/publico/", "/api/categorias/publico/", "/api/banner/publico/","/api/auth/reset-password","/api/negocios/publico/").permitAll();
                    request.requestMatchers("/api/pagos/notificacion").permitAll(); // Webhook de Mercado Pago

                    // 2. E-COMMERCE PÚBLICO (Cualquiera puede VER los productos de la tienda)
                    request.requestMatchers(HttpMethod.GET, "/api/productos/**").permitAll();
                    request.requestMatchers(HttpMethod.GET, "/api/categorias/**").permitAll();
                    request.requestMatchers(HttpMethod.GET, "/api/banner/**").permitAll();

                    // 3. MI PERFIL (Cualquier usuario logueado, sea admin, cajero o cliente)
                    request.requestMatchers("/api/user/me/**").authenticated();
                    request.requestMatchers(HttpMethod.POST, "/api/pedidos").authenticated(); // Para comprar
                    request.requestMatchers(HttpMethod.GET, "/api/pedidos/mis-pedidos").authenticated();

                    // 4. CAJA Y MOSTRADOR (Solo empleados)
                    // Nota: Usamos hasAuthority en vez de hasRole para evitar problemas con el prefijo "ROLE_"
                    request.requestMatchers("/api/caja/**").hasAnyAuthority("ADMIN", "CAJERO");
                    request.requestMatchers(HttpMethod.GET, "/api/buscar").hasAnyAuthority("ADMIN", "CAJERO"); // Para buscar clientes

                    // 5. ADMINISTRACIÓN PURA (Solo el dueño)
                    request.requestMatchers("/api/estadisticas/**").hasAuthority("ADMIN");
                    request.requestMatchers(HttpMethod.POST, "/api/productos/**").hasAuthority("ADMIN");
                    request.requestMatchers(HttpMethod.PUT, "/api/productos/**").hasAuthority("ADMIN");
                    request.requestMatchers(HttpMethod.DELETE, "/api/productos/**").hasAuthority("ADMIN");
                    request.requestMatchers(HttpMethod.POST, "/api/categorias/**").hasAuthority("ADMIN");
                    request.requestMatchers(HttpMethod.PUT, "/api/categorias/**").hasAuthority("ADMIN");
                    request.requestMatchers(HttpMethod.DELETE, "/api/categorias/**").hasAuthority("ADMIN");

                    // Gestión de otros usuarios
                    request.requestMatchers(HttpMethod.GET, "/api/user/**").hasAuthority("ADMIN");
                    request.requestMatchers(HttpMethod.PUT, "/api/user/**").hasAuthority("ADMIN");
                    request.requestMatchers(HttpMethod.DELETE, "/api/user/**").hasAuthority("ADMIN");
                    // 6. CUALQUIER OTRA RUTA NO ESPECIFICADA
                    request.anyRequest().authenticated();
                });

        // Agregamos tu filtro personalizado antes del de Spring
        http.addFilterBefore(customAccessFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000","http://vperfumery.localhost:5173",
                "http://vperfumery.localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}