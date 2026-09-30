<p align="center">
  <picture>
    <source srcset="../assets/readme/hero-dark.webp" media="(prefers-color-scheme: dark)">
    <img src="../assets/readme/hero.webp" alt="Xiao Office — Bộ ứng dụng văn phòng AI mã nguồn mở: Docs, Sheets, Slides, PDF, Markdown và HTML tích hợp bảng điều khiển AI" width="100%">
  </picture>
</p>

<h1 align="center">Xiao Office (xiaooffice)</h1>

<p align="center"><b>Bộ ứng dụng văn phòng AI mã nguồn mở toàn diện, hiện đại và bảo mật.</b><br>
Chỉnh sửa các tệp Word (.docx), Excel (.xlsx), PowerPoint (.pptx) và PDF cùng với trợ lý AI, lưu lại đúng chuẩn định dạng gốc.</p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="Giấy phép: Apache-2.0"></a>
  <a href="https://github.com/sansanxm/xiaooffice/releases"><img src="https://img.shields.io/github/v/release/sansanxm/xiaooffice?color=brightgreen&label=Phiên%20bản" alt="Phiên bản"></a>
  <a href="https://github.com/sansanxm/xiaooffice/stargazers"><img src="https://img.shields.io/github/stars/sansanxm/xiaooffice?style=flat&color=yellow" alt="GitHub stars"></a>
  <a href="https://github.com/sansanxm/xiaooffice"><img src="https://img.shields.io/badge/GitHub-xiaooffice-blue?logo=github" alt="Repository"></a>
</p>

<p align="center"><a href="../../README.md">English</a> · <b>Tiếng Việt</b></p>

<p align="center">
  <a href="#tính-năng-nổi-bật"><b>Tính năng</b></a> ·
  <a href="#hướng-dẫn-cài-đặt--chạy-ứng-dụng"><b>Cài đặt</b></a> ·
  <a href="#hướng-dẫn-phát-triển-từ-mã-nguồn"><b>Phát triển & Đóng gói</b></a> ·
  <a href="#cấu-hình-mô-hình-ai"><b>Cấu hình AI</b></a> ·
  <a href="#các-ứng-dụng-trong-bộ-xiao-office"><b>Ứng dụng</b></a> ·
  <a href="../../LICENSE"><b>Bản quyền</b></a>
</p>

---

## Giới thiệu về Xiao Office

**Xiao Office** là bộ ứng dụng văn phòng mã nguồn mở, bảo mật và miễn phí dành cho macOS, Windows và Linux. Ứng dụng hỗ trợ mở và lưu trực tiếp các tệp gốc `.docx`, `.xlsx`, `.pptx`, chỉnh sửa PDF, Markdown và HTML, đồng thời tích hợp trợ lý AI thông minh ngay cạnh tài liệu để hỗ trợ đọc hiểu, phân tích dữ liệu, viết lại nội dung và tạo lập tự động.

- **Định dạng chuẩn gốc, bảo toàn cấu trúc:** Chỉ ghi lại những phần bạn chỉnh sửa. Mọi định dạng phức tạp khác trong tệp được giữ nguyên vẹn từng byte, tương thích tuyệt đối với Microsoft Office.
- **AI minh bạch, kiểm soát hoàn toàn:** Thay đổi từ AI hiển thị dưới dạng so sánh trực quan (diffs) hoặc theo dõi thay đổi (track changes), cho phép hoàn tác 1 cú nhấp chuột. Bảng tính tạo công thức tính toán thật, không dán số tĩnh.
- **Bảo mật và xử lý cục bộ (Local-first):** Mở, chỉnh sửa, lưu và chuyển đổi định dạng chạy trực tiếp trên máy của bạn. Chỉ các yêu cầu gọi AI mới gửi đến nhà cung cấp API mà bạn lựa chọn.
- **Tìm kiếm tệp thông minh:** Tìm kiếm nhanh theo tên, thư mục và toàn văn nội dung tệp từ cơ sở dữ liệu SQLite cục bộ.
- **Hỗ trợ đa dạng nhà cung cấp AI:** Dễ dàng kết nối với OpenAI (GPT-4o), Anthropic (Claude 3.5), Google (Gemini 2.5), DeepSeek, Ollama (máy chủ AI cục bộ), Qwen, v.v.

