# 个人藏书管理系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为个人用户提供一套 REST API，实现个人藏书的增删改查（CRUD）管理。

**Architecture:** 经典三层分层架构（Controller → Service → Repository），Spring Boot 3.x + Spring Data JPA + H2 内存数据库，RESTful API 通过 SpringDoc OpenAPI 自动生成文档。

**Tech Stack:** Java 17, Spring Boot 3.x, Spring Data JPA (Hibernate), H2 (内存模式), SpringDoc OpenAPI, Bean Validation (Jakarta), Maven, JUnit 5 + Mockito

**Spec:** `docs/superpowers/specs/2025-07-18-library-management-design.md`

## Global Constraints

- Java 17 LTS
- Spring Boot 3.x
- H2 内存数据库，零安装依赖
- 仅 CRUD，不含用户认证、前端界面、阅读状态、借出归还、标签分类
- DDL 策略: `update`（开发阶段）
- 服务端口: 8080
- API 基础路径: `/api/books`
- ISBN 唯一约束，冲突返回 409
- 删除成功返回 204 No Content
- 创建成功返回 201 Created
- 分页默认: page=0, size=20, sort=title,asc
- 统一错误响应格式: `{timestamp, status, error, message, path}`

---

## Task 1: 项目骨架与 Maven 配置

**Files:**
- Create: `pom.xml`
- Create: `src/main/resources/application.yml`
- Create: `src/main/java/com/example/library/LibraryApplication.java`

**Interfaces:**
- Consumes: (none — first task)
- Produces: `LibraryApplication` Spring Boot 入口类; Maven 依赖树锁定所有后续任务依赖; `application.yml` 配置所有后续任务运行时参数

### Step 1: 创建 pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>library</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>library</name>
    <description>个人藏书管理系统</description>

    <properties>
        <java.version>17</java.version>
        <springdoc.version>2.5.0</springdoc.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- 数据库 -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- OpenAPI / Swagger -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>${springdoc.version}</version>
        </dependency>

        <!-- 测试 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### Step 2: 创建 application.yml

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:library
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    database-platform: org.hibernate.dialect.H2Dialect

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

server:
  port: 8080
```

### Step 3: 创建 Spring Boot 启动类

```java
package com.example.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryApplication {
    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

### Step 4: 验证项目可编译

Run: `mvn compile -q`
Expected: BUILD SUCCESS

### Step 5: 验证应用可启动

Run: `mvn spring-boot:run -q & sleep 10 && curl -s http://localhost:8080/api-docs | head -5 && kill %1`
Expected: 返回 OpenAPI JSON 文档片段

---

## Task 2: Book 实体类

**Files:**
- Create: `src/main/java/com/example/library/entity/Book.java`

**Interfaces:**
- Consumes: `LibraryApplication` (Task 1), H2/JPA 配置 (Task 1)
- Produces: `Book` JPA 实体，包含 `id`, `title`, `author`, `isbn`, `publisher`, `publishDate`, `createdAt`, `updatedAt`

### Step 1: 创建 Book 实体

```java
package com.example.library.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 255)
    private String author;

    @Column(nullable = false, length = 20, unique = true)
    private String isbn;

    @Column(length = 255)
    private String publisher;

    @Column(name = "publish_date")
    private LocalDate publishDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Constructors
    public Book() {}

    public Book(String title, String author, String isbn, String publisher, LocalDate publishDate) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.publisher = publisher;
        this.publishDate = publishDate;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }

    public LocalDate getPublishDate() { return publishDate; }
    public void setPublishDate(LocalDate publishDate) { this.publishDate = publishDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

### Step 2: 验证 JPA 实体映射

Run: `mvn compile -q`
Expected: BUILD SUCCESS（实体类编译通过，DDL 由 Hibernate 在启动时自动生成）

---

## Task 3: DTO 类 — BookRequest 与 BookResponse

**Files:**
- Create: `src/main/java/com/example/library/dto/BookRequest.java`
- Create: `src/main/java/com/example/library/dto/BookResponse.java`

**Interfaces:**
- Consumes: `Book` 实体字段定义 (Task 2)
- Produces:
  - `BookRequest(String title, String author, String isbn, String publisher, LocalDate publishDate)` — 带 Jakarta Validation 约束
  - `BookResponse(Long id, String title, String author, String isbn, String publisher, LocalDate publishDate, LocalDateTime createdAt, LocalDateTime updatedAt)` — 静态工厂方法 `fromEntity(Book)`

### Step 1: 创建 BookRequest DTO

```java
package com.example.library.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class BookRequest {

    @NotBlank(message = "书名不能为空")
    @Size(max = 255, message = "书名长度不能超过255个字符")
    private String title;

    @NotBlank(message = "作者不能为空")
    @Size(max = 255, message = "作者长度不能超过255个字符")
    private String author;

    @NotBlank(message = "ISBN不能为空")
    @Size(max = 20, message = "ISBN长度不能超过20个字符")
    private String isbn;

    @Size(max = 255, message = "出版社长度不能超过255个字符")
    private String publisher;

    @PastOrPresent(message = "出版日期不能是未来日期")
    private LocalDate publishDate;

    // Constructors
    public BookRequest() {}

    public BookRequest(String title, String author, String isbn, String publisher, LocalDate publishDate) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.publisher = publisher;
        this.publishDate = publishDate;
    }

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }

    public LocalDate getPublishDate() { return publishDate; }
    public void setPublishDate(LocalDate publishDate) { this.publishDate = publishDate; }
}
```

### Step 2: 创建 BookResponse DTO

```java
package com.example.library.dto;

