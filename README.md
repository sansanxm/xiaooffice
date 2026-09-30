<p align="center">
  <img src="docs/assets/readme/hero.png" alt="Xiao Office — Bộ ứng dụng văn phòng AI mã nguồn mở: Docs, Sheets, Slides, PDF, Markdown và HTML tích hợp trợ lý AI" width="100%">
</p>

<h1 align="center">Xiao Office (xiaooffice)</h1>

<p align="center"><b>Bộ ứng dụng văn phòng AI mã nguồn mở toàn diện, hiện đại và bảo mật.</b><br>
Soạn thảo Văn bản (.docx), Bảng tính (.xlsx), Bản trình chiếu (.pptx) và PDF cùng với trợ lý AI, lưu lại đúng định dạng chuẩn gốc.</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/Gi%E1%BA%A5y%20ph%C3%A9p-Apache_2.0-blue.svg" alt="Giấy phép: Apache-2.0"></a>
  <a href="https://github.com/sansanxm/xiaooffice/releases"><img src="https://img.shields.io/badge/Phi%C3%AAn%20b%E1%BA%A3n-v0.12.0-brightgreen" alt="Phiên bản"></a>
  <a href="https://github.com/sansanxm/xiaooffice/stargazers"><img src="https://img.shields.io/github/stars/sansanxm/xiaooffice?style=flat&color=yellow" alt="GitHub stars"></a>
  <a href="https://github.com/sansanxm/xiaooffice"><img src="https://img.shields.io/badge/GitHub-xiaooffice-blue?logo=github" alt="GitHub Repo"></a>
</p>

<p align="center"><b>Tiếng Việt</b> · <a href="README.en.md">English</a></p>

<p align="center">
  <a href="#tính-năng-nổi-bật"><b>Tính năng</b></a> ·
  <a href="#tải-về--cài-đặt"><b>Tải về</b></a> ·
  <a href="#hướng-dẫn-phát-triển-từ-mã-nguồn"><b>Phát triển & Đóng gói</b></a> ·
  <a href="#cấu-hình-mô-hình-ai"><b>Cấu hình AI</b></a> ·
  <a href="#các-ứng-dụng-chính"><b>Ứng dụng</b></a> ·
  <a href="LICENSE"><b>Bản quyền</b></a>
</p>

---

## Giới thiệu về Xiao Office

**Xiao Office** là bộ công cụ văn phòng mã nguồn mở, bảo mật và miễn phí hàng đầu dành cho các hệ điều hành macOS, Windows và Linux. Ứng dụng hỗ trợ mở và lưu trực tiếp các tệp tin Microsoft Office chuẩn gốc (`.docx`, `.xlsx`, `.pptx`), chỉnh sửa PDF trực quan, hỗ trợ Markdown và HTML, đồng thời tích hợp trợ lý AI thông minh ngay bên cạnh màn hình làm việc để hỗ trợ bạn đọc hiểu tài liệu, phân tích dữ liệu, viết lại nội dung và tạo lập văn bản tự động.

- **Định dạng chuẩn gốc, bảo toàn cấu trúc:** Chỉ ghi đè lên các khối nội dung bạn chỉnh sửa. Mọi định dạng phức tạp khác trong tài liệu (phông chữ, bố cục, bảng biểu, hình ảnh) đều được giữ nguyên vẹn từng byte, đảm bảo tương thích 100% với Microsoft Word, Excel và PowerPoint.
- **AI minh bạch, kiểm soát toàn diện:** Mọi chỉnh sửa do AI tạo ra đều hiển thị dưới dạng so sánh trực quan (diffs) hoặc chế độ theo dõi thay đổi (track changes), cho phép bạn hoàn tác chỉ với một cú nhấp chuột. Bảng tính tạo ra công thức tính toán thật (`SUMIF`, `VLOOKUP`...), không dán số tĩnh.
- **Bảo mật và xử lý cục bộ (Local-first):** Mở, chỉnh sửa, lưu trữ và chuyển đổi định dạng tài liệu đều chạy trực tiếp trên máy tính của bạn. Chuyển đổi PDF sang Word / Excel / PowerPoint hoàn toàn ngoại tuyến. Chỉ các câu lệnh hỏi đáp AI mới được gửi tới nhà cung cấp API mà bạn chỉ định.
- **Tìm kiếm tệp thông minh:** Tìm kiếm nhanh chóng theo tên, thư mục và toàn văn nội dung tệp tin từ cơ sở dữ liệu SQLite cục bộ cực kỳ nhanh nhạy.
- **Tự do kết nối mọi mô hình AI (BYOK):** Kết nối trực tiếp với OpenAI (GPT-4o), Anthropic (Claude 3.5), Google (Gemini 2.0 / 1.5), DeepSeek, Ollama (mô hình AI chạy cục bộ không cần mạng), OpenRouter hoặc bất kỳ máy chủ nào tương thích chuẩn OpenAI API.