---

## Tính năng nổi bật & Cải tiến mới

1. **📄 Bảng tính — Chế độ xem Bố cục trang in (Page Layout View):**
   - Xem vừa trang in trực tiếp theo các khổ giấy phổ biến: **A4 (210 × 297 mm)**, **A3**, **A5**, Letter, Legal...
   - Tự động hiển thị đường lề trang in (Thường, Rộng, Hẹp), hướng giấy (Dọc / Ngang) và tỷ lệ co giãn in (Fit-to-page).
   - Tự động căn chỉnh mức thu phóng (zoom) để vừa khít màn hình khi bật Bố cục trang.
2. **🎛️ Bộ 3 nút chuyển chế độ xem tiện lợi:**
   - Đặt ngay trên thanh trạng thái góc dưới bên phải (trước thanh trượt thu phóng) và trên thẻ Xem (View):
     - `▦` **Bình thường (Normal):** Lưới làm việc không giới hạn.
     - `▤` **Bố cục trang (Page Layout):** Xem chuẩn theo từng trang in thực tế.
     - `┆` **Xem trước ngắt trang (Page Break Preview):** Hiển thị các đường phân trang in màu xanh.
3. **▽ Tính năng Lọc (Filter) trực quan:**
   - Nút **Lọc** nổi bật có biểu tượng phễu `▽` được đưa ra ngay thẻ **Trang đầu (Home)** và thẻ **Dữ liệu (Data)**.
   - Nút sáng đèn báo hiệu khi bảng tính đang kích hoạt bộ lọc, bật/tắt chỉ với một chạm.
4. **↔️ Tự động co giãn hàng / cột khi nháy đúp đường lưới (AutoFit như MS Excel):**
   - Nháy đúp vào đường phân cách tiêu đề cột hoặc đường lưới dọc: Tự động vừa khít độ rộng cột theo nội dung dài nhất.
   - Nháy đúp vào đường phân cách tiêu đề hàng hoặc đường lưới ngang: Tự động vừa khít chiều cao hàng.
5. **💾 Hộp thoại Lưu tài liệu mới (Save As dialog):**
   - Khi nhấn Lưu (`⌘S` / `Ctrl+S`) trên tài liệu mới chưa có tên, luôn hiển thị hộp thoại chọn thư mục lưu, đặt tên tệp và chọn định dạng (`.xlsx`, `.docx`, `.pptx`, `.csv`...).
6. **🖨️ Sửa lỗi in ấn trên macOS:**
   - Khắc phục triệt để lỗi in báo lỗi ở góc phải; kích hoạt chuẩn xác hộp thoại in Cocoa của hệ thống.

---

## Hướng dẫn cài đặt & Chạy ứng dụng

