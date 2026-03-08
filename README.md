# ⚔ Kiếm Hiệp Vô Song

Diễn đàn bàn luận kiếm hiệp - tiên hiệp phong cách VOZ Forum.

## Tech Stack
- **Backend**: Java 17 + Spring Boot 3.2 + Spring Security + JWT
- **Database**: MongoDB
- **Frontend**: ReactJS 18 + React Router + Axios
- **Deploy**: Railway (BE) + Vercel (FE) + MongoDB Atlas

## Chạy local

### Yêu cầu
- Java 17+
- Node.js 18+
- MongoDB (hoặc dùng Docker)

### Backend
```bash
cd backend
mvn spring-boot:run
# API chạy tại http://localhost:8080
# Admin mặc định: admin / Admin@123456
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
# Sửa REACT_APP_API_URL=http://localhost:8080
npm install
npm start
# App chạy tại http://localhost:3000
```

### Docker (full stack)
```bash
docker-compose up -d
# MongoDB: localhost:27017
# Backend: localhost:8080
```

## Deploy lên internet
Xem file **DEPLOY_GUIDE.md** để hướng dẫn chi tiết deploy miễn phí.

## Tính năng
- Đăng ký/đăng nhập với JWT
- Phân quyền: Admin, Member
- Admin phê duyệt tài khoản và bài đăng
- Tạo topic, bình luận, trích dẫn
- Tìm kiếm, phân trang
- Ghim/khóa/hot topic
- 8 danh mục mặc định (kiếm hiệp, tiên hiệp...)
