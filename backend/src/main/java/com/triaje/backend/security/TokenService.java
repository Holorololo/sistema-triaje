package com.triaje.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.triaje.backend.entity.Usuario;

@Service
public class TokenService {

    private final String tokenSecret;
    private final long expirationHours;

    public TokenService(
            @Value("${app.auth.token-secret:sistema-triaje-local}") String tokenSecret,
            @Value("${app.auth.token-expiration-hours:12}") long expirationHours) {
        this.tokenSecret = tokenSecret;
        this.expirationHours = expirationHours;
    }

    public String createToken(Usuario usuario) {
        long expiresAt = Instant.now().plusSeconds(expirationHours * 3600).toEpochMilli();
        String payload = usuario.getId() + ":" + expiresAt;
        return encode(payload) + "." + sign(payload);
    }

    public Integer extractValidUserId(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) {
                return null;
            }

            String payload = decode(parts[0]);
            String expectedSignature = sign(payload);
            if (!MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    parts[1].getBytes(StandardCharsets.UTF_8))) {
                return null;
            }

            String[] payloadParts = payload.split(":");
            if (payloadParts.length != 2) {
                return null;
            }

            long expiresAt = Long.parseLong(payloadParts[1]);
            if (Instant.now().toEpochMilli() > expiresAt) {
                return null;
            }

            return Integer.parseInt(payloadParts[0]);
        } catch (Exception ex) {
            return null;
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo firmar el token", ex);
        }
    }

    private String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String decode(String value) {
        return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
    }
}
