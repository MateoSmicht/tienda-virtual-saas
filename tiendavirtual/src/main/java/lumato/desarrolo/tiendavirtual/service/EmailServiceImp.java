package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.DetallePedido;
import lumato.desarrolo.tiendavirtual.model.Pedido;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImp implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // Tu correo del sistema (el que envía)
    @Value("${spring.mail.username}")
    private String miCorreo;

    @Override
    @Async
    public void enviarAvisoDeNuevoPedido(Pedido pedido) {

        // 1. Obtenemos el correo del dueño de ese negocio específico
        String emailDelDueño = pedido.getNegocio().getEmailContacto();

        // Si el negocio no configuró su email, no podemos avisarle
        if (emailDelDueño == null || emailDelDueño.isEmpty()) {
            System.out.println("No se pudo enviar notificación web: El negocio " +
                    pedido.getNegocio().getNombre() + " no tiene email configurado.");
            return;
        }

        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(miCorreo); // El sistema remite
        mensaje.setTo(emailDelDueño); // El dueño del local recibe

        // Personalizamos el asunto para que el dueño sepa de qué sucursal es
        mensaje.setSubject("🚀 ¡NUEVA VENTA WEB! - " + pedido.getNegocio().getNombre() + " (Pedido #" + pedido.getId() + ")");

        StringBuilder texto = new StringBuilder();
        texto.append("Hola, ¡acaba de ingresar una nueva compra en tu tienda online!\n\n");

        texto.append("DATOS DEL CLIENTE:\n");
        // Si el cliente no está registrado (consumidor final web), atajamos el null
        if (pedido.getUsuario() != null) {
            texto.append("- Nombre: ").append(pedido.getUsuario().getNombre()).append(" ").append(pedido.getUsuario().getApellido()).append("\n");
            texto.append("- Email: ").append(pedido.getUsuario().getEmail()).append("\n");
        } else {
            texto.append("- Nombre: Consumidor Final (Web)\n");
        }

        texto.append("- Método de Pago: ").append(pedido.getMetodoPago().name()).append("\n\n");

        texto.append("DETALLE DE LA COMPRA:\n");
        for (DetallePedido detalle : pedido.getDetalles()) {
            texto.append(" > ").append(detalle.getCantidad()).append("x ")
                    .append(detalle.getProducto().getNombre())
                    .append(" ($").append(detalle.getPrecioUnitario()).append(" c/u)\n");
        }

        texto.append("\nTOTAL A COBRAR: $").append(pedido.getTotal()).append("\n");
        texto.append("\nPor favor, ingresá a tu Panel de Administración para preparar el pedido.");

        mensaje.setText(texto.toString());

        try {
            mailSender.send(mensaje);
        } catch (Exception e) {
            System.err.println("Error enviando email al negocio: " + e.getMessage());
        }
    }
    @Async
    @Override
    public void enviarEmailRecuperacion(String emailDestino, String token) {

        // La URL de tu frontend en React (ajustalo si tu puerto es distinto)
        String link = "http://localhost:3000/reset-password?token=" + token;

        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(miCorreo);
        mensaje.setTo(emailDestino);
        mensaje.setSubject("🔒 Recuperación de contraseña - V-PERFUMERY");

        StringBuilder texto = new StringBuilder();
        texto.append("Hola,\n\n");
        texto.append("Recibimos una solicitud para restablecer tu contraseña en V-PERFUMERY.\n");
        texto.append("Hacé clic en el siguiente enlace para crear una nueva clave (este enlace expira en 1 hora):\n\n");
        texto.append(link).append("\n\n");
        texto.append("Si no solicitaste este cambio, podés ignorar este correo tranquilamente. Tu cuenta está segura.\n\n");
        texto.append("Saludos,\nEl equipo de V-PERFUMERY");

        mensaje.setText(texto.toString());

        try {
            mailSender.send(mensaje);
            System.out.println("Email de recuperación enviado exitosamente a: " + emailDestino);
        } catch (Exception e) {
            System.err.println("Error enviando email de recuperación a " + emailDestino + ": " + e.getMessage());
        }
    }
}