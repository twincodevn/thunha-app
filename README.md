# ThuNhà - Phần mềm quản lý nhà trọ

> Phần mềm quản lý nhà trọ thông minh dành cho chủ trọ Việt Nam. Tự động tính tiền điện nước theo bậc thang EVN, xuất hóa đơn, thu tiền online.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)

## 🚀 Tính năng

- **Quản lý tòa nhà & phòng** - Thêm nhiều tòa nhà, theo dõi tình trạng phòng
- **Quản lý khách thuê** - Lưu thông tin, CCCD, lịch sử thuê
- **Tính tiền điện tự động** - Áp dụng giá bậc thang EVN 2024
- **Xuất hóa đơn** - Tạo và gửi hóa đơn chuyên nghiệp
- **Thanh toán VNPay** - Thu tiền online qua nhiều ngân hàng
- **Phân tích doanh thu** - Báo cáo chi tiết cho gói Business

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 |
| UI | Tailwind CSS + shadcn/ui |
| Payment | VNPay |

## 📦 Cài đặt

### Yêu cầu
- Node.js 18+
- PostgreSQL 14+

### Bước 1: Clone repo
```bash
git clone https://github.com/your-username/thunha.git
cd thunha
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình môi trường
```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin database và VNPay
```

### Bước 4: Khởi tạo database
```bash
# Chạy PostgreSQL (Docker)
docker run -d --name thunha-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=thunha \
  -p 5432:5432 postgres:15-alpine

# Push schema
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### Bước 5: Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 🌐 Deploy lên Vercel

### Bước 1: Push code lên GitHub

### Bước 2: Tạo project trên Vercel
1. Import GitHub repo
2. Chọn Framework Preset: Next.js

### Bước 3: Cấu hình Environment Variables
```
DATABASE_URL=postgresql://...
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
VNPAY_TMN_CODE=your-merchant-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-domain.vercel.app/api/payments/vnpay/callback
```

### Bước 4: Deploy
Vercel sẽ tự động build và deploy mỗi khi bạn push code mới.

## 💳 Cấu hình VNPay

### Đăng ký tài khoản
1. Truy cập [VNPay Merchant](https://sandbox.vnpayment.vn)
2. Đăng ký tài khoản merchant
3. Lấy TMN_CODE và HASH_SECRET

### Sandbox Testing
- URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- Test cards: Xem tài liệu VNPay

## 💰 Bảng giá

| Gói | Giá | Số phòng | Tính năng |
|-----|-----|----------|-----------|
| Free | 0đ | 3 | Cơ bản |
| Basic | 99,000đ/tháng | 10 | + Nhắc nợ, PDF |
| Pro | 199,000đ/tháng | 30 | + VNPay, Báo cáo |
| Business | 299,000đ/tháng | ∞ | + Nhiều user, API |

## 📁 Cấu trúc thư mục

```
src/
├── app/
│   ├── (auth)/           # Login, Register
│   ├── (dashboard)/      # Dashboard routes
│   ├── api/              # API routes
│   └── page.tsx          # Landing page
├── components/
│   ├── dashboard/        # Sidebar, Header
│   ├── payment/          # VNPay button
│   ├── providers.tsx     # Session + Query providers
│   └── ui/               # shadcn components
└── lib/
    ├── auth.ts           # NextAuth config
    ├── billing.ts        # Electricity calculation
    ├── constants.ts      # Pricing, tiers
    ├── prisma.ts         # Prisma client
    ├── validators.ts     # Zod schemas
    └── vnpay.ts          # VNPay utility
```

## 📄 License

MIT License

## 🤝 Hỗ trợ

- Email: support@thunha.vn
- Hotline: 1900-xxx-xxx
