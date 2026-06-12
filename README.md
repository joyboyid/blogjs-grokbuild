# BlogJS

A clean, modern, and complete blog application built with **Node.js + Express.js + MariaDB + EJS + Bootstrap 5**.

## Features

- Full authentication (Register / Login / Logout)
- Protected admin routes (only logged-in admins can create, edit, delete)
- Complete CRUD for Posts and Categories
- Featured image uploads (Multer)
- Rich text editor powered by **Quill.js** (free CDN, no API key)
- Public pages: Home with pagination, Post detail, Category filter
- SEO-friendly URLs using slugs
- Flash messages + clean error handling
- Fully responsive (Bootstrap 5)
- `.env` configuration

## Tech Stack

- Node.js + Express.js
- MariaDB (via `mysql2` with Promises)
- EJS templates
- express-session + express-mysql-session (MariaDB session store)
- bcryptjs (password hashing)
- express-validator
- Multer (file uploads)
- Bootstrap 5 + Quill.js (free rich text editor)

## Folder Structure

```
blogjs/
├── config/
│   └── db.js                 # MariaDB pool connection
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── categoryController.js
│   └── postController.js
├── middleware/
│   ├── auth.js               # requireLogin, redirectIfAuthenticated
│   └── flash.js
├── models/
│   ├── Category.js
│   ├── Post.js
│   └── User.js
├── public/
│   ├── css/style.css
│   ├── js/main.js
│   └── uploads/              # featured images go here
├── routes/
│   ├── adminRoutes.js        # protected
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   ├── postRoutes.js
│   └── publicRoutes.js
├── views/
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   ├── categories.ejs
│   │   ├── category-form.ejs
│   │   ├── post-form.ejs
│   │   └── posts.ejs
│   ├── pages/
│   │   ├── 404.ejs
│   │   ├── error.ejs
│   │   ├── home.ejs
│   │   ├── login.ejs
│   │   ├── post-detail.ejs
│   │   └── register.ejs
│   ├── partials/
│   │   ├── flash.ejs
│   │   ├── footer.ejs
│   │   └── navbar.ejs
│   └── layout.ejs            # base (not heavily used)
├── .env.example
├── database.sql
├── package.json
├── server.js
└── README.md
```

## Installation & Running (Step by Step)

### 1. Prerequisites

- Node.js ≥ 18
- MariaDB server running (local or remote)
- Git (optional)

### 2. Clone / Download

```bash
cd /home/shiroe/project/grok-app/blogjs
```

### 3. Install dependencies

```bash
npm install
```

### 4. Setup the Database

1. Make sure MariaDB is running.
2. Create the database (or let the script do it):

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS db_blogjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

3. Import the schema:

```bash
mysql -u root -p db_blogjs < database.sql
```

> A default admin user is seeded: `admin@blogjs.local` / `admin123` (disarankan buat akun baru lewat register)

### 5. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your MariaDB credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=db_blogjs
SESSION_SECRET=put_a_long_random_string_here
```

### 6. Run the Application

Development (with auto-reload):

```bash
npm run dev
```

Production:

```bash
npm start
```

Visit: **http://localhost:3000**

### 7. Login to Admin

- Go to http://localhost:3000/auth/login
- Email: `admin@blogjs.local`
- Password: `admin123`

**PENTING**: Segera ganti password setelah login pertama!

**Rekomendasi lebih aman**: Buka http://localhost:3000/auth/register dan daftarkan akun admin baru sendiri (tidak perlu pakai yang default). Setelah itu kamu bisa hapus user default di database jika mau.

---

## How to Use

### Public

- `/` — Latest posts + pagination + category sidebar
- `/post/:slug` — Full article (SEO friendly)
- `/category/:slug` — Filter posts by category

### Admin (after login)

- `/admin/dashboard` — Overview + quick stats
- `/admin/posts` — List + Create/Edit/Delete posts
- `/admin/categories` — Manage categories

When creating/editing a post:
- Use the rich **Quill.js** editor for beautiful HTML content (free, no registration)
- Upload a featured image (optional)
- Choose category and add tags (comma separated)

---

## Important Notes

- Session data is stored in MariaDB (`sessions` table)
- Featured images are stored in `/public/uploads`
- Slugs are auto-generated using `slugify` (you can also enter custom ones)
- All forms are validated with `express-validator`
- Passwords are hashed with bcryptjs (cost 10)

## Production Recommendations

1. Set `NODE_ENV=production`
2. Use a strong `SESSION_SECRET`
3. Put uploads behind authentication or use a CDN/object storage
4. Add rate limiting and helmet.js
5. Use PM2 or similar process manager
6. Regularly backup your MariaDB database

---

## License

MIT — Feel free to use and modify for your own projects.

Enjoy blogging with BlogJS!
