<p align="center">
  <a href="https://genoffice.ai/">
    <picture>
      <source srcset="../assets/readme/hero-dark.webp" media="(prefers-color-scheme: dark)">
      <img src="../assets/readme/hero.webp" alt="GenOffice — Bộ ứng dụng văn phòng AI mã nguồn mở: Docs, Sheets, Slides, PDF, Markdown và HTML tích hợp bảng điều khiển AI" width="100%">
    </picture>
  </a>
</p>

<h1 align="center">GenOffice</h1>

<p align="center"><b>Bộ ứng dụng văn phòng AI mã nguồn mở đầy đủ tính năng đầu tiên trên thế giới.</b><br>
Chỉnh sửa các tệp Word, Excel, PowerPoint và PDF cùng với AI của bạn, lưu lại đúng định dạng chuẩn gốc.</p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/github/license/genspark-ai/genoffice" alt="Giấy phép: Apache-2.0"></a>
  <a href="https://github.com/genspark-ai/genoffice/releases/latest"><img src="https://img.shields.io/github/v/release/genspark-ai/genoffice" alt="Bản phát hành mới nhất"></a>
  <a href="https://github.com/genspark-ai/genoffice/releases"><img src="https://img.shields.io/github/downloads/genspark-ai/genoffice/total" alt="Lượt tải"></a>
  <a href="https://github.com/genspark-ai/genoffice/stargazers"><img src="https://img.shields.io/github/stars/genspark-ai/genoffice?style=flat" alt="GitHub stars"></a>
  <a href="https://x.com/merrickbuilds"><img src="https://img.shields.io/badge/follow-%40merrickbuilds-000000?logo=x&logoColor=white" alt="Theo dõi @merrickbuilds trên X"></a>
</p>

<p align="center"><a href="../../README.md">English</a> · <b>Tiếng Việt</b></p>

<p align="center">
  <a href="#tải-về"><b>Tải về</b></a> ·
  <a href="#dòng-lệnh-cli-và-agent-skill"><b>CLI</b></a> ·
  <a href="#mcp-server"><b>MCP</b></a> ·
  <a href="https://genoffice.ai/"><b>Trang web</b></a> ·
  <a href="https://genoffice.ai/join"><b>Cộng đồng</b></a> ·
  <a href="https://x.com/merrickbuilds"><b>X</b></a> ·
  <a href="../../PRIVACY.md"><b>Quyền riêng tư</b></a>
</p>

GenOffice là giải pháp thay thế mã nguồn mở, miễn phí cho Microsoft Office trên macOS, Windows và Linux. Ứng dụng mở và lưu các tệp gốc `.docx`, `.xlsx` và `.pptx`, chỉnh sửa PDF, Markdown và HTML, đồng thời tích hợp một trợ lý AI thông minh bên cạnh mỗi tài liệu — không phải là một khung chat dán thêm vào lề, mà là một trình biên tập thực thụ có khả năng đọc tệp, thực hiện thay đổi và hiển thị chính xác những gì đã tác động.

