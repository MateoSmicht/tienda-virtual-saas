package lumato.desarrolo.tiendavirtual.utils;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import lumato.desarrolo.tiendavirtual.model.Usuario;

import java.util.Date;

public class JwtUtil {

    private static final String SECRET_KEY = "gj43jng9";
    private static final Algorithm algorithm = Algorithm.HMAC256(SECRET_KEY);

    public static String generateToken(Usuario user) {
        String token = JWT.create()
                .withIssuer("Lumato")
                .withClaim("userId", user.getId())
                .withClaim("rol", user.getRol().toString())
                .withIssuedAt(new Date())
                .withExpiresAt(getExpiresDate())
                .sign(algorithm);
        return token;
    }

    private static Date getExpiresDate() {
        return new Date(System.currentTimeMillis()
                + (1000L * 60 * 60 * 24 * 14)); // 14 days
    }

    public static String getUserIdByToken(String token) {
        JWTVerifier verifier = JWT.require(algorithm)
                .withIssuer("Lumato")
                .build();
        DecodedJWT decoded = verifier.verify(token);
        String userId = decoded.getClaim("userId").toString();
        return userId;
    }
}