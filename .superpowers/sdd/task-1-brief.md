### Task 1: 后端脚手架与统一响应

**Files:**
- Create: `library-backend/pom.xml`
- Create: `library-backend/src/main/resources/application.yml`
- Create: `library-backend/src/main/java/com/library/cost/CostApplication.java`
- Create: `library-backend/src/main/java/com/library/cost/common/ApiResponse.java`
- Create: `library-backend/src/main/java/com/library/cost/common/GlobalExceptionHandler.java`
- Test: `library-backend/src/test/java/com/library/cost/CostApplicationTests.java`

**Interfaces:**
- Produces: `ApiResponse<T>`（record `ApiResponse(int code, String message, T data)`，静态方法 `ok(T)` / `fail(int,String)`），后续所有 Controller 返回类型。

- [ ] **Step 1: 创建 `pom.xml`**

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
  <groupId>com.library</groupId>
  <artifactId>library-backend</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>library-backend</name>
  <description>成本统计报表后端</description>
  <properties>
    <java.version>17</java.version>
    <mybatis-plus.version>3.5.5</mybatis-plus.version>
    <poi.version>5.2.5</poi.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>com.baomidou</groupId>
      <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
      <version>${mybatis-plus.version}</version>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>com.mysql</groupId>
      <artifactId>mysql-connector-j</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.apache.poi</groupId>
      <artifactId>poi-ooxml</artifactId>
      <version>${poi.version}</version>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
    </dependency>
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
        <configuration>
          <excludes>
            <exclude>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
            </exclude>
          </excludes>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

- [ ] **Step 2: 创建 `application.yml`**

```yaml
server:
  port: 8080

spring:
  application:
    name: library-backend
  datasource:
    url: jdbc:h2:mem:costdb;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE
    driver-class-name: org.h2.Driver
    username: sa
    password: ""
  sql:
    init:
      mode: always
      schema-locations: classpath:schema.sql
      data-locations: classpath:data.sql
  h2:
    console:
      enabled: true

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
```

> 说明：默认使用 H2 内存库（含种子数据），保证无外部依赖可运行；`mysql-connector-j` 仅保留运行时依赖，切换 MySQL 时替换 datasource 配置即可（本计划不切换）。

- [ ] **Step 3: 创建启动类 `CostApplication.java`**

```java
package com.library.cost;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.library.cost.mapper")
public class CostApplication {

    public static void main(String[] args) {
        SpringApplication.run(CostApplication.class, args);
    }
}
```

- [ ] **Step 4: 创建统一响应 `common/ApiResponse.java`**

```java
package com.library.cost.common;

public record ApiResponse<T>(int code, String message, T data) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(0, "ok", data);
    }

    public static <T> ApiResponse<T> fail(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}
```

- [ ] **Step 5: 创建异常处理器 `common/GlobalExceptionHandler.java`**

```java
package com.library.cost.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return ApiResponse.fail(400, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleOther(Exception ex) {
        return ApiResponse.fail(500, "服务器内部错误: " + ex.getMessage());
    }
}
```

- [ ] **Step 6: 编写上下文加载测试 `CostApplicationTests.java`**

```java
package com.library.cost;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class CostApplicationTests {

    @Test
    void contextLoads() {
    }
}
```

- [ ] **Step 7: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；`Tests run: 1, Failures: 0`（contextLoads 通过；若 schema.sql/data.sql 尚不存在，本任务临时用空文件占位，Task 2 填充）。

> 注：若 `spring.sql.init` 找不到 classpath 上的 schema.sql/data.sql 会启动失败。本任务先创建两个空资源文件 `src/main/resources/schema.sql` 与 `src/main/resources/data.sql`（各含一行 SQL 注释 `-- placeholder`），Task 2 覆盖为真实内容。

- [ ] **Step 8: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add pom.xml src
git commit -m "feat: 初始化 Spring Boot 脚手架与统一响应体

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

