<div align="center">

# 💬 WhatsApp Clone - Real-Time Chat Application

<p>
  <a href="https://laravel.com" target="_blank"><img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel" alt="Laravel 12"></a>
  <a href="https://reactjs.org" target="_blank"><img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React 18"></a>
  <a href="https://www.typescriptlang.org" target="_blank"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript"></a>
  <a href="https://tailwindcss.com" target="_blank"><img src="https://img.shields.io/badge/Tailwind-3.2-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License"></a>
</p>

**Aplikasi Chat Real-Time Modern dengan Fitur Lengkap & Performa Tinggi**

[Fitur](#-fitur-utama) • [Tech Stack](#-tech-stack) • [Setup](#-instalasi--konfigurasi) • [Dokumentasi](#-dokumentasi) • [Kontribusi](#-kontribusi)

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [✨ Fitur Utama](#-fitur-utama)
- [🛠️ Tech Stack](#-tech-stack)
- [📦 Prasyarat](#-prasyarat)
- [🚀 Instalasi & Konfigurasi](#-instalasi--konfigurasi)
- [📁 Struktur Proyek](#-struktur-proyek)
- [🗄️ Database Schema](#-database-schema)
- [🔌 API Endpoints](#-api-endpoints)
- [⚡ Optimasi Performa](#-optimasi-performa)
- [🧪 Testing](#-testing)
- [📚 Dokumentasi](#-dokumentasi)
- [🤝 Kontribusi](#-kontribusi)
- [📄 Lisensi](#-lisensi)

---

## Tentang Proyek

**WhatsApp Clone** adalah aplikasi chat real-time yang meniru fitur dan desain WhatsApp Web. Dibangun dengan teknologi modern, aplikasi ini menampilkan arsitektur yang scalable, performa tinggi, dan user experience yang responsif.

Proyek ini menggunakan **Laravel 12** untuk backend API, **React 18** dengan **Inertia.js** untuk frontend, dan **Tailwind CSS** untuk styling yang elegan. Semua fitur dirancang untuk memberikan pengalaman pengguna yang seamless dengan optimasi database yang minimal N+1 queries.

---

## ✨ Fitur Utama

### 🗨️ Chat & Messaging
- **Percakapan 1-on-1** - Komunikasi langsung antar pengguna
- **Grup Chat** - Buat dan kelola grup dengan multiple members
- **Pesan Teks** - Kirim dan terima pesan dengan real-time delivery
- **Pesan Media** - Upload dan share file, gambar dengan batasan 50MB
- **Pesan Hilang** - Atur pesan untuk otomatis hilang setelah waktu tertentu
- **Pesan Terenkripsi** - End-to-end encryption untuk privasi maksimal
- **Typing Indicator** - Lihat ketika orang lain sedang mengetik
- **Delivery Status** - Indikator sent, delivered, dan read

### 👥 Manajemen Kontak
- **Search Kontak** - Cari pengguna dengan case-insensitive search (email, phone, name)
- **Pengguna di Sekitar** - Temukan pengguna terdekat menggunakan geolocation (Haversine formula)
- **Exact Email Match** - Pencarian email yang presisi dengan trim() otomatis
- **Profil Pengguna** - Lihat informasi lengkap kontak dengan last seen status
- **Block/Unblock Users** - Blokir pengguna yang tidak diinginkan
- **Blocking Privacy** - Pengguna terblokir tidak bisa melihat status online Anda

### 🔔 Notifikasi & Status
- **Online Status** - Lihat siapa yang sedang online (real-time presence)
- **Last Seen** - Informasi kapan terakhir kali pengguna online
- **Presence Channels** - Real-time update status online/offline via WebSocket (Laravel Reverb)
- **Web Notifications** - Browser notifications untuk pesan masuk
- **Sound Alerts** - Notifikasi audio saat ada pesan baru
- **Favicon Badge** - Indikator unread count di browser tab

### ⭐ Pesan Spesial
- **Starred Messages** - Tandai pesan penting untuk referensi cepat
- **Message Search** - Cari pesan dalam percakapan atau secara global
- **Message Edit** - Edit pesan yang sudah terkirim
- **Message Delete** - Hapus pesan untuk semua atau hanya Anda
- **Reaction Support** - Tambah emoji reactions pada pesan

### 👤 Profil & Pengaturan
- **Profil Pengguna** - Edit nama, bio, foto profil, nomor telepon
- **Avatar Upload** - Crop dan upload foto profil dengan preview
- **Privacy Settings** - Kontrol privasi last seen
- **Theme Selection** - Pilih dark/light/system theme
- **Two-Factor Auth** - Keamanan login dengan 2FA (optional)

### 🤖 AI Assistant
- **Meta AI Integration** - Chatbot AI powered untuk assistance
- **Smart Responses** - AI memberikan saran respons cerdas
- **Job Queue** - Background job processing untuk AI responses
- **Rate Limiting** - Proteksi dari spam dengan rate limiting

### 🎨 UI/UX Modern
- **Responsive Design** - Sempurna di desktop, tablet, dan mobile
- **Dark/Light Mode** - Tema yang dapat disesuaikan
- **Smooth Animations** - Animasi halus menggunakan Framer Motion
- **Loading States** - Skeleton loader dan loading indicators
- **Error Handling** - Error messages yang user-friendly
- **Real-time Updates** - Data update real-time tanpa refresh manual

---

## 🛠️ Tech Stack

### Backend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **Laravel** | 12 | Framework PHP modern dengan Eloquent ORM |
| **PHP** | 8.2+ | Server-side language |
| **PostgreSQL** | 14+ | Database relational yang powerful |
| **Laravel Reverb** | 1.0 | WebSocket server untuk real-time features |
| **Laravel Sanctum** | 4.0 | API authentication dengan token |
| **Intervention Image** | 3.0 | Image processing dan manipulation |

### Frontend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **React** | 18 | UI library dengan component-based approach |
| **TypeScript** | 5.0 | Type-safe JavaScript development |
| **Inertia.js** | 2.0 | Adapter antara Laravel & React |
| **Tailwind CSS** | 3.2 | Utility-first CSS framework |
| **Framer Motion** | 12 | Animation library untuk smooth UX |
| **Vite** | 7 | Lightning-fast build tool |

### Tools & Libraries
- **Laravel Echo React** - Real-time event broadcasting
- **Axios** - HTTP client untuk API requests
- **CryptoJS** - Client-side encryption
- **DOMPurify** - XSS protection untuk user content
- **Lucide React** - Icon library yang modern
- **Vitest** - Unit testing framework
- **Pest PHP** - PHP testing framework

---

## 📦 Prasyarat

Pastikan Anda sudah menginstall:

- **PHP 8.2 or higher** - [Download](https://www.php.net/downloads)
- **Composer** - [Download](https://getcomposer.org)
- **Node.js 18+ & npm** - [Download](https://nodejs.org)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org)
- **Git** - [Download](https://git-scm.com)

### Opsional untuk Fitur Real-Time:
- **Redis** - Untuk caching dan queue
- **Laravel Reverb** - Untuk WebSocket server

---

## 🚀 Instalasi & Konfigurasi

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Setup Backend (Laravel)

```bash
# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database di .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=whatsapp_clone
# DB_USERNAME=postgres
# DB_PASSWORD=yourpassword

# Jalankan migrations & seeders
php artisan migrate --seed

# Storage link untuk file uploads
php artisan storage:link
```

### 3. Setup Frontend (React + Vite)

```bash
# Install Node dependencies
npm install

# Setup development server (run di terminal terpisah)
npm run dev

# Untuk production build
npm run build
```

### 4. Jalankan Aplikasi

```bash
# Terminal 1: Laravel development server
php artisan serve
# Aplikasi akan berjalan di http://localhost:8000

# Terminal 2: Vite dev server
npm run dev
# Frontend akan di-compile di http://localhost:5173

# Terminal 3 (Opsional): Laravel Reverb untuk real-time
php artisan reverb:start
```

### 5. Akses Aplikasi

Buka browser dan navigasi ke `http://localhost:8000`

```
📧 Email Default: user@example.com
🔐 Password: password
```

---

## 📁 Struktur Proyek

```
whatsapp-clone/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── ChatController.php       # Controller untuk chat & messaging
│   │   │   ├── ContactController.php    # Controller untuk manajemen kontak
│   │   │   ├── NearbyUserController.php # Controller untuk geolocation
│   │   │   └── MetaAIController.php     # Controller untuk AI assistant
│   │   ├── Middleware/                  # Custom middleware
│   │   └── Resources/                   # API resources untuk data transformation
│   ├── Models/
│   │   ├── User.php                     # Model User dengan relationships
│   │   ├── Conversation.php             # Model untuk chat conversations
│   │   ├── Message.php                  # Model untuk individual messages
│   │   └── MessageAttachment.php        # Model untuk file attachments
│   ├── Events/                          # Broadcasting events untuk real-time
│   ├── Jobs/                            # Queue jobs untuk background tasks
│   └── Services/                        # Business logic services
│
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   │   ├── Chat/
│   │   │   │   ├── Index.tsx           # Chat list page (main layout)
│   │   │   │   └── Show.tsx            # Active conversation page
│   │   │   ├── Contacts/
│   │   │   │   ├── Add.tsx             # Add contact modal page
│   │   │   │   └── AddContact.tsx      # Advanced contact search & nearby
│   │   │   └── Auth/                    # Authentication pages
│   │   ├── Components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatWindow.tsx      # Main chat message area
│   │   │   │   ├── ConversationSidebar.tsx # List conversations
│   │   │   │   ├── AddContactModal.tsx # Add contact with geolocation
│   │   │   │   └── WelcomeScreen.tsx   # Welcome screen
│   │   │   └── Common/                  # Reusable components
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── utils/                       # Utility functions
│   │   └── types/                       # TypeScript type definitions
│   └── css/
│       ├── app.css                      # Global styles
│       └── tailwind.css                 # Tailwind configuration
│
├── routes/
│   ├── web.php                          # Web routes (Inertia pages)
│   ├── api.php                          # API routes (JSON endpoints)
│   └── channels.php                     # Broadcasting channels
│
├── database/
│   ├── migrations/                      # Database migrations
│   ├── factories/                       # Model factories untuk testing
│   └── seeders/                         # Database seeders
│
├── tests/
│   ├── Unit/                            # Unit tests
│   └── Feature/                         # Feature/integration tests
│
└── public/                              # Public files & uploads

```

---

## 🗄️ Database Schema

### User Table
```
users
├── id (PK)
├── name              # Nama pengguna
├── email             # Email unik untuk login
├── phone             # Nomor telepon opsional
├── avatar            # URL foto profil
├── bio               # Bio pengguna
├── password          # Hash password
├── last_seen         # Timestamp kapan terakhir online
├── latitude          # Koordinat untuk nearby users feature
├── longitude         # Koordinat untuk nearby users feature
├── location_updated_at # Timestamp update lokasi
├── theme             # Preferensi tema (dark/light/system)
├── last_seen_privacy # Privacy setting untuk last seen
└── timestamps
```

### Conversation Table
```
conversations
├── id (PK)
├── name              # Nama grup (NULL untuk 1-on-1)
├── is_group          # Boolean apakah grup atau direct
├── avatar            # Avatar grup
├── description       # Deskripsi grup
├── created_by        # User ID yang membuat grup
├── admin_id          # Admin grup (untuk permissions)
└── timestamps
```

### Message Table
```
messages
├── id (PK)
├── conversation_id (FK)
├── user_id (FK)      # User yang mengirim
├── body              # Isi pesan
├── type              # text | image | file
├── encrypted_body    # Pesan terenkripsi (optional)
├── is_encrypted      # Boolean status enkripsi
├── is_ephemeral      # Boolean untuk disappearing message
├── file_path         # Path file jika ada attachment
├── file_size         # Ukuran file
├── mime_type         # MIME type file
├── read_at           # Timestamp ketika dibaca
├── edited_at         # Timestamp ketika diedit
├── deleted_at        # Soft delete timestamp
└── timestamps
```

### Conversation_User Pivot Table
```
conversation_user
├── conversation_id (FK)
├── user_id (FK)
├── role              # admin | member
├── is_muted          # Mute notifikasi grup
├── is_pinned         # Pin conversation di sidebar
├── joined_at         # Timestamp join
├── last_read_message_id # Track unread messages
└── timestamps
```

### MessageAttachment Table
```
message_attachments
├── id (PK)
├── message_id (FK)
├── user_id (FK)      # User uploader
├── file_name         # Nama original file
├── path              # Path di storage
├── mime_type         # MIME type
├── type              # image | file | video
├── size              # File size in bytes
└── timestamps
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/login              # Login dengan email & password
POST   /api/register           # Register akun baru
POST   /api/logout             # Logout
POST   /api/refresh-token      # Refresh access token
```

### Chat & Messages
```
GET    /api/conversations      # List semua conversations
GET    /api/conversations/{id} # Detail conversation & messages
POST   /api/conversations/{id}/messages          # Kirim pesan
PUT    /api/messages/{id}      # Edit pesan
DELETE /api/messages/{id}      # Hapus pesan
GET    /api/messages/starred   # Get starred messages
POST   /api/messages/{id}/star # Toggle star message
GET    /api/search             # Global search conversations & messages
```

### Contacts & User Search
```
GET    /api/users              # List semua pengguna (non-blocked)
GET    /api/users/search       # Search users (fuzzy matching)
POST   /api/users/find-by-email       # Cari user by exact email
POST   /api/users/nearby       # Nearby users via geolocation
PUT    /api/user/location      # Update user location coordinates
```

### Groups
```
POST   /api/groups             # Buat grup baru
POST   /api/conversations/{id}/members # Add member ke grup
DELETE /api/conversations/{id}/members/{userId} # Remove member
PUT    /api/conversations/{id} # Update group info
```

### User Management
```
GET    /api/user               # Get current user profile
PUT    /api/user/settings      # Update user settings
POST   /api/users/{id}/block   # Block user
POST   /api/users/{id}/unblock # Unblock user
GET    /api/users/blocked      # List blocked users
```

### Presence & Status
```
GET    /api/users/{id}/is-blocked     # Check if user blocked
GET    /api/user/theme                # Get user theme preference
PUT    /api/user/theme                # Update theme preference
```

---

## ⚡ Optimasi Performa

### Database Optimization

#### 1. **Eager Loading Strategy**
```php
// Prevent N+1 queries dengan eager loading
$conversations = $user->conversations()
    ->with([
        'lastMessage.user:id,name,avatar',
        'users:id,name,avatar,phone,bio',
    ])
    ->withCount(['messages as unreadMessages' => function ($query) use ($user) {
        $query->where('user_id', '!=', $user->id)->whereNull('read_at');
    }])
    ->get();
```

#### 2. **Composite Indexes**
```sql
-- Message pagination
CREATE INDEX idx_message_conversation_created 
ON messages(conversation_id, created_at);

-- Search optimization
CREATE INDEX idx_user_email_lower 
ON users USING gin(lower(email));
```

#### 3. **Selective Column Loading**
```php
// Hanya select field yang dibutuhkan
User::select('id', 'name', 'avatar', 'email')->get();
```

### Caching Strategy

#### 1. **Redis Cache untuk Online Status**
```php
// Cache user online status selama 5 menit
cache()->put("user.{$userId}.online", true, now()->addMinutes(5));
```

#### 2. **Query Result Caching**
```php
// Cache conversation list selama 1 jam
$conversations = cache()->remember("conversations.{$userId}", 
    now()->addHour(), 
    fn() => $user->conversations()->with(['users', 'lastMessage'])->get()
);
```

### Frontend Optimization

#### 1. **Code Splitting**
- Lazy loading pages dengan React.lazy()
- Dynamic imports untuk heavy components

#### 2. **Memoization**
```typescript
const memoizedConversations = useMemo(() => 
    conversations.filter(c => c.name.includes(search)),
    [conversations, search]
);
```

#### 3. **Pagination**
- Messages: 50 per page
- Search results: 20 per page
- User list: 20 per page

---

## 🧪 Testing

### Run Tests
```bash
# PHP Unit Tests (Pest)
php artisan test

# TypeScript/React Tests (Vitest)
npm run test

# Coverage Report
npm run test:coverage

# Watch Mode
npm run test:watch
```

### Test Structure
```
tests/
├── Unit/
│   ├── Models/
│   └── Services/
└── Feature/
    ├── Auth/
    ├── Chat/
    └── Contacts/
```

---

## 📚 Dokumentasi

### API Documentation
Dokumentasi API lengkap tersedia di:
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Fix N+1 queries & optimization
- [CODEBASE_REVIEW.md](CODEBASE_REVIEW.md) - Detailed code review
- [TEST_COMPLETION_REPORT.md](TEST_COMPLETION_REPORT.md) - Test coverage report

### Guides
- [Setup Guide](docs/SETUP.md) - Panduan setup lengkap
- [Architecture](docs/ARCHITECTURE.md) - Arsitektur aplikasi
- [Contributing](CONTRIBUTING.md) - Kontribusi guidelines

---

## 🚀 Fitur Coming Soon

- [ ] Video Call Integration (via Jitsi)
- [ ] Voice Messages
- [ ] Message Reactions Customization
- [ ] Chat Backup & Export
- [ ] Message Forwarding
- [ ] Channel Broadcast
- [ ] Mobile App (React Native)
- [ ] Dark Mode Refinements

---

## 🤝 Kontribusi

Kami menerima kontribusi dari siapa saja! Silakan ikuti langkah berikut:

1. **Fork** repository ini
2. **Create feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push ke branch** (`git push origin feature/AmazingFeature`)
5. **Buka Pull Request**

### Development Guidelines
- Ikuti [PSR-12](https://www.php-fig.org/psr/psr-12/) untuk PHP code style
- Gunakan TypeScript untuk semua React components
- Tulis unit tests untuk features baru
- Update documentation jika diperlukan

---

## 🐛 Bug Reports

Temukan bug? Buka [GitHub Issue](https://github.com/yourusername/whatsapp-clone/issues) dengan:
- Deskripsi jelas tentang bug
- Steps untuk reproduce
- Expected vs actual behavior
- Screenshots/videos jika applicable

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file LICENSE untuk detail.

---

## 👨‍💼 Author & Credits

Dibuat dengan ❤️ oleh Dery Supriyadi (Dryex)

### Tech Stack Credits
- [Laravel](https://laravel.com) - Backend framework
- [React](https://react.dev) - Frontend library
- [Inertia.js](https://inertiajs.com) - Backend-frontend bridge
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

<div align="center">

### ⭐ Jika proyek ini membantu, jangan lupa kasih star!

**[⬆ Back to Top](#-whatsapp-clone---real-time-chat-application)**

</div>
