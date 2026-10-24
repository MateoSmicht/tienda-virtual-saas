package lumato.desarrolo.tiendavirtual.config;


import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API de Punto de Venta con E-Commerce")
                        .version("1.0")
                        .description("Sistema de gestión de pedidos, catálogo y estadísticas con integración a Mercado Pago.")
                        .contact(new Contact()
                                .name("Mateo Smicht")
                                .email("Mateosmicht15@gmail.com")
                                .url("https://www.linkedin.com/in/mateosmicht/")));
    }
}