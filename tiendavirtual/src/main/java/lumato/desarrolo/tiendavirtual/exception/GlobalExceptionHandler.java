package lumato.desarrolo.tiendavirtual.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Si es un código duplicado, mandamos 409 (Conflict)
    @ExceptionHandler(CodigoBarraDuplicadoException.class)
    public ResponseEntity<ErrorDetalle> manejarDuplicados(CodigoBarraDuplicadoException ex) {
        ErrorDetalle error = new ErrorDetalle(ex.getMessage(), 409);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    // Si un producto no existe, mandamos 404 (Not Found)
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorDetalle> manejarNoEncontrado(EntityNotFoundException ex) {
        ErrorDetalle error = new ErrorDetalle(ex.getMessage(), 404);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // Este queda como "red de seguridad" para cualquier otro error inesperado
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetalle> manejarCualquierError(Exception ex) {
        System.err.println("=== ERROR ATRAPADO POR EL MANEJADOR GLOBAL ===");
        ex.printStackTrace();

        ErrorDetalle error = new ErrorDetalle("Ocurrió un error inesperado", 500);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(StockInsuficienteException.class)
    public ResponseEntity<ErrorDetalle> manejarStockInsuficiente(StockInsuficienteException ex) {
        // 422 Unprocessable Entity es el código ideal para "el formato está bien pero la lógica de negocio falla"
        ErrorDetalle error = new ErrorDetalle(ex.getMessage(), 422);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
    }

    @ExceptionHandler(ProductoNoEncontradoException.class)
    public ResponseEntity<ErrorDetalle> manejarNoEncontrado(ProductoNoEncontradoException ex) {
        // 404 Not Found
        ErrorDetalle error = new ErrorDetalle(ex.getMessage(), 404);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(EmailDuplicadoException.class)
    public ResponseEntity<ErrorDetalle> manejarEmailDuplicado(EmailDuplicadoException ex) {
        // 409 Conflict es el código HTTP correcto para "Ya existe"
        ErrorDetalle error = new ErrorDetalle(ex.getMessage(), 409);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(CategoriaDuplicadaException.class)
    public ResponseEntity<ErrorDetalle> categoriaDuplicadaException(CategoriaDuplicadaException ex) {
        // 409 Conflict es el código HTTP correcto para "Ya existe"
        ErrorDetalle error = new ErrorDetalle(ex.getMessage(), 409);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    //errores de Login (Contraseña incorrecta)
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorDetalle> handleBadCredentialsException(BadCredentialsException ex, HttpServletRequest request) {
        ErrorDetalle error = new ErrorDetalle(ex.getMessage(), 401); // OJO: Lo cambié a 401 que es el correcto para "No Autorizado"
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }


    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorDetalle> manejarValidacionesDeHibernate(ConstraintViolationException ex) {
        // Esto agarra todos los errores (ej: "email no puede estar vacío", "password es muy largo") y los junta
        String mensajesDeError = ex.getConstraintViolations().stream()
                .map(violacion -> violacion.getPropertyPath() + ": " + violacion.getMessage())
                .collect(Collectors.joining(", "));

        ErrorDetalle error = new ErrorDetalle("Error de validación: " + mensajesDeError, 400);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}