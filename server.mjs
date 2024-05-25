import express from 'express';
import mongoose from 'mongoose';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Подключение к SQLite
const sqliteDbPromise = open({
  filename: './database.sqlite',
  driver: sqlite3.Database,
});

const initializeSqliteDatabase = async () => {
  const db = await sqliteDbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL
    );
  `);
};

// Модель для MongoDB
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
});
const Book = mongoose.model('Book', bookSchema);

// Функция для проверки подключения к MongoDB
const checkMongoConnection = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/booklibrary', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    return true;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    return false;
  }
};

// Синхронизация данных между MongoDB и SQLite
const syncData = async () => {
  const useMongo = await checkMongoConnection();

  if (!useMongo) {
    console.log('MongoDB is not available. Falling back to SQLite.');
    return;
  }

  const db = await sqliteDbPromise;
  const books = await db.all('SELECT * FROM books');

  // Создаем записи в SQLite на основе данных из MongoDB
  const mongoBooks = await Book.find();
  for (const mongoBook of mongoBooks) {
    const { title, author } = mongoBook;
    const book = await db.get('SELECT * FROM books WHERE title = ? AND author = ?', [title, author]);

    if (!book) {
      const result = await db.run('INSERT INTO books (title, author) VALUES (?, ?)', [title, author]);
    }
  }

  // Создаем записи в MongoDB на основе данных из SQLite
  for (const book of books) {
    const { title, author } = book;
    let mongoBook = await Book.findOne({ title, author });

    if (!mongoBook) {
      mongoBook = new Book({ title, author });
      await mongoBook.save();
    }
  }
};

// Маршруты для MongoDB
const mongoRoutes = (app) => {
  app.post('/books', async (req, res) => {
    const { title, author } = req.body;
    let book = await Book.findOne({ title, author });

    if (!book) {
      book = new Book({ title, author });
      await book.save();
      res.status(201).json(book);
    } else {
      res.status(200).json(book);
    }
  });

  app.get('/books', async (req, res) => {
    const books = await Book.find();
    res.status(200).json(books);
  });

  app.put('/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author } = req.body;

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { title, author },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json(updatedBook);
  });

  app.delete('/books/:id', async (req, res) => {
    const { id } = req.params;
    await Book.findByIdAndDelete(id);
    res.status(204).send();
  });
};

// Маршруты для SQLite
const sqliteRoutes = (app) => {
  app.post('/books', async (req, res) => {
    const { title, author } = req.body;
    const db = await sqliteDbPromise;
    const book = await db.get('SELECT * FROM books WHERE title = ? AND author = ?', [title, author]);

    if (!book) {
      const result = await db.run('INSERT INTO books (title, author) VALUES (?, ?)', [title, author]);
      const newBook = await db.get('SELECT * FROM books WHERE id = ?', [result.lastID]);
      res.status(201).json(newBook);
    } else {
      res.status(200).json(book);
    }
  });

  app.get('/books', async (req, res) => {
    const db = await sqliteDbPromise;
    const books = await db.all('SELECT * FROM books');
    res.status(200).json(books);
  });

  app.put('/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author } = req.body;
    const db = await sqliteDbPromise;

    const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await db.run('UPDATE books SET title = ?, author = ? WHERE id = ?', [title, author, id]);
    const updatedBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);

    res.status(200).json(updatedBook);
  });

  app.delete('/books/:id', async (req, res) => {
    const { id } = req.params;
    const db = await sqliteDbPromise;
    await db.run('DELETE FROM books WHERE id = ?', [id]);
    res.status(204).send();
  });
};

// Инициализация
const startServer = async () => {
  const useMongo = await checkMongoConnection();

  if (useMongo) {
    console.log('Using MongoDB');
    mongoRoutes(app);
  } else {
    console.log('Using SQLite');
    await initializeSqliteDatabase();
    sqliteRoutes(app);
  }

  // Синхронизация данных при запуске сервера
  await syncData();

  const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  
   // Синхронизация данных при остановке сервера
   process.on('beforeExit', async () => {
    await syncData();
    console.log('Данные синхронизированы перед остановкой сервера');
  });

  process.on('SIGINT', () => {
    server.close(() => {
      console.log('Сервер остановлен');
      process.exit();
    });
  });
};

startServer();