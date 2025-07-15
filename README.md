# Chatbot AI Hỗ Trợ Tìm Kiếm Tài Liệu

Đây là một ứng dụng chatbot AI được thiết kế để hỗ trợ sinh viên tìm kiếm tài liệu học tập và trả lời các câu hỏi liên quan đến môn học. Ứng dụng được xây dựng bằng **ReactJS**, **Material-UI (MUI)**, **Firebase** và **LangChainJS**. Người dùng có thể tải lên tài liệu PDF, đặt câu hỏi và nhận câu trả lời kèm liên kết đến tài liệu phù hợp.

## Tính năng

- **Tra cứu tài liệu học tạp**: Người dùng có thể hỏi tài liệu về môn học và hệ thống sẽ trả lời kèm liên kết đến tài liệu phù hợp.
- **Xác thực người dùng**: Đăng ký và đăng nhập bằng Firebase Authentication.
- **Quản lý hồ sơ**: Người dùng có thể cập nhật tên và chọn chuyên ngành.
- **Giao diện trò chuyện**: Tương tác với chatbot AI sử dụng Google Generative AI để nhận câu trả lời và liên kết tài liệu.
- **Tải lên tài liệu**: Tải lên và quản lý các file PDF được lưu trữ trên Firebase Storage.
- **Phân quyền**: Quản trị viên (role 1) và người kiểm duyệt (role 2) có quyền truy cập vào các tab cài đặt cụ thể.
- **Tích hợp RAG**: Sử dụng LangChainJS để triển khai Retrieval-Augmented Generation, cung cấp câu trả lời dựa trên ngữ cảnh.

## Yêu cầu tiên quyết

Trước khi chạy dự án, hãy đảm bảo bạn đã cài đặt:

- **Node.js** (phiên bản 20 trở lên)
- **npm** hoặc **yarn**
- **Tài khoản Firebase** (cho xác thực, Firestore và Storage)
- **Google API Key** (cho tích hợp Google Generative AI)

## Cài đặt

1. **Cài đặt thư viện**

```bash
npm install
```

2. **Tạo file `.env`**
   Tạo file `.env` ở thư mục gốc dự án và thêm các biến môi trường sau:

```env
VITE_GOOGLE_API_KEY=your_google_api_key
```

Thay thế `your_google_api_key` bằng khóa API thực tế của bạn.

3. **Cài đặt Firebase**

## Chạy project

```bash
npm run dev
```
