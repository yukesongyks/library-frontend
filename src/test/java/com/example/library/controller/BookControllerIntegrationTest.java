package com.example.library.controller;

import com.example.library.dto.BookRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BookControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static BookRequest sampleRequest;

    @BeforeAll
    static void setUp() {
        sampleRequest = new BookRequest(
            "测试书名",
            "测试作者",
            "978-7-123-45678-9",
            "测试出版社",
            LocalDate.of(2023, 1, 15)
        );
    }

    // ── 正向路径 ──

    @Test
    @Order(1)
    void shouldCreateBookAndReturn201() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("测试书名"))
                .andExpect(jsonPath("$.author").value("测试作者"))
                .andExpect(jsonPath("$.isbn").value("978-7-123-45678-9"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    @Order(2)
    void shouldGetAllBooksWithPagination() throws Exception {
        mockMvc.perform(get("/api/books?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(1)));
    }

    @Test
    @Order(3)
    void shouldGetBookById() throws Exception {
        mockMvc.perform(get("/api/books/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("测试书名"));
    }

    @Test
    @Order(4)
    void shouldUpdateBookAndReturn200() throws Exception {
        BookRequest updateRequest = new BookRequest(
            "更新书名",
            "更新作者",
            "978-7-987-65432-1",
            "更新出版社",
            LocalDate.of(2024, 6, 1)
        );

        mockMvc.perform(put("/api/books/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("更新书名"))
                .andExpect(jsonPath("$.isbn").value("978-7-987-65432-1"));
    }

    @Test
    @Order(5)
    void shouldDeleteBookAndReturn204() throws Exception {
        mockMvc.perform(delete("/api/books/1"))
                .andExpect(status().isNoContent());
    }

    // ── 异常路径 ──

    @Test
    @Order(6)
    void shouldReturn404WhenBookNotFound() throws Exception {
        mockMvc.perform(get("/api/books/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").containsString("不存在"));
    }

    @Test
    @Order(7)
    void shouldReturn409WhenIsbnDuplicate() throws Exception {
        // 先创建一条记录
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isCreated());

        // 再用相同 ISBN 创建，期望 409
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    @Order(8)
    void shouldReturn400WhenValidationFails() throws Exception {
        BookRequest invalidRequest = new BookRequest(
            "",    // title 为空 → @NotBlank 失败
            "",    // author 为空 → @NotBlank 失败
            "",    // isbn 为空 → @NotBlank 失败
            "出版社",
            LocalDate.of(2099, 1, 1)  // 未来日期 → @PastOrPresent 失败
        );

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    @Order(9)
    void shouldReturn404WhenDeletingNonexistentBook() throws Exception {
        mockMvc.perform(delete("/api/books/999"))
                .andExpect(status().isNotFound());
    }
}