import React, { useState, useEffect } from 'react';
import styles from './Modal.module.css';
import { Modal as BootstrapModal, Button, Form } from 'react-bootstrap';

const Modal = ({ onClose, addBook }) => {
  const [bookName, setBookName] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookSlug, setBookSlug] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const generateSlug = () => {
      const slugifiedTitle = bookName.toLowerCase().replace(/\s+/g, '-');
      setBookSlug(slugifiedTitle);
    };
    generateSlug();
  }, [bookName]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (bookName.trim() === '' || bookAuthor.trim() === '') {
      alert('Усі поля мають бути заповнені');
      return;
    }
  
    const bookData = {
      title: bookName,
      author: bookAuthor,
      slug: bookSlug,
    };
  
    try {
      const response = await fetch('http://localhost:5000/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message);
      }
  
      onClose();
      addBook(data);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <BootstrapModal show={true} onHide={onClose}>
      <BootstrapModal.Header closeButton>
        <BootstrapModal.Title>Додати нову книгу</BootstrapModal.Title>
      </BootstrapModal.Header>
      <BootstrapModal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="bookName">
            <Form.Label>Назва книги</Form.Label>
            <Form.Control
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="Назва книги"
            />
          </Form.Group>
          <Form.Group controlId="bookAuthor">
            <Form.Label>Автор</Form.Label>
            <Form.Control
              type="text"
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
              placeholder="Автор"
            />
          </Form.Group>
          <Form.Group controlId="bookSlug">
            <Form.Label>Slug</Form.Label>
            <Form.Control
              type="text"
              value={bookSlug}
              placeholder="Slug"
              readOnly
            />
          </Form.Group>
          <Button type="submit" className="mt-3">Додати книгу</Button>
        </Form>
        {error && <p className={styles.error}>{error}</p>}
      </BootstrapModal.Body>
    </BootstrapModal>
  );
};

export default Modal;