---

## Tính năng nổi bật & Cải tiến mới

1. **📄 Bảng tính — Chế độ xem Bố cục trang in (Page Layout View):**
   - Xem bảng tính vừa vặn theo từng trang in thực tế theo các khổ giấy chuẩn: **A4 (210 × 297 mm)**, **A3**, **A5**, Letter, Legal...
   - Tự động hiển thị khung trang in sang trọng, căn lề (Thường, Rộng, Hẹp), hướng in (Dọc / Ngang) và tỷ lệ co giãn in (Fit-to-page).
   - Tự động điều chỉnh mức thu phóng (zoom) để vừa khít màn hình khi chuyển sang chế độ Bố cục trang.
2. **🎛️ Bộ 3 nút chuyển chế độ xem tiện lợi:**
   - Bố trí ngay trên thanh trạng thái góc dưới bên phải (trước thanh trượt thu phóng) và trên thẻ **Xem (View)**:
     - `▦` **Bình thường (Normal):** Lưới làm việc bảng tính không giới hạn.
     - `▤` **Bố cục trang (Page Layout):** Xem chuẩn xác theo từng trang in theo khổ giấy đã đặt.
     - `┆` **Xem trước ngắt trang (Page Break Preview):** Hiển thị các đường phân trang và nhãn trang mờ.
3. **▽ Nút Lọc (Filter) trực quan:**
   - Nút **Lọc** nổi bật với biểu tượng phễu `▽` được đưa ra ngay thẻ **Trang đầu (Home)** và thẻ **Dữ liệu (Data)**.
   - Nút sáng đèn báo hiệu trạng thái khi bảng tính đang kích hoạt bộ lọc, bật/tắt tức thì chỉ với một cú click chuột.
4. **↔️ Tự động co giãn hàng / cột khi nháy đúp đường lưới (như MS Excel):**
   - Nháy đúp vào đường phân cách cột hoặc đường lưới dọc: Tự động vừa khít chiều rộng cột theo nội dung dài nhất.
   - Nháy đúp vào đường phân cách hàng hoặc đường lưới ngang: Tự động vừa khít chiều cao hàng theo nội dung.
5. **💾 Hộp thoại Lưu tài liệu mới thông minh (Save As):**
   - Khi nhấn Lưu (`⌘S` / `Ctrl+S`) trên tài liệu mới chưa có tên, ứng dụng luôn hiển thị hộp thoại chọn thư mục lưu, đặt tên tệp và chọn định dạng (`.xlsx`, `.docx`, `.pptx`, `.csv`...).
6. **🖨️ In ấn ổn định trên macOS:**
   - Khắc phục triệt để lỗi không thể in trên macOS; tích hợp mượt mà với hộp thoại in hệ thống của macOS.

---

## Tải về & Cài đặt