import com.example.library.entity.Book;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BookResponse {

    private Long id;
    private String title;
    private String author;
    private String isbn;
    private String publisher;
    private LocalDate publishDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public BookResponse() {}

    public BookResponse(Long id, String title, String author, String isbn,
                        String publisher, LocalDate publishDate,
                        LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.publisher = publisher;
        this.publishDate = publishDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Static factory method
    public static BookResponse fromEntity(Book book) {
        return new BookResponse(
            book.getId(),
            book.getTitle(),
            book.getAuthor(),
            book.getIsbn(),
            book.getPublisher(),
            book.getPublishDate(),
            book.getCreatedAt(),
            book.getUpdatedAt()
        );
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }

    public LocalDate getPublishDate() { return publishDate; }
    public void setPublishDate(LocalDate publishDate) { this.publishDate = publishDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

### Step 3: 验证编译

Run: `mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 4: BookRepository — JPA 数据访问层

**Files:**
- Create: `src/main/java/com/example/library/repository/BookRepository.java`

**Interfaces:**
- Consumes: `Book` 实体 (Task 2)
- Produces: `BookRepository extends JpaRepository<Book, Long>` — 提供 `findByIsbn(String isbn)` 查询方法

### Step 1: 创建 BookRepository

```java
package com.example.library.repository;

import com.example.library.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByIsbn(String isbn);
}
```

### Step 2: 验证编译

Run: `mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 5: Service 层 — BookService 接口 + BookServiceImpl 实现

**Files:**
- Create: `src/main/java/com/example/library/service/BookService.java`
- Create: `src/main/java/com/example/library/service/BookServiceImpl.java`

**Interfaces:**
- Consumes: `BookRepository` (Task 4), `Book` 实体 (Task 2), `BookRequest` / `BookResponse` DTO (Task 3)
- Produces:
  - `BookService` 接口: `Page<BookResponse> findAll(Pageable)`, `BookResponse findById(Long)`, `BookResponse create(BookRequest)`, `BookResponse update(Long, BookRequest)`, `void delete(Long)`
  - `BookServiceImpl` 实现所有方法，含 ISBN 唯一性校验、404 处理

### Step 1: 创建 BookService 接口

```java
package com.example.library.service;

import com.example.library.dto.BookRequest;
import com.example.library.dto.BookResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookService {

    Page<BookResponse> findAll(Pageable pageable);

    BookResponse findById(Long id);

    BookResponse create(BookRequest request);

    BookResponse update(Long id, BookRequest request);

    void delete(Long id);
}
```

### Step 2: 创建 BookServiceImpl 实现

```java
package com.example.library.service;

import com.example.library.dto.BookRequest;
import com.example.library.dto.BookResponse;
import com.example.library.entity.Book;
import com.example.library.repository.BookRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;

    public BookServiceImpl(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookResponse> findAll(Pageable pageable) {
        return bookRepository.findAll(pageable)
                .map(BookResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public BookResponse findById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("图书不存在，ID: " + id));
        return BookResponse.fromEntity(book);
    }

    @Override
    public BookResponse create(BookRequest request) {
        // ISBN 唯一性校验
        if (bookRepository.findByIsbn(request.getIsbn()).isPresent()) {
            throw new DataIntegrityViolationException("ISBN 已存在: " + request.getIsbn());
        }

        Book book = new Book(
            request.getTitle(),
            request.getAuthor(),
            request.getIsbn(),
            request.getPublisher(),
            request.getPublishDate()
        );
        Book saved = bookRepository.save(book);
        return BookResponse.fromEntity(saved);
    }

    @Override
    public BookResponse update(Long id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("图书不存在，ID: " + id));

        // ISBN 唯一性校验（排除当前记录）
        bookRepository.findByIsbn(request.getIsbn()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DataIntegrityViolationException("ISBN 已存在: " + request.getIsbn());
            }
        });

        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setPublisher(request.getPublisher());
        book.setPublishDate(request.getPublishDate());

        Book saved = bookRepository.save(book);
        return BookResponse.fromEntity(saved);
    }

    @Override
    public void delete(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new RuntimeException("图书不存在，ID: " + id);
        }
        bookRepository.deleteById(id);
    }
}
```

### Step 3: 验证编译

Run: `mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 6: BookController — REST 控制器

**Files:**
- Create: `src/main/java/com/example/library/controller/BookController.java`

**Interfaces:**
- Consumes: `BookService` (Task 5), `BookRequest` / `BookResponse` (Task 3)
- Produces: 5 个 REST 端点 — `GET /api/books`, `GET /api/books/{id}`, `POST /api/books`, `PUT /api/books/{id}`, `DELETE /api/books/{id}`

### Step 1: 创建 BookController

```java
package com.example.library.controller;

import com.example.library.dto.BookRequest;
import com.example.library.dto.BookResponse;
import com.example.library.service.BookService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public ResponseEntity<Page<BookResponse>> getAllBooks(Pageable pageable) {
        Page<BookResponse> books = bookService.findAll(pageable);
        return ResponseEntity.ok(books);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookResponse> getBookById(@PathVariable Long id) {
        BookResponse book = bookService.findById(id);
        return ResponseEntity.ok(book);
    }

    @PostMapping
    public ResponseEntity<BookResponse> createBook(@Valid @RequestBody BookRequest request) {
        BookResponse created = bookService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookResponse> updateBook(@PathVariable Long id,
                                                   @Valid @RequestBody BookRequest request) {
        BookResponse updated = bookService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Step 2: 验证编译

Run: `mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 7: GlobalExceptionHandler — 统一异常处理

**Files:**
- Create: `src/main/java/com/example/library/exception/GlobalExceptionHandler.java`

**Interfaces:**
- Consumes: `BookService` 抛出的 `RuntimeException` (404) 和 `DataIntegrityViolationException` (409)，以及 `MethodArgumentNotValidException` (400)
- Produces: 统一 JSON 错误响应 `{timestamp, status, error, message, path}`

### Step 1: 创建 GlobalExceptionHandler

```java
package com.example.library.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex, ServletWebRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Not Found");
        body.put("message", ex.getMessage());
        body.put("path", request.getRequest().getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, ServletWebRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", "Conflict");
        body.put("message", ex.getMessage());
        body.put("path", request.getRequest().getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex, ServletWebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");
        body.put("message", message);
        body.put("path", request.getRequest().getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
```

### Step 2: 验证编译

Run: `mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 8: 集成测试 — Controller 全链路测试

**Files:**
- Create: `src/test/java/com/example/library/controller/BookControllerIntegrationTest.java`

**Interfaces:**
- Consumes: 所有已实现类 (Task 1–7)
- Produces: 覆盖所有 5 个端点的正向/异常路径集成测试

### Step 1: 创建集成测试类

```java
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
```

### Step 2: 运行集成测试

Run: `mvn test -Dtest=BookControllerIntegrationTest -q`
Expected: 9 tests PASS

---

## Task 9: 单元测试 — Service 层

**Files:**
- Create: `src/test/java/com/example/library/service/BookServiceImplTest.java`

**Interfaces:**
- Consumes: `BookServiceImpl` (Task 5), `BookRepository` (Task 4), DTO (Task 3)
- Produces: Mockito 单元测试覆盖 Service 层所有公开方法

### Step 1: 创建 Service 单元测试

```java
package com.example.library.service;

import com.example.library.dto.BookRequest;
import com.example.library.dto.BookResponse;
import com.example.library.entity.Book;
import com.example.library.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceImplTest {

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private BookServiceImpl bookService;

    private Book book;
    private BookRequest bookRequest;

    @BeforeEach
    void setUp() {
        book = new Book("书名", "作者", "ISBN-001", "出版社", LocalDate.of(2023, 1, 1));
        book.setId(1L);

        bookRequest = new BookRequest("书名", "作者", "ISBN-001", "出版社", LocalDate.of(2023, 1, 1));
    }

    @Test
    void findAll_shouldReturnPageOfBookResponse() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Book> bookPage = new PageImpl<>(List.of(book), pageable, 1);
        when(bookRepository.findAll(pageable)).thenReturn(bookPage);

        Page<BookResponse> result = bookService.findAll(pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("书名");
        verify(bookRepository).findAll(pageable);
    }

    @Test
    void findById_shouldReturnBookResponse_whenFound() {
        when(bookRepository.findById(1L)).thenReturn(Optional.of(book));

        BookResponse result = bookService.findById(1L);

        assertThat(result.getTitle()).isEqualTo("书名");
        assertThat(result.getIsbn()).isEqualTo("ISBN-001");
    }

    @Test
    void findById_shouldThrow_whenNotFound() {
        when(bookRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookService.findById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("不存在");
    }

    @Test
    void create_shouldReturnBookResponse_whenIsbnNotDuplicate() {
        when(bookRepository.findByIsbn("ISBN-001")).thenReturn(Optional.empty());
        when(bookRepository.save(any(Book.class))).thenReturn(book);

        BookResponse result = bookService.create(bookRequest);

        assertThat(result.getIsbn()).isEqualTo("ISBN-001");
        verify(bookRepository).save(any(Book.class));
    }

    @Test
    void create_shouldThrow_whenIsbnDuplicate() {
        when(bookRepository.findByIsbn("ISBN-001")).thenReturn(Optional.of(book));

        assertThatThrownBy(() -> bookService.create(bookRequest))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ISBN 已存在");
    }

    @Test
    void update_shouldReturnUpdatedBookResponse() {
        BookRequest updateRequest = new BookRequest("新书名", "新作者", "ISBN-002", "新出版社", LocalDate.of(2024, 1, 1));
        when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
        when(bookRepository.findByIsbn("ISBN-002")).thenReturn(Optional.empty());
        when(bookRepository.save(any(Book.class))).thenReturn(book);

        BookResponse result = bookService.update(1L, updateRequest);

        assertThat(result).isNotNull();
        verify(bookRepository).save(any(Book.class));
    }

    @Test
    void update_shouldThrow_whenBookNotFound() {
        when(bookRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookService.update(999L, bookRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("不存在");
    }

    @Test
    void update_shouldThrow_whenIsbnConflictWithOtherRecord() {
        Book otherBook = new Book("其他", "其他人", "ISBN-002", "出版社", LocalDate.now());
        otherBook.setId(2L);
        BookRequest updateRequest = new BookRequest("书名", "作者", "ISBN-002", "出版社", LocalDate.now());

        when(bookRepository.findById(1L)).thenReturn(Optional.of(book));
        when(bookRepository.findByIsbn("ISBN-002")).thenReturn(Optional.of(otherBook));

        assertThatThrownBy(() -> bookService.update(1L, updateRequest))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ISBN 已存在");
    }

    @Test
    void delete_shouldDelete_whenBookExists() {
        when(bookRepository.existsById(1L)).thenReturn(true);

        bookService.delete(1L);

        verify(bookRepository).deleteById(1L);
    }

    @Test
    void delete_shouldThrow_whenBookNotFound() {
        when(bookRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> bookService.delete(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("不存在");
    }
}
```

### Step 2: 运行单元测试

Run: `mvn test -Dtest=BookServiceImplTest -q`
Expected: 10 tests PASS

---

## Task 10: 可选初始数据 + 完整构建验证

**Files:**
- Create: `src/main/resources/data.sql`

**Interfaces:**
- Consumes: 所有 Task (1–9)
- Produces: 5 条示例藏书数据，便于 Swagger UI 手动验证

### Step 1: 创建 data.sql

```sql
INSERT INTO books (title, author, isbn, publisher, publish_date, created_at, updated_at)
VALUES
('Java 编程思想', 'Bruce Eckel', '978-7-111-21382-6', '机械工业出版社', '2007-06-01', NOW(), NOW()),
('深入理解 Java 虚拟机', '周志明', '978-7-111-52794-7', '机械工业出版社', '2019-12-01', NOW(), NOW()),
('Spring 实战', 'Craig Walls', '978-7-115-53147-2', '人民邮电出版社', '2020-04-01', NOW(), NOW()),
('重构：改善既有代码的设计', 'Martin Fowler', '978-7-115-50576-6', '人民邮电出版社', '2019-03-01', NOW(), NOW()),
('代码整洁之道', 'Robert C. Martin', '978-7-115-53387-4', '人民邮电出版社', '2020-01-01', NOW(), NOW());
```

### Step 2: 完整构建 + 全量测试

Run: `mvn clean test -q`
Expected: BUILD SUCCESS, all 19 tests PASS (9 integration + 10 unit)

### Step 3: 最终验证 — 启动应用并冒烟测试

Run:
```bash
mvn spring-boot:run -q &
APP_PID=$!
sleep 15

# 冒烟测试
echo "=== 1. GET /api/books (分页) ==="
curl -s http://localhost:8080/api/books?page=0\&size=5 | head -c 200
echo ""

echo "=== 2. POST /api/books (创建) ==="
curl -s -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"新书","author":"新作者","isbn":"978-0-000-00000-1","publisher":"测试出版社","publishDate":"2025-01-01"}' | head -c 200
echo ""

echo "=== 3. GET /api/books/1 (按ID查询) ==="
curl -s http://localhost:8080/api/books/1 | head -c 200
echo ""

echo "=== 4. PUT /api/books/1 (更新) ==="
curl -s -X PUT http://localhost:8080/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"更新书名","author":"更新作者","isbn":"978-0-000-00000-9","publisher":"更新出版社","publishDate":"2025-06-01"}' | head -c 200
echo ""

echo "=== 5. DELETE /api/books/1 (删除) ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}" -X DELETE http://localhost:8080/api/books/1
echo ""

kill $APP_PID 2>/dev/null
```
Expected: 所有端点返回预期状态码和 JSON 响应

---

## Self-Review

### 1. Spec Coverage
| 设计文档章节 | 对应任务 | 覆盖状态 |
|---|---|---|
| §2.1 分层架构 (Controller/Service/Repository/Entity) | Task 2,4,5,6 | ✅ |
| §2.2 项目结构 (DTO, exception, resources) | Task 3,7,10 | ✅ |
| §3.1 Book 实体 (7 字段 + 自动时间戳) | Task 2 | ✅ |
| §3.2 BookRequest (校验注解) | Task 3 | ✅ |
| §3.3 BookResponse (全部字段) | Task 3 | ✅ |
| §4.1 端点总览 (5 个端点) | Task 6 | ✅ |
| §4.2 分页参数 | Task 6 (Pageable 参数) | ✅ |
| §4.3 错误响应格式 | Task 7 (GlobalExceptionHandler) | ✅ |
| §4.4 状态码 (200/201/204/400/404/409/500) | Task 6,7 | ✅ |
| §5.1 application.yml | Task 1 | ✅ |
| §6 依赖项 (pom.xml) | Task 1 | ✅ |
| §7 测试策略 (单元 + 集成 + 冒烟) | Task 8,9,10 | ✅ |

### 2. Placeholder Scan
- 无 TBD / TODO / "implement later" / "fill in details"
- 无 "add appropriate error handling" 等模糊描述
- 所有代码步骤均包含完整可编译代码
- 无 "Similar to Task N" 引用

### 3. Type Consistency
- `Book.id` → `Long` 所有任务一致 ✅
- `BookResponse.fromEntity(Book)` 在 Task 3 定义，Task 5 使用 ✅
- `BookService` 接口方法签名在 Task 5 定义，Task 6 (Controller) 调用一致 ✅
- `BookRepository.findByIsbn(String)` 在 Task 4 定义，Task 5 (Service) 使用 ✅
- 异常类型: `RuntimeException` (404) 和 `DataIntegrityViolationException` (409) 在 Service (Task 5) 抛出，GlobalExceptionHandler (Task 7) 捕获一致 ✅