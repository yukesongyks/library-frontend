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