- **Định dạng chuẩn gốc, bảo toàn từng byte.** Chỉ những gì bạn chỉnh sửa mới được ghi lại. Mọi thành phần khác trong tệp đều được giữ nguyên vẹn từng byte, đảm bảo tài liệu luôn tương thích mượt mà trong Word, Excel và PowerPoint.
- **AI minh bạch, dễ dàng kiểm tra.** Các chỉnh sửa hiển thị dưới dạng theo dõi thay đổi (track changes) và so sánh trực quan (diffs), cho phép hoàn tác chỉ với một cú nhấp chuột. Bảng tính nhận công thức thực tế, không dán các con số tĩnh. Bản trình chiếu và trang tài liệu được tạo trực tiếp lên canvas và luôn có thể chỉnh sửa hoàn toàn.
- **Bảo mật và cục bộ theo thiết kế.** Mở, chỉnh sửa, lưu và chuyển đổi tệp hoàn toàn trên máy tính của bạn. Chuyển đổi PDF → Word / Excel / PowerPoint, Markdown → Word và HTML → Word đều chạy cục bộ. Chỉ các yêu cầu gọi AI mới rời khỏi máy, gửi tới nhà cung cấp do bạn chọn.
- **Tìm kiếm tệp theo nội dung.** Màn hình chính tìm kiếm theo tên, thư mục và toàn văn nội dung của các tệp `.docx`, `.xlsx`, `.pptx`, PDF, Markdown và HTML từ cơ sở dữ liệu SQLite cục bộ. Các kết quả hàng đầu có thể được xếp hạng lại bằng **[TypeSafe Jev](https://typesafe.ai/)** để đưa tệp trả lời đúng câu hỏi của bạn lên trước.
- **Dùng khóa API của bạn hoặc không cần khóa.** Đăng nhập bằng tài khoản Genspark để sử dụng ngay mà không cần cấu hình khóa, hoặc tự mang khóa API riêng (BYOK) cho Claude, OpenAI, Gemini, DeepSeek, Kimi, GLM, Qwen, Doubao, MiniMax, Grok, Mistral, OpenRouter, Requesty, Opper, hoặc bất kỳ máy chủ tương thích OpenAI nào (bao gồm máy chủ cục bộ như Ollama/vLLM).
- **Sẵn sàng cho tự động hóa và AI Agent.** Cung cấp công cụ dòng lệnh `genoffice` và skill cho Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode và Windsurf, cho phép các coding agent tạo, chuyển đổi, đọc và chỉnh sửa tệp Office thực tế trên máy tính của bạn mà không cần mở giao diện cửa sổ.

**Tải ngay:** [macOS](https://github.com/genspark-ai/genoffice/releases/latest) (Apple Silicon và Intel) · [Windows](https://github.com/genspark-ai/genoffice/releases/latest) (x64 và Arm) · [Linux](https://github.com/genspark-ai/genoffice/releases/latest) (deb, rpm, AppImage).

---

## Trải nghiệm các ứng dụng

Sáu ứng dụng chuyên biệt, chung một bảng điều khiển AI mạnh mẽ:

### 1 · Docs — Mở và chỉnh sửa `.docx` cùng AI có thể kiểm tra
- Hiển thị tệp chuẩn như Word: định dạng hai cột, hình ảnh tràn lề, bảng có đổ bóng, đầu trang & chân trang, ngắt trang theo số liệu dòng của Word. Kiểu dáng, nhận xét, theo dõi thay đổi, công thức toán học và nét vẽ tự do được bảo toàn nguyên vẹn.
- Yêu cầu AI chỉnh sửa: AI đọc nội dung cần thiết, viết lại phần tổng quan hoặc chèn thêm mục mới. Mọi lượt tương tác AI đều là một bản chụp (snapshot) có thể hoàn tác ngay tức thì; khi bật **Theo dõi thay đổi**, các chỉnh sửa hiển thị dưới dạng sửa đổi chuẩn Word.

### 2 · Sheets — `.xlsx` với công thức động và biểu đồ thực tế
- Tạo bảng tính chuyên nghiệp: chỉ từ một câu mô tả, AI bổ sung trang tóm tắt với các hàm `SUMIF` theo khu vực và danh mục, chèn biểu đồ cột, và áp dụng hàng chục thay đổi trong một lượt có thể hoàn tác.
- Tra cứu dữ liệu thông minh: đặt câu hỏi về sổ làm việc, AI giải thích logic và trích dẫn chính xác ô dữ liệu làm căn cứ. Nền tảng: công cụ Rust `.xlsx` nội bộ, bảng tổng hợp (pivot tables), bộ cắt lát dữ liệu (slicers), định dạng có điều kiện và dò tìm công thức.

### 3 · Slides — Từ một câu lệnh tạo ra bản thuyết trình `.pptx`
- Tạo toàn bộ bài trình chiếu 10–12 slide từ một câu lệnh tóm tắt ý tưởng. AI lập dàn ý cốt truyện, nghiên cứu số liệu và phác thảo từng slide lên canvas dưới dạng tệp `.pptx` thực tế.
- Bộ slide hoàn chỉnh với kiểu chữ, hình ảnh đồng nhất và lời kêu gọi hành động; tiếp tục chỉnh sửa với trang chiếu chính (master), bố cục linh hoạt hoặc yêu cầu AI định dạng lại, viết lại nội dung.

### 4 · PDF — Chỉnh sửa văn bản trực tiếp trên trang, chuyển đổi PDF sang Word tại chỗ
- Sửa trực tiếp trong trang: chế độ Chỉnh sửa văn bản nhận diện từng khối chữ để sửa trực tiếp; luồng nội dung được viết lại qua PDFium với phông chữ gốc, không phải là lớp ghi chú che đậy.
- Chuyển đổi cục bộ: Chuyển đổi PDF sang Word, Excel, PowerPoint ngay trên máy tính mà không cần tải lên máy chủ bên ngoài. Hỗ trợ OCR hệ thống cho tài liệu quét.

### 5 · HTML — Trình tạo giao diện UI và trang web bằng AI
- Đưa ra mục đích và đối tượng của trang web. AI đề xuất bản tóm tắt thiết kế (design brief) — thông điệp, bảng màu, kiểu chữ và định hướng phong cách — sau đó xây dựng tệp `.html` khép kín độc lập.
- Dễ dàng đổi phong cách thiết kế chỉ bằng một yêu cầu Restyle, xem trước tức thì, hoặc xuất sang PDF / tệp Word có thể chỉnh sửa.

### 6 · Markdown — Trình biên tập khối trên tệp `.md` thuần túy
- Trình biên tập khối trực quan trên nền định dạng Markdown thuần, hỗ trợ LaTeX, sơ đồ Mermaid, bảng biểu và danh sách công việc.
- Trợ lý AI sẵn sàng trau chuốt câu từ, sửa ngữ pháp, chia nhỏ công việc, định dạng lại toàn bộ tài liệu hoặc xuất sang tệp Word chuẩn.

---

## Hướng dẫn cài đặt & Phát triển từ mã nguồn

Dành cho các lập trình viên hoặc người dùng muốn tự biên dịch và đóng gói Xiao Office:

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản `>= 22.12.0` (khuyến nghị dùng Node.js 22 LTS).
- **npm**: Phiên bản `>= 10`.
- **Rust & Cargo**: (Tùy chọn) Cần thiết nếu biên dịch lại các module native hiệu năng cao của bộ máy xử lý bảng tính (`xlsx-writer`).

### 2. Cài đặt các gói phụ thuộc
```bash
git clone https://github.com/sansanxm/xiaooffice.git
cd xiaooffice
npm install
```

### 3. Chạy môi trường phát triển (Development)
Khởi chạy đồng thời toàn bộ giao diện và các tiến trình con:
```bash
npm run dev
```

### 4. Kiểm tra chất lượng mã nguồn (Quality Check & Test)
Kiểm tra an toàn kiểu dữ liệu TypeScript trên toàn bộ monorepo:
```bash
npm run typecheck
```
Chạy toàn bộ bộ kiểm thử tự động (hơn 2.800 unit tests):
```bash
npm run test
```

### 5. Đóng gói ứng dụng Desktop (Build Distributable)
- **Cho macOS (DMG & Zip):**
  ```bash
  npm run dist:mac
  ```
  Tệp cài đặt sẽ được tạo tại thư mục `apps/shell/release/Xiao Office-<version>-arm64.dmg`.

- **Cho Windows (NSIS Installer):**
  ```bash
  npm run dist:win
  ```

- **Cho Linux (AppImage, deb, rpm):**
  ```bash
  npm run dist:linux
  ```

---

## Cấu hình AI & Mô hình ngôn ngữ

Xiao Office hỗ trợ người dùng làm việc trực tiếp với nhiều nhà cung cấp AI hàng đầu:
1. Mở bất kỳ tài liệu nào và mở bảng điều khiển AI ở bên phải.
2. Chọn nhà cung cấp: **OpenAI**, **Anthropic (Claude)**, **Google Gemini**, **DeepSeek**, **Ollama (Local)**, **OpenRouter**, v.v.
3. Điền API Key tương ứng của bạn. Khóa API được lưu mã hóa an toàn tại máy cục bộ (Keychain / Local Secure Store) và chỉ được gửi trực tiếp đến API endpoint khi gửi lệnh.

---

## Các tính năng tối ưu mới trên Xiao Office

- 📄 **Chế độ xem Bố cục trang (Page Layout View):** Hiển thị trực quan theo đúng khổ giấy đã đặt (A4, A3, A5, Letter...), xem ranh giới lề in và tự động co giãn vừa vặn màn hình.
- 🎛️ **Bộ 3 nút xem tiện lợi:** Chuyển đổi nhanh giữa chế độ Bình thường (`▦`), Bố cục trang (`▤`) và Xem trước ngắt trang (`┆`) ngay góc dưới thanh trạng thái.
- ▽ **Nút Lọc (Filter) trực quan:** Nổi bật ngay trên thẻ Trang đầu (Home) và thẻ Dữ liệu (Data) với chỉ báo trạng thái kích hoạt.
- ↔️ **Nháy đúp đường lưới tự động vừa khít:** Nhấp đúp vào đường phân cách cột hoặc hàng để tự động co giãn kích thước theo nội dung (như Microsoft Excel).
- 💾 **Lưu tài liệu mới thông minh:** Luôn bật hộp thoại chọn vị trí lưu, đặt tên tệp và chọn định dạng (`.xlsx`, `.docx`, `.pptx`, `.csv`...) khi nhấn Lưu trên tài liệu mới.
- 🖨️ **In ấn ổn định trên macOS:** Sửa triệt để lỗi không thể in, mở trực tiếp hộp thoại in hệ thống.

---

## Giấy phép (License)

Dự án được phân phối dưới giấy phép mã nguồn mở [Apache-2.0](../../LICENSE).
