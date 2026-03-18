# Technical Implementation

## Tech Stack
- **Frontend:** Next.js (để tối ưu SEO và chia sẻ link) hoặc Vite (React).
- **Libraries:**
  - eact-markdown / emark-gfm: Xử lý Markdown.
  - mammoth.js: Chuyển đổi file .docx sang HTML.
  - html2pdf.js hoặc CSS Print Media Queries: Để xuất bản in.
- **Storage:** Tích hợp PocketBase (đã có kinh nghiệm) để lưu trữ các bản nháp hồ sơ.

## Key Logic
1. **Parser:** Đọc nội dung file -> Chuyển thành cấu trúc JSON chuẩn.
2. **Template Engine:** Áp dụng các Template hồ sơ (Minimalist, Corporate, Creative).
3. **Static Export:** Có thể xuất ra một file HTML duy nhất (Self-contained) để lưu vào folder dự án mà không cần server.
