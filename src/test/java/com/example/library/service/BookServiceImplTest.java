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