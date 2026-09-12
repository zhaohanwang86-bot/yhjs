package com.yhjs.server.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import org.bouncycastle.crypto.generators.SCrypt;

/**
 * 与 Node 版 auth.js 完全兼容的密码散列：
 * Node 的 crypto.scryptSync(password, salt, 64) 默认参数为 N=16384, r=8, p=1。
 * salt 为 16 字节随机数转 hex（32 字符），存储格式为 "salt:derivedKey"。
 */
public final class PasswordHasher {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int N = 16384;
    private static final int R = 8;
    private static final int P = 1;
    private static final int KEY_LEN = 64;

    private PasswordHasher() {
    }

    public static String hash(String password) {
        byte[] saltBytes = new byte[16];
        RANDOM.nextBytes(saltBytes);
        String salt = toHex(saltBytes);
        byte[] derived = SCrypt.generate(
            password.getBytes(StandardCharsets.UTF_8),
            salt.getBytes(StandardCharsets.UTF_8),
            N, R, P, KEY_LEN);
        return salt + ":" + toHex(derived);
    }

    public static boolean verify(String password, String stored) {
        if (stored == null) {
            return false;
        }
        String[] parts = stored.split(":", 2);
        if (parts.length != 2) {
            return false;
        }
        byte[] actual = SCrypt.generate(
            password.getBytes(StandardCharsets.UTF_8),
            parts[0].getBytes(StandardCharsets.UTF_8),
            N, R, P, KEY_LEN);
        return MessageDigest.isEqual(
            toHex(actual).getBytes(StandardCharsets.UTF_8),
            parts[1].getBytes(StandardCharsets.UTF_8));
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
