require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sql } = require('@vercel/postgres');
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

// Database Setup (Vercel Postgres - Table Setup)
async function setupDatabase() {
    try {
        await sql`CREATE TABLE IF NOT EXISTS contacts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        console.log("Postgres database ready.");
    } catch (err) {
        console.error("Database setup error:", err.message);
    }
}
setupDatabase();

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

    // Insert into database using Vercel Postgres
    sql`
        INSERT INTO contacts (name, email, phone, message)
        VALUES (${name}, ${email}, ${phone}, ${message})
        RETURNING id
    `
        .then(result => {
            const dbId = result.rows[0].id;

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
        })
        .catch(err => {
            console.error('Error saving to database:', err.message);
            return res.status(500).json({ error: 'Failed to save message to database.' });
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
    sql`SELECT * FROM contacts ORDER BY created_at DESC`
        .then(result => {
            const contacts = result.rows;

            res.status(200).json({
                count: contacts.length,
                data: contacts
            });
        })
        .catch(err => {
            console.error('Error fetching contacts:', err.message);
            return res.status(500).json({ error: 'Failed to fetch contacts.' });
        });
});

// 3. Delete a contact (Admin endpoint)
app.delete('/api/contacts/:id', checkAdminPassword, (req, res) => {
    const id = req.params.id;
    
    sql`DELETE FROM contacts WHERE id = ${id} RETURNING id`
        .then(result => {
            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Contact not found.' });
            }
            res.status(200).json({ success: true, message: 'Contact deleted successfully.' });
        })
        .catch(err => {
            console.error('Error deleting contact:', err.message);
            return res.status(500).json({ error: 'Failed to delete contact.' });
        });
});

// Admin Panel Route
app.get('/secure-portal-access', (req, res) => {
    res.sendFile('secure-portal-access.html', { root: path.join(__dirname, 'public') }, (err) => {
        if (err) {
             res.status(404).send("Secure portal page not found. Make sure secure-portal-access.html exists.");
        }
    });
});

// Fallback to 404.html for undefined routes
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.status(404).sendFile('404.html', { root: path.join(__dirname, 'public') }, (err) => {
            if (err) {
                console.error(`[Error] Failed to send 404.html:`, err);
                res.status(404).send("Page not found.");
            }
        });
    } else {
        res.status(404).json({ error: "API route not found." });
    }
});

// Start the server (Only if not running in serverless mode like Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export the Express API so Vercel can find it
module.exports = app;
