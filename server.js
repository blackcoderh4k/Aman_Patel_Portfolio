require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Email Setup (Nodemailer)
// Note: You need to set these in a .env file
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// API Routes

// 1. Handle Contact Form Submission
app.post('/api/contact', (req, res) => {
    const { name, email, phone, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required field.' });
    }

    // Insert into database
    const sql = `INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name, email, phone, message], function(err) {
        if (err) {
            console.error('Error inserting into database:', err.message);
            return res.status(500).json({ error: 'Failed to save message to database.' });
        }

        const dbId = this.lastID;

        // Try to send email
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: 'patelaman10052005@gmail.com', // Receiver address (Aman's email)
            subject: `New Portfolio Contact from ${name}`,
            text: `
You have received a new message from your portfolio website!

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}

Message:
${message}
            `,
            html: `
<h3>New Portfolio Contact</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
            `
        };

        if(process.env.EMAIL_USER && process.env.EMAIL_PASS) {
             transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    // We still return success because it was saved to DB, but indicate email failed
                    return res.status(200).json({ 
                        success: true, 
                        message: 'Message saved to database, but failed to send email.',
                        id: dbId 
                    });
                }
                console.log('Email sent: ' + info.response);
                res.status(200).json({ 
                    success: true, 
                    message: 'Message sent and saved successfully!',
                    id: dbId 
                });
            });
        } else {
             console.log("Email credentials not configured. Saving to DB only.");
             res.status(200).json({ 
                success: true, 
                message: 'Message saved to database successfully! (Email not configured)',
                id: dbId 
            });
        }
    });
});

// Quick basic auth middleware for admin routes
const checkAdminPassword = (req, res, next) => {
    const password = req.headers['x-admin-password'];
    // Using environment variable or simple fallback
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (!password || password !== expectedPassword) {
        return res.status(401).json({ error: 'Unauthorized. Invalid password.' });
    }
    next();
};

// 2. Get all contacts (Admin endpoint)
app.get('/api/contacts', checkAdminPassword, (req, res) => {
    const sql = `SELECT * FROM contacts ORDER BY created_at DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching contacts:', err.message);
            return res.status(500).json({ error: 'Failed to fetch contacts.' });
        }
        res.status(200).json({
            count: rows.length,
            data: rows
        });
    });
});

// 3. Delete a contact (Admin endpoint)
app.delete('/api/contacts/:id', checkAdminPassword, (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM contacts WHERE id = ?`;
    
    db.run(sql, id, function(err) {
        if (err) {
            console.error('Error deleting contact:', err.message);
            return res.status(500).json({ error: 'Failed to delete contact.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Contact not found.' });
        }
        res.status(200).json({ success: true, message: 'Contact deleted successfully.' });
    });
});

// Admin Panel Route
app.get('/admin', (req, res) => {
    res.sendFile('admin.html', { root: path.join(__dirname, 'public') }, (err) => {
        if (err) {
             res.status(404).send("Admin page not found. Make sure admin.html exists.");
        }
    });
});

// Fallback to index.html for undefined routes (SPA behavior if needed)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile('index.html', { root: path.join(__dirname, 'public') }, (err) => {
            if (err) {
                console.error(`[Error] Failed to send index.html:`, err);
                next(err);
            }
        });
    } else {
        next();
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
