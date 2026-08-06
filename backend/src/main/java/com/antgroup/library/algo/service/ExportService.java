package com.antgroup.library.algo.service;

import com.antgroup.library.algo.common.BizException;
import com.antgroup.library.algo.common.ResultCode;
import com.antgroup.library.algo.dto.ExportResult;
import com.antgroup.library.algo.enums.ExportFormat;
import com.antgroup.library.algo.enums.ExportType;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 导出服务：根据 exportType 枚举分发到具体生成器，
 * 返回 byte[] + 文件名 + Content-Type。
 *
 * <p>CSV 使用纯 JDK 实现（UTF-8 BOM 防乱码），Excel 使用 Apache POI。
 * type 白名单校验，禁止反射或动态类加载。</p>
 *
 * @author DTCoder
 */
@Slf4j
@Service
public class ExportService {

    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    /**
     * 导出数据。
     *
     * @param typeStr 导出类型字符串（HELLO/HASH/BUBBLE_SORT）
     * @param formatStr 导出格式字符串（CSV/EXCEL）
     * @param data 当前 Tab 的结果数据
     * @return ExportResult 含字节、文件名、Content-Type
     */
    public ExportResult exportData(String typeStr, String formatStr, Map<String, Object> data) {
        ExportType type = parseType(typeStr);
        ExportFormat format = parseFormat(formatStr);
        String fileName = type.getFileNamePrefix() + format.getFileSuffix();
        byte[] bytes;
        if (format == ExportFormat.CSV) {
            bytes = toCsv(data);
        } else {
            bytes = toExcel(data);
        }
        return new ExportResult(bytes, fileName, format.getContentType());
    }

    /**
     * 解析导出类型（白名单，非法值抛业务异常）。
     */
    private ExportType parseType(String typeStr) {
        try {
            return ExportType.valueOf(typeStr);
        } catch (IllegalArgumentException e) {
            log.warn("不支持的导出类型: {}", typeStr);
            throw new BizException(ResultCode.EXPORT_TYPE_NOT_SUPPORTED, "不支持的导出类型: " + typeStr);
        }
    }

    /**
     * 解析导出格式（白名单，非法值抛业务异常）。
     */
    private ExportFormat parseFormat(String formatStr) {
        try {
            return ExportFormat.valueOf(formatStr);
        } catch (IllegalArgumentException e) {
            log.warn("不支持的导出格式: {}", formatStr);
            throw new BizException(ResultCode.EXPORT_FORMAT_NOT_SUPPORTED, "不支持的导出格式: " + formatStr);
        }
    }

    /**
     * CSV 生成：UTF-8 BOM + 首行表头 + 数据行。
     */
    private byte[] toCsv(Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();
        sb.append(new String(UTF8_BOM, StandardCharsets.ISO_8859_1));
        List<String> keys = new ArrayList<>(data.keySet());
        sb.append(String.join(",", keys)).append("\n");
        List<String> values = new ArrayList<>();
        for (String key : keys) {
            Object v = data.get(key);
            values.add(v == null ? "" : escapeCsv(v.toString()));
        }
        sb.append(String.join(",", values)).append("\n");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * CSV 字段转义：含逗号/引号/换行则用双引号包裹，内部引号翻倍。
     */
    private String escapeCsv(String field) {
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }

    /**
     * Excel 生成：POI XSSFWorkbook，首行表头 + 第二行数据。
     */
    private byte[] toExcel(Map<String, Object> data) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Result");
            List<String> keys = new ArrayList<>(data.keySet());
            Row header = sheet.createRow(0);
            for (int i = 0; i < keys.size(); i++) {
                header.createCell(i).setCellValue(keys.get(i));
            }
            Row valueRow = sheet.createRow(1);
            for (int i = 0; i < keys.size(); i++) {
                Object v = data.get(keys.get(i));
                Cell cell = valueRow.createCell(i);
                if (v instanceof Number num) {
                    cell.setCellValue(num.doubleValue());
                } else {
                    cell.setCellValue(v == null ? "" : v.toString());
                }
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Excel 导出失败", e);
            throw new BizException(ResultCode.INTERNAL_ERROR, "Excel 导出失败");
        }
    }
}
