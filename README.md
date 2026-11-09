# BrightChamps Warehouse

Website quản lý vật tư theo 5 hub: D7, D10, BT, TP và GV. Hệ thống gồm React, NestJS và PostgreSQL, được cấu hình để chạy trên gói miễn phí của Render và Neon.

## Chức năng

- Đăng ký bằng email có domain chính xác `@team.brightchamps.com`.
- Tài khoản mới ở trạng thái chờ admin duyệt.
- Phân quyền Admin, Staff và Viewer.
- Danh mục 45 vật tư khởi tạo từ workbook nguồn.
- Tồn kho riêng cho từng hub.
- Nhập kho, xuất kho và menu Chuyển Hub gồm hai luồng riêng: chuyển vật tư, chuyển KIT.
- Tính số KIT1/KIT2 tối đa theo tồn thực của từng hub.
- Theo dõi số KIT1/KIT2 có thể xuất thêm theo tồn hiện tại và tổng số KIT đã xuất tại từng hub.
- Phiếu xuất hoặc chuyển KIT tự bung định mức và từ chối toàn bộ nếu thiếu tồn.
- Chặn xuất vượt tồn.
- Lịch sử giao dịch và xuất CSV.
- Không lưu hình ảnh hoặc file đính kèm.

## Cấu trúc

```text
apps/api   NestJS + Prisma
apps/web   React + Vite
render.yaml
```

## Chạy local

Yêu cầu Node.js 20 và một PostgreSQL database.

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run prisma:generate --workspace @brightchamps/api
npm run prisma:migrate --workspace @brightchamps/api -- --name init
npm run seed --workspace @brightchamps/api
npm run dev:api
```

Mở terminal thứ hai:

```bash
npm run dev:web
```

Frontend chạy tại `http://localhost:5173`, API tại `http://localhost:3000`, Swagger tại `http://localhost:3000/api/docs`.

## Deploy miễn phí

### 1. Tạo Neon database

1. Tạo project miễn phí tại Neon.
2. Chọn region gần Việt Nam.
3. Sao chép pooled connection string vào `DATABASE_URL`.
4. Sao chép direct connection string vào `DIRECT_URL`.
5. Bảo đảm connection string có `sslmode=require`.

### 2. Push repository lên GitHub

Không commit file `.env` hoặc mật khẩu.

### 3. Tạo Render Blueprint

1. Vào Render Dashboard.
2. Chọn `New` → `Blueprint`.
3. Kết nối GitHub repository.
4. Render đọc `render.yaml` và tạo API cùng Static Site.
5. Chọn plan `Free` cho API nếu Render yêu cầu xác nhận.

Nhập các biến môi trường được hỏi:

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string |
| `ADMIN_EMAIL` | Email admin công ty |
| `ADMIN_INITIAL_PASSWORD` | Mật khẩu tạm chỉ dùng lần đầu |
| `FRONTEND_URL` | URL frontend Render, ví dụ `https://brightchamps-warehouse.onrender.com` |
| `VITE_API_URL` | URL API Render, ví dụ `https://brightchamps-warehouse-api.onrender.com` |

`JWT_SECRET` được Render tự tạo. Không nhập bí mật vào `render.yaml`.

### 4. Deploy lại sau khi có URL

Blueprint có thể cần deploy lần đầu để Render cấp URL. Sau đó:

1. Cập nhật `FRONTEND_URL` trong API bằng URL frontend thực tế.
2. Cập nhật `VITE_API_URL` trong Static Site bằng URL API thực tế.
3. Chọn `Manual Deploy` cho cả hai service.

### 5. Đăng nhập lần đầu

1. Đăng nhập bằng tài khoản admin ban đầu.
2. Hệ thống bắt buộc đổi mật khẩu.
3. Sau khi đổi thành công, xóa biến `ADMIN_INITIAL_PASSWORD` khỏi Render.
4. Không xóa `ADMIN_EMAIL`.

## Dữ liệu đầu kỳ

Seed tự động tạo 5 hub và 45 vật tư. Theo xác nhận của người dùng, toàn bộ số lượng tại cột `Tồn sau xuất KIT` của workbook nguồn được ghi nhận là số dư đầu kỳ của hub D7. Một giao dịch điều chỉnh có mã `OPENING-D7-EXCEL-V6` được tạo đúng một lần để tránh cộng trùng khi ứng dụng khởi động lại. D10, BT, TP và GV khởi tạo với tồn bằng 0.

## Giới hạn miễn phí

- Render Web Service ngủ khi không có truy cập; lần mở đầu có thể chờ khoảng một phút.
- Không dùng filesystem của Render để lưu dữ liệu.
- Không dùng Render Postgres miễn phí vì database đó có thời hạn.
- Không dùng custom domain, SMS, email OTP hay dịch vụ lưu ảnh.
- Tải CSV định kỳ để tự sao lưu.
