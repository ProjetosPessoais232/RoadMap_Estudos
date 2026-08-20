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
        Map<String, Object> dotenv = readDotEnv(Path.of(".env"));
        dotenv.forEach((key, value) -> {
            if (System.getenv(key) == null && System.getProperty(key) == null && value != null) {
                System.setProperty(key, String.valueOf(value));
            }
        });
        SpringApplication.run(RoadmapEstudosApplication.class, args);
    }

    private static Map<String, Object> readDotEnv(Path path) {
        Map<String, Object> values = new LinkedHashMap<>();
        if (!Files.isRegularFile(path)) {
            return values;
        }
        try {
            for (String raw : Files.readAllLines(path, StandardCharsets.UTF_8)) {
                String line = raw.trim();
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
