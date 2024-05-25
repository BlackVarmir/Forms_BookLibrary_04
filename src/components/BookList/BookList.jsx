import React from 'react';
import { Card, Button } from 'react-bootstrap';
import styles from './BookList.module.css';

const BookList = ({ books, deleteBook }) => {
  return (
    // <div className={styles.list}>
    //   {books.map((book) => (
    //     <div key={book.id || book._id} className={styles.book}>
    //       <h2>{book.title}</h2>
    //       <p>{book.author}</p>
    //       <button onClick={() => deleteBook(book.id || book._id)}>Видалити</button>
    //     </div>
    //   ))}
    // </div>
    <div className={styles.list}>
      {books.map((book) => (
        <Card key={book.id || book._id} className="mb-3">
          <Card.Body>
            <Card.Title>{book.title}</Card.Title>
            <Card.Text>{book.author}</Card.Text>
            <Button variant="danger" onClick={() => deleteBook(book.id || book._id)}>Видалити</Button>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default BookList;
