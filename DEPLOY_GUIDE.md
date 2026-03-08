# ⚔ Kiếm Hiệp Vô Song - Hướng Dẫn Deploy

## Kiến trúc hệ thống
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  ReactJS (FE)   │────▶│ Spring Boot (BE)  │────▶│   MongoDB   │
│  Vercel (free)  │     │ Railway (free)    │     │ Atlas (free)│
└─────────────────┘     └──────────────────┘     └─────────────┘
```

**Khả năng hỗ trợ ~10.000 users:**
- Vercel: CDN toàn cầu, auto-scale FE
- Railway: 512MB RAM, đủ cho ~1000 concurrent
- MongoDB Atlas M0: 512MB storage, 100 connections
- Nâng cấp lên Railway Hobby ($5/mo) khi cần

---

## BƯỚC 1 - MongoDB Atlas (Database)

1. Truy cập **https://www.mongodb.com/atlas**
2. Đăng ký tài khoản free → **Create Free Cluster (M0)**
3. Chọn region: **Singapore** (gần Việt Nam nhất)
4. Vào **Security > Database Access** → Add User:
   - Username: `kiemhiep_user`
   - Password: tạo mật khẩu mạnh (lưu lại!)
   - Role: `Read and Write to any database`
5. Vào **Security > Network Access** → Add IP: `0.0.0.0/0` (Allow all)
6. Vào **Database > Connect** → **Connect your application**
7. Copy connection string:
   ```
   mongodb+srv://kiemhiep_user:<password>@cluster0.xxxxx.mongodb.net/kiemhiep_blog
   ```

---

## BƯỚC 2 - Deploy Backend lên Railway

### 2.1 Chuẩn bị
```bash
# Push code lên GitHub trước
git init
git add .
git commit -m "Initial commit - Kiem Hiep Blog"
git remote add origin https://github.com/YOUR_USERNAME/kiem-hiep-blog.git
git push -u origin main
```

### 2.2 Deploy BE
1. Truy cập **https://railway.app** → Sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Chọn repo `kiem-hiep-blog` → chọn thư mục `/backend`
4. Railway tự detect Java + Maven, bắt đầu build

### 2.3 Cấu hình Environment Variables
Trong Railway dashboard → tab **Variables** → thêm:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://kiemhiep_user:PASSWORD@cluster0.xxx.mongodb.net/kiemhiep_blog` |
| `JWT_SECRET` | `KiemHiepVoSong2024SuperSecretKeyLongEnough` |
| `CORS_ORIGINS` | `https://kiem-hiep-blog.vercel.app,http://localhost:3000` |
| `PORT` | `8080` |

### 2.4 Lấy URL Backend
- Vào **Settings** → **Networking** → **Generate Domain**
- URL dạng: `https://kiem-hiep-blog-production.up.railway.app`
- **Lưu lại URL này!**

---

## BƯỚC 3 - Deploy Frontend lên Vercel

### 3.1 Chuẩn bị
Tạo file `/frontend/.env.production`:
```
REACT_APP_API_URL=https://kiem-hiep-blog-production.up.railway.app
```

### 3.2 Deploy FE
1. Truy cập **https://vercel.com** → Sign in with GitHub
2. Click **New Project** → Import repo `kiem-hiep-blog`
3. Cấu hình:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Vào **Environment Variables** → thêm:
   ```
   REACT_APP_API_URL = https://kiem-hiep-blog-production.up.railway.app
   ```
5. Click **Deploy** 🚀

### 3.3 Custom Domain (tuỳ chọn - miễn phí)
- Vercel cho phép dùng subdomain miễn phí: `kiem-hiep-blog.vercel.app`
- Hoặc kết nối domain riêng nếu có

---

## BƯỚC 4 - Cập nhật CORS sau khi có URL Vercel

Sau khi deploy, quay lại Railway → cập nhật:
```
CORS_ORIGINS = https://kiem-hiep-blog.vercel.app,http://localhost:3000
```

---

## BƯỚC 5 - Kiểm tra hệ thống

### Test thủ công
1. Mở `https://kiem-hiep-blog.vercel.app`
2. Kiểm tra categories hiển thị
3. Đăng ký tài khoản mới
4. Đăng nhập **admin / Admin@123456**
5. Vào `/admin` → phê duyệt tài khoản vừa tạo
6. Tạo topic mới, reply

### Test API trực tiếp
```bash
# Check health
curl https://your-backend.railway.app/api/categories

# Login
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123456"}'
```

---

## Tài khoản mặc định

| Vai trò | Username | Password |
|---------|----------|----------|
| Admin | `admin` | `Admin@123456` |

> ⚠️ **Đổi mật khẩu admin ngay sau khi deploy!**

---

## Cấu trúc dự án
```
kiem-hiep-blog/
├── backend/
│   ├── src/main/java/com/kiemhiep/
│   │   ├── controller/     # REST APIs
│   │   ├── model/          # MongoDB documents
│   │   ├── repository/     # Data access
│   │   ├── security/       # JWT, Auth
│   │   └── config/         # Spring config, data seeder
│   └── pom.xml
└── frontend/
    ├── src/
    │   ├── components/     # Shared components
    │   ├── pages/          # Route pages
    │   │   └── admin/      # Admin panel
    │   ├── context/        # React Context (Auth)
    │   ├── services/       # API calls
    │   └── styles/         # Global CSS
    └── package.json
```

---

## Tính năng đã implement

### User Flow
- ✅ Đăng ký tài khoản (tự động PENDING)
- ✅ Đăng nhập / Đăng xuất (JWT)
- ✅ Xem danh sách topic theo category
- ✅ Xem chi tiết topic + bình luận
- ✅ Tạo topic mới (khi đã APPROVED)
- ✅ Trả lời / tranh luận trong topic
- ✅ Trích dẫn bài viết (quote)
- ✅ Tìm kiếm topic

### Admin Flow
- ✅ Dashboard thống kê tổng quan
- ✅ Phê duyệt / từ chối tài khoản mới
- ✅ Cấm thành viên (ban)
- ✅ Phê duyệt / từ chối topic
- ✅ Ghim topic (pin), khóa topic, đánh dấu hot
- ✅ Quản lý danh mục (CRUD)

---

## Nâng cấp khi scale

| Khi nào | Giải pháp |
|---------|-----------|
| >1000 concurrent | Railway Hobby ($5/mo) |
| >512MB DB | MongoDB Atlas M2 ($9/mo) |
| Cần CDN hình ảnh | Cloudinary (free 25GB) |
| Real-time chat | Thêm WebSocket + Redis |
| >10.000 DAU | Railway Pro + MongoDB Dedicated |

---

## Troubleshooting

**Backend lỗi CORS:**
→ Kiểm tra `CORS_ORIGINS` có đúng URL Vercel không

**Frontend không connect BE:**
→ Kiểm tra `REACT_APP_API_URL` đúng URL Railway chưa

**MongoDB connection timeout:**
→ Kiểm tra Network Access đã Allow `0.0.0.0/0`

**Lỗi JWT:**
→ `JWT_SECRET` phải dài ít nhất 32 ký tự