Người dùng có thể tải về các gói cài đặt dựng sẵn tại trang [Releases](https://github.com/sansanxm/xiaooffice/releases):
- **macOS:** Tệp `.dmg` hoặc `.zip` (tương thích Apple Silicon M1/M2/M3/M4 và Intel x64).
- **Windows:** Tệp cài đặt `.exe` (NSIS Installer dành cho Windows 10/11 x64 và Arm64).
- **Linux:** Các định dạng `.AppImage`, `.deb` và `.rpm`.

---

## Hướng dẫn phát triển từ mã nguồn

Dành cho các lập trình viên muốn tự biên dịch hoặc đóng góp phát triển Xiao Office:

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản `>= 22.12.0` (khuyến nghị dùng Node.js 22 LTS).
- **npm**: Phiên bản `>= 10`.
- **Rust & Cargo**: (Tùy chọn) Cần thiết nếu biên dịch lại các module native hiệu năng cao của engine bảng tính (`xlsx-writer`).

### 2. Tải mã nguồn & Cài đặt gói phụ thuộc
```bash
git clone https://github.com/sansanxm/xiaooffice.git
cd xiaooffice
npm install
```

### 3. Chạy môi trường phát triển (Development)
Khởi chạy đồng thời toàn bộ giao diện và các tiến trình con với tính năng hot-reload:
```bash
npm run dev
```

### 4. Kiểm tra mã nguồn (Typecheck & Unit Test)
```bash
# Kiểm tra an toàn kiểu dữ liệu TypeScript trên toàn bộ monorepo
npm run typecheck

# Chạy bộ kiểm thử tự động (hơn 2.800 unit tests)
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

Xiao Office tôn trọng quyền riêng tư của bạn — cơ chế Mang khóa API riêng (Bring Your Own Key):
1. Khởi động Xiao Office và mở một tài liệu bất kỳ.
2. Mở bảng điều khiển **AI** ở cạnh phải màn hình.
3. Chọn nhà cung cấp:
   - **OpenAI:** GPT-4o, GPT-4o-mini...
   - **Anthropic:** Claude 3.5 Sonnet, Claude 3 Opus...
   - **Google Gemini:** Gemini 2.0 Flash, Gemini 1.5 Pro...
   - **DeepSeek:** DeepSeek-Chat, DeepSeek-Reasoner (R1)...
   - **Ollama / Local LLM:** Chạy các mô hình mã nguồn mở ngoại tuyến không cần internet.
   - **OpenRouter & Máy chủ tùy chỉnh:** Kết nối với bất kỳ máy chủ nào tương thích OpenAI API.
4. Điền API Key của bạn. Khóa API được lưu mã hóa an toàn trên máy cục bộ (Keychain) và chỉ gửi trực tiếp đến API endpoint khi bạn gửi câu lệnh.

---

## Các ứng dụng chính

| Ứng dụng | Định dạng hỗ trợ | Điểm nổi bật |
| :--- | :--- | :--- |
| **Docs** | `.docx`, `.doc` | Trình soạn thảo văn bản chuẩn Word, bố cục hai cột, tràn ảnh, theo dõi thay đổi (track changes), bảng biểu và ghi chú. |
| **Sheets** | `.xlsx`, `.csv`, `.xls` | Bảng tính siêu tốc với engine Rust, hỗ trợ chế độ Bố cục trang A4/A3/A5, nút lọc trực quan, nháy đúp co giãn hàng cột, Pivot Table. |
| **Slides** | `.pptx`, `.ppt` | Tạo bộ slide 10–12 trang tự động từ ý tưởng qua AI, bố cục và kiểu chữ đồng nhất, xuất file PowerPoint thực tế. |
| **PDF** | `.pdf` | Chỉnh sửa văn bản trực tiếp trên trang PDF, chuyển đổi PDF sang Word / Excel / PowerPoint chạy cục bộ có hỗ trợ OCR. |
| **Markdown** | `.md` | Biên tập văn bản dạng khối hiện đại, hỗ trợ công thức Toán học LaTeX, sơ đồ Mermaid và danh sách công việc. |
| **HTML** | `.html` | Thiết kế giao diện và trang web trực quan từ mô tả AI, xuất bản tệp HTML độc lập khép kín. |

---

## Đóng góp & Phát triển

Mọi ý kiến đóng góp, báo lỗi hoặc đề xuất tính năng mới đều được hoan nghênh:
- Báo cáo lỗi: [GitHub Issues](https://github.com/sansanxm/xiaooffice/issues)
- Tạo Pull Request: [GitHub Pull Requests](https://github.com/sansanxm/xiaooffice/pulls)

---

## Giấy phép (License)

Dự án được phân phối dưới giấy phép mã nguồn mở [Apache License 2.0](LICENSE).
