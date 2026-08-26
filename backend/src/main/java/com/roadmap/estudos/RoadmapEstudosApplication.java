package com.roadmap.estudos;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.SpringApplication;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class RoadmapEstudosApplication {

    public static void main(String[] args) {
        String os = System.getProperty("os.name", "").toLowerCase();
        if (os.contains("win") && System.getProperty("javax.net.ssl.trustStoreType") == null) {
            System.setProperty("javax.net.ssl.trustStore", "NONE");
            System.setProperty("javax.net.ssl.trustStoreType", "Windows-ROOT");
        }
        loadDotEnv();
        SpringApplication.run(RoadmapEstudosApplication.class, args);
    }

    private static void loadDotEnv() {
        Path envFile = findDotEnv();
        if (envFile == null) {
            System.out.println("Nenhum .env encontrado (cwd=" + Path.of("").toAbsolutePath().normalize() + ")");
            return;
        }
        Map<String, Object> dotenv = readDotEnv(envFile);
        dotenv.forEach((key, value) -> {
            if (value == null) {
                return;
            }
            if (System.getenv(key) == null && System.getProperty(key) == null) {
                System.setProperty(key, String.valueOf(value));
            }
        });
        String geminiKey = firstNonBlank(
                System.getenv("GEMINI_API_KEY"),
                System.getProperty("GEMINI_API_KEY"),
                asString(dotenv.get("GEMINI_API_KEY"))
        );
        if (geminiKey != null) {
            // @Value("${gemini.api-key}") não lê GEMINI_API_KEY em system properties.
            System.setProperty("gemini.api-key", geminiKey);
            System.out.println("GEMINI_API_KEY carregada de " + envFile.toAbsolutePath().normalize());
        } else {
            System.out.println("Arquivo " + envFile + " lido, mas GEMINI_API_KEY está vazia");
        }
    }

    private static Path findDotEnv() {
        Path start = Path.of(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        Path dir = start;
        for (int i = 0; i < 6 && dir != null; i++, dir = dir.getParent()) {
            Path[] candidates = {
                    dir.resolve(".env"),
                    dir.resolve("backend").resolve(".env")
            };
            for (Path candidate : candidates) {
                if (Files.isRegularFile(candidate)) {
                    return candidate;
                }
            }
        }
        return null;
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private static Map<String, Object> readDotEnv(Path path) {
        Map<String, Object> values = new LinkedHashMap<>();
        if (!Files.isRegularFile(path)) {
            return values;
        }
        try {
            for (String raw : Files.readAllLines(path, StandardCharsets.UTF_8)) {
                String line = raw.trim();
                if (!line.isEmpty() && line.charAt(0) == '\uFEFF') {
                    line = line.substring(1).trim();
                }
                if (line.startsWith("export ")) {
                    line = line.substring("export ".length()).trim();
                }
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                int eq = line.indexOf('=');
                String key = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                if (value.length() >= 2
                        && ((value.startsWith("\"") && value.endsWith("\""))
                        || (value.startsWith("'") && value.endsWith("'")))) {
                    value = value.substring(1, value.length() - 1);
                }
                if (!key.isEmpty()) {
                    values.put(key, value);
                }
            }
        } catch (IOException ignored) {
            return values;
        }
        return values;
    }
}
