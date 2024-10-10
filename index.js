const express = require('express'); 
const mysql = require('mysql2'); 
const app = express(); 
const port = 3000; 

const expressLayouts = require('express-ejs-layouts');

const multer = require('multer');
const path = require('path');

// Konfigurasi storage untuk multer
// Konfigurasi multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// Inisialisasi multer
const upload = multer({ storage: storage });

// Middleware untuk parsing body request (JSON)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

//Koneksi ke database MySQL 
const db = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'express_js'
}); 

db.connect(err => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
    } else {
      console.log('Connected to MySQL');
    }
});

//EJS View Engine
app.set('view engine', 'ejs');
app.set('views', './views'); // Atur folder views untuk template EJS
app.use(expressLayouts);
app.set('layout', 'layouts/main-layout');



// Route untuk tes koneksi 
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
  });
  

  app.get('/add-user', (req, res) => {
    res.render('add-user', { title: 'Add User' });
  });  
  

// GET all users 
app.get('/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.render('users', { title: 'User List', users: result });
    });
});
  

// CREATE a New User
app.post('/users', (req, res) => {
    const { name, email } = req.body; // Pastikan req.body.name dan req.body.email ada isinya
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
  
    const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
    db.query(sql, [name, email], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.redirect('/users');
    });
});
  

// GET user by ID
app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(result[0]);
    });
});

// UPDATE user by ID
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const sql = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
    db.query(sql, [name, email, id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'User updated' });
    });
});

//DELETE user by ID
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'User deleted' });
    });
});

// Route untuk menampilkan formulir penambahan artikel
app.get('/add-article', (req, res) => {
    res.render('add-article', { title: 'Add New Article' });
});

// Route untuk menyimpan artikel
app.post('/articles', upload.single('image_url'), (req, res) => {
    const { title, content } = req.body;
    const image = req.file.filename; // Mendapatkan nama file gambar

    if (!title || !content || !image) {
        return res.status(400).json({ error: 'Title, content, and image are required' });
    }

    const sql = 'INSERT INTO articles (title, content, image_url) VALUES (?, ?, ?)';
    db.query(sql, [title, content, image], (err, result) => { // Ganti image_url dengan image
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/articles'); // Redirect ke daftar artikel setelah berhasil ditambahkan
    });
});


// Route untuk menampilkan daftar artikel
app.get('/articles', (req, res) => {
    const sql = 'SELECT * FROM articles ORDER BY created_at DESC';
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.render('articles', { title: 'Articles List', articles: result, layout: 'layouts/blog-layout' }); // Menggunakan blog-layout
    });
});

// Route untuk menampilkan artikel berdasarkan ID
app.get('/articles/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM articles WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.render('article', { title: result[0].title, article: result[0] }); // image_url diharapkan ada di result[0]
    });
});

// Route untuk menghapus artikel berdasarkan ID
app.post('/articles/delete/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM articles WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/articles'); // Redirect ke daftar artikel setelah berhasil dihapus
    });
});

// Route untuk menampilkan formulir edit artikel
app.get('/articles/edit/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM articles WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.render('edit-article', { title: 'Edit Article', article: result[0] });
    });
});

// Route untuk memproses edit artikel
app.post('/articles/edit/:id', upload.single('image_url'), (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const image = req.file ? req.file.filename : null; // Mendapatkan nama file gambar jika diupload

    // Jika gambar diupload, update query dengan gambar baru
    let sql = 'UPDATE articles SET title = ?, content = ?';
    const values = [title, content];

    if (image) {
        sql += ', image_url = ?';
        values.push(image);
    }
    
    sql += ' WHERE id = ?';
    values.push(id);

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/articles'); // Redirect ke daftar artikel setelah berhasil diedit
    });
});

// Start Server 
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`); 
}); 