### Dành cho người dùng cuối (Tải bản dựng sẵn)
Truy cập trang [Releases](https://github.com/sansanxm/xiaooffice/releases) để tải tệp cài đặt phù hợp:
- **macOS:** Tệp `.dmg` hoặc `.zip` (hỗ trợ Apple Silicon M1/M2/M3/M4 và Intel).
- **Windows:** Tệp cài đặt `.exe` (NSIS Installer cho Windows 10/11).
- **Linux:** Gói `.AppImage`, `.deb` hoặc `.rpm`.

---

## Hướng dẫn phát triển từ mã nguồn

Dành cho lập trình viên muốn tự biên dịch hoặc đóng góp cho Xiao Office:

### 1. Yêu cầu môi trường
- **Node.js**: `>= 22.12.0` (khuyến nghị Node.js 22 LTS).
- **npm**: `>= 10`.
- **Rust & Cargo**: (Tùy chọn) Cần thiết nếu sửa đổi engine Rust hiệu năng cao (`xlsx-writer`).

### 2. Tải mã nguồn & Cài đặt thư viện
```bash
git clone https://github.com/sansanxm/xiaooffice.git
cd xiaooffice
npm install
```

### 3. Khởi chạy môi trường phát triển (Dev)
Lệnh sau sẽ chạy đồng thời 6 ứng dụng con và shell chính:
```bash
npm run dev
```

### 4. Kiểm tra mã nguồn (Typecheck & Unit Test)
```bash
# Kiểm tra an toàn kiểu dữ liệu TypeScript
npm run typecheck

# Chạy toàn bộ hơn 2.800 bài kiểm thử tự động
npm run test
```

### 5. Đóng gói bộ cài đặt Desktop (Build Distributable)
- **Cho macOS (Apple Silicon / Intel):**
  ```bash
  npm run dist:mac
  ```
  Tệp cài đặt DMG sẽ xuất hiện tại thư mục `apps/shell/release/Xiao Office-0.12.0-arm64.dmg`.

- **Cho Windows (Installer x64 / Arm64):**
  ```bash
  npm run dist:win
  ```

- **Cho Linux (AppImage / Deb / Rpm):**
  ```bash
  npm run dist:linux
  ```

---

## Cấu hình mô hình AI

Xiao Office tôn trọng quyền riêng tư: Bạn có thể tự mang khóa API cá nhân (Bring Your Own Key):
1. Khởi động Xiao Office, mở một tài liệu bất kỳ.
2. Mở bảng điều khiển **AI** ở cạnh phải giao diện.
3. Chọn nhà cung cấp:
   - **OpenAI:** GPT-4o, GPT-4o-mini...
   - **Anthropic:** Claude 3.5 Sonnet, Claude 3 Opus...
   - **Google Gemini:** Gemini 2.0 Flash, Gemini 1.5 Pro...
   - **DeepSeek:** DeepSeek-Chat, DeepSeek-Reasoner (R1)...
   - **Ollama / Local LLM:** Chạy mô hình mã nguồn mở ngoại tuyến không cần internet.
4. Điền API Key của bạn. Khóa được lưu mã hóa an toàn trên máy cục bộ và chỉ gửi đi khi bạn tương tác trực tiếp với AI.

---

## Các ứng dụng trong bộ Xiao Office

| Ứng dụng | Định dạng hỗ trợ | Điểm nổi bật |
| :--- | :--- | :--- |
| **Docs** | `.docx`, `.doc` | Trình soạn thảo chuẩn Word, hiển thị định dạng dòng chính xác, theo dõi thay đổi, chèn ảnh, bảng biểu. |
| **Sheets** | `.xlsx`, `.csv`, `.xls` | Bảng tính siêu nhanh, hỗ trợ đầy đủ công thức, pivot table, slicer, xem bố cục trang A4/A3/A5, tự động co giãn lưới. |
| **Slides** | `.pptx`, `.ppt` | Trình chiếu trực quan, tạo slide tự động từ ý tưởng qua AI, định dạng màu sắc và bố cục đồng bộ. |
| **PDF** | `.pdf` | Chỉnh sửa văn bản trực tiếp trên trang PDF, chuyển đổi PDF sang Word / Excel / PowerPoint chạy cục bộ. |
| **Markdown** | `.md` | Biên tập dạng khối hiện đại, hỗ trợ công thức Toán LaTeX, sơ đồ Mermaid và danh sách công việc. |
| **HTML** | `.html` | Thiết kế giao diện và trang web trực quan bằng prompt AI, xuất ra file HTML độc lập. |

---

## Đóng góp & Phát triển

Mọi ý kiến đóng góp, báo lỗi hoặc yêu cầu tính năng mới đều được hoan nghênh:
- Báo cáo lỗi: [GitHub Issues](https://github.com/sansanxm/xiaooffice/issues)
- Tạo Pull Request: [GitHub Pull Requests](https://github.com/sansanxm/xiaooffice/pulls)

---

## Giấy phép (License)

Dự án được phân phối dưới giấy phép mã nguồn mở [Apache License 2.0](../../LICENSE).
