import React, { useState, useEffect } from 'react';
import BookList from '../BookList/BookList';
import Modal from '../Modal/Modal';
import { Container, Row, Col, Button, InputGroup, FormControl, Form } from 'react-bootstrap';
import styles from './BookLibrary.module.css';

const BookLibrary = () => {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('title');
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 5;

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const response = await fetch('http://localhost:5000/books');
    const data = await response.json();
    setBooks(data);
  };

  const addBook = async (book) => {
    const response = await fetch('http://localhost:5000/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(book),
    });
    const newBook = await response.json();
    setBooks((prevBooks) => {
      const bookExists = prevBooks.find(
        (b) => b.title === newBook.title && b.author === newBook.author
      );
      if (bookExists) {
        return prevBooks;
      }
      return [...prevBooks, newBook];
    });
  };

  const deleteBook = async (id) => {
    await fetch(`http://localhost:5000/books/${id}`, {
      method: 'DELETE',
    });
    setBooks(books.filter((book) => book.id !== id));
  };

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedBooks = filteredBooks.sort((a, b) => {
    if (sort === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sort === 'author') {
      return a.author.localeCompare(b.author);
    }
  });

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = sortedBooks.slice(indexOfFirstBook, indexOfLastBook);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <Container className={styles.library}>
      <Row style={{flexWrap: 'nowrap'}}>
        <Col md={4} /*{style={{ flex: '0 0 auto' }}}*/ className={styles.fixedCol}>
          <h1>Бібліотека книг</h1>
          <Button onClick={toggleModal} className={styles.button}>Додати книгу</Button>
          {showModal && (
            <Modal onClose={toggleModal} addBook={addBook} />
          )}
          <br />
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Фільтрувати книги"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </InputGroup>
          <Form.Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="title">Сортувати по назві</option>
            <option value="author">Сортувати по автору</option>
          </Form.Select>
        </Col>
        <Col md={8}>
          <div className={styles.listContainer}>
            <BookList books={currentBooks} deleteBook={deleteBook} />
          </div>
          <nav>
            <ul className="pagination">
              {Array.from({ length: Math.ceil(sortedBooks.length / booksPerPage) }, (_, index) => (
                <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                  <button onClick={() => paginate(index + 1)} className="page-link">
                    {index + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </Col>
      </Row>
    </Container>
  );
};

export default BookLibrary;