package com.roadmap.estudos.domain;

import com.roadmap.estudos.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.util.Set;
import java.util.regex.Pattern;

public record NodeStyle(
        String shape,
        String fill,
        String border,
        String textColor,
        Integer fontSize,
        Boolean bold,
        Integer width,
        Integer height
) {
    public static final Set<String> SHAPES = Set.of("rounded", "rectangle", "pill", "diamond");
    public static final Set<Integer> FONT_SIZES = Set.of(12, 14, 16, 18, 20, 24, 28);
    public static final int MIN_WIDTH = 80;
    public static final int MAX_WIDTH = 560;
    public static final int MIN_HEIGHT = 40;
    public static final int MAX_HEIGHT = 400;
    private static final Pattern HEX = Pattern.compile("^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$");

    public NodeStyle validated() {
        if (shape == null || !SHAPES.contains(shape)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Forma inválida. Use rounded, rectangle, pill ou diamond.");
        }
        requireHex(fill, "fill");
        requireHex(border, "border");
        requireHex(textColor, "textColor");
        if (fontSize == null || !FONT_SIZES.contains(fontSize)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tamanho de fonte inválido. Use 12, 14, 16, 18, 20, 24 ou 28.");
        }
        if (bold == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Informe se o texto é negrito.");
        }
        int resolvedWidth = width != null ? width : defaultWidth(shape);
        int resolvedHeight = height != null ? height : defaultHeight(shape);
        if (resolvedWidth < MIN_WIDTH || resolvedWidth > MAX_WIDTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Largura inválida. Use entre 80 e 560.");
        }
        if (resolvedHeight < MIN_HEIGHT || resolvedHeight > MAX_HEIGHT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Altura inválida. Use entre 40 e 400.");
        }
        return new NodeStyle(shape, fill, border, textColor, fontSize, bold, resolvedWidth, resolvedHeight);
    }

    private static int defaultWidth(String shape) {
        return "diamond".equals(shape) ? 168 : 176;
    }

    private static int defaultHeight(String shape) {
        return "diamond".equals(shape) ? 168 : 56;
    }

    private static void requireHex(String value, String field) {
        if (value == null || !HEX.matcher(value).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cor inválida em " + field + ". Use hex, ex: #FEF401.");
        }
    }
}
