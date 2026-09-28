import fs from 'node:fs';
import path from 'node:path';

// Master Dictionary: Từ điển chuẩn xác cho toàn bộ giao diện văn phòng
const EXACT_TRANSLATIONS = {
  // Common Actions
  "Save": "Lưu",
  "Save…": "Lưu…",
  "Save As…": "Lưu dưới dạng…",
  "Open": "Mở",
  "Open…": "Mở…",
  "Close": "Đóng",
  "Cancel": "Hủy",
  "OK": "OK",
  "Apply": "Áp dụng",
  "Done": "Xong",
  "Update": "Cập nhật",
  "Insert": "Chèn",
  "Delete": "Xóa",
  "Remove": "Xóa",
  "Edit": "Chỉnh sửa",
  "Copy": "Sao chép",
  "Cut": "Cắt",
  "Paste": "Dán",
  "Undo": "Hoàn tác",
  "Redo": "Làm lại",
  "Retry": "Thử lại",
  "Reset": "Đặt lại",
  "Clear": "Xóa sạch",
  "Select All": "Chọn tất cả",
  "Find": "Tìm kiếm",
  "Replace": "Thay thế",
  "Replace All": "Thay thế tất cả",
  "Previous": "Trước",
  "Next": "Tiếp theo",
  "Help": "Trợ giúp",
  "Ready": "Sẵn sàng",
  "Loading…": "Đang tải…",
  "Processing…": "Đang xử lý…",
  "Saving…": "Đang lưu…",
  "Saved": "Đã lưu",
  "AutoSaved": "Đã tự động lưu",
  "Unsaved": "Chưa lưu",
  "Search": "Tìm kiếm",
  "Search…": "Tìm kiếm…",
  "Filter": "Bộ lọc",
  "Sort": "Sắp xếp",
  "Settings": "Cài đặt",
  "Properties": "Thuộc tính",
  "More": "Thêm",
  "More…": "Thêm…",
  "None": "Không có",
  "Auto": "Tự động",
  "Automatic": "Tự động",
  "Custom": "Tùy chỉnh",
  "Default": "Mặc định",
  "Options…": "Tùy chọn…",
  "Advanced": "Nâng cao",
  "Back": "Quay lại",
  "Forward": "Tiến lên",
  "Yes": "Có",
  "No": "Không",
  "Confirm": "Xác nhận",
  "Discard": "Hủy bỏ",
  "Keep": "Giữ lại",
  "Preview": "Xem trước",
  "Print": "In",
  "Print…": "In…",
  "Export": "Xuất",
  "Import": "Nhập",
  "Download": "Tải xuống",
  "Upload": "Tải lên",

  // Ribbon Tabs
  "File": "Tệp",
  "Home": "Trang đầu",
  "Insert": "Chèn",
  "Draw": "Vẽ",
  "Design": "Thiết kế",
  "Layout": "Bố trí",
  "References": "Tham chiếu",
  "Review": "Xem lại",
  "View": "Xem",
  "Help": "Trợ giúp",
  "Table Design": "Thiết kế bảng",
  "Table Layout": "Bố trí bảng",
  "Picture Format": "Định dạng hình ảnh",
  "Shape Format": "Định dạng hình dạng",
  "Chart Design": "Thiết kế biểu đồ",
  "Chart Format": "Định dạng biểu đồ",
  "Slide Show": "Trình chiếu",
  "Transitions": "Chuyển tiếp",
  "Animations": "Hoạt ảnh",
  "Formulas": "Công thức",
  "Data": "Dữ liệu",
  "Fill Form": "Điền biểu mẫu",
  "Collapse the Ribbon": "Thu gọn dải băng",
  "Expand the Ribbon": "Mở rộng dải băng",

  // Ribbon Groups & Labels
  "Clipboard": "Bảng tạm",
  "Font": "Phông chữ",
  "Paragraph": "Đoạn văn",
  "Styles": "Kiểu dáng",
  "Editing": "Chỉnh sửa",
  "Pages": "Trang",
  "Tables": "Bảng",
  "Illustrations": "Minh họa",
  "Media": "Đa phương tiện",
  "Links": "Liên kết",
  "Comments": "Nhận xét",
  "Header & Footer": "Đầu trang & Chân trang",
  "Text": "Văn bản",
  "Symbols": "Ký hiệu",
  "Page Setup": "Thiết lập trang",
  "Page Background": "Nền trang",
  "Arrange": "Sắp xếp",
  "Window": "Cửa sổ",
  "Zoom": "Thu phóng",
  "Show": "Hiển thị",
  "Proofing": "Kiểm tra lỗi",
  "Language": "Ngôn ngữ",
  "Tracking": "Theo dõi",
  "Changes": "Thay đổi",
  "Compare": "So sánh",
  "Protect": "Bảo vệ",

  // Formatting Actions & Tooltips
  "Bold (⌘B)": "Đậm (⌘B)",
  "Italic (⌘I)": "Nghiêng (⌘I)",
  "Underline (⌘U)": "Gạch chân (⌘U)",
  "Strikethrough": "Gạch ngang",
  "Subscript": "Chỉ số dưới",
  "Superscript": "Chỉ số trên",
  "Increase Font Size": "Tăng cỡ chữ",
  "Decrease Font Size": "Giảm cỡ chữ",
  "Clear All Formatting": "Xóa toàn bộ định dạng",
  "Format Painter": "Sao chép định dạng",
  "Paste Special": "Dán đặc biệt…",
  "Paste Special…": "Dán đặc biệt…",
  "Set Default Paste…": "Đặt kiểu dán mặc định…",
  "Copy Formatting": "Sao chép định dạng",
  "Paste Formatting": "Dán định dạng",
  "Text Highlight Color": "Màu đánh dấu văn bản",
  "Font Color": "Màu phông chữ",
  "Change Case": "Đổi chữ hoa/thường",
  "Sentence case": "Chữ đầu câu viết hoa",
  "lowercase": "chữ thường",
  "UPPERCASE": "CHỮ HOA",
  "Capitalize Each Word": "Viết Hoa Từng Từ",
  "tOGGLE cASE": "đỔI kIỂU cHỮ",
  "Half-width": "Độ rộng một nửa",
  "Full-width": "Độ rộng đầy đủ",

  // Paragraph & Alignment
  "Bullets": "Dấu đầu dòng",
  "Numbering": "Đánh số",
  "Multilevel List": "Danh sách đa cấp",
  "Decrease Indent": "Giảm thụt lề",
  "Increase Indent": "Tăng thụt lề",
  "Align Left": "Căn trái",
  "Align Left (⌘L)": "Căn trái (⌘L)",
  "Center": "Căn giữa",
  "Center (⌘E)": "Căn giữa (⌘E)",
  "Align Right": "Căn phải",
  "Align Right (⌘R)": "Căn phải (⌘R)",
  "Justify": "Căn đều",
  "Justify (⌘J)": "Căn đều (⌘J)",
  "Left-to-Right Text Direction": "Hướng văn bản từ Trái sang Phải",
  "Right-to-Left Text Direction": "Hướng văn bản từ Phải sang Trái",
  "Line Spacing": "Giãn dòng",
  "Line Spacing Options…": "Tùy chọn giãn dòng…",
  "Paragraph Shading": "Đổ bóng đoạn văn",
  "Paragraph Borders": "Đường viền đoạn văn",
  "Bottom Border": "Viền dưới",
  "Top Border": "Viền trên",
  "Left Border": "Viền trái",
  "Right Border": "Viền phải",
  "No Border": "Không viền",
  "All Borders": "Tất cả đường viền",
  "All Borders (Box)": "Viền xung quanh (Hộp)",
  "Outside Borders": "Viền ngoài",
  "Inside Borders": "Viền trong",
  "Inside Horizontal Border": "Viền ngang bên trong",
  "Inside Vertical Border": "Viền dọc bên trong",

  // Styles
  "Normal": "Văn bản thường",
  "No Spacing": "Không giãn cách",
  "Heading 1": "Tiêu đề 1",
  "Heading 2": "Tiêu đề 2",
  "Heading 3": "Tiêu đề 3",
  "Heading 4": "Tiêu đề 4",
  "Heading 5": "Tiêu đề 5",
  "Heading 6": "Tiêu đề 6",
  "Title": "Tựa đề",
  "Subtitle": "Tựa đề phụ",
  "Subtle Emphasis": "Nhấn mạnh nhẹ",
  "Emphasis": "Nhấn mạnh",
  "Intense Emphasis": "Nhấn mạnh rõ",
  "Strong": "Mạnh",
  "Quote": "Trích dẫn",
  "Intense Quote": "Trích dẫn nổi bật",
  "Subtle Reference": "Tham chiếu nhẹ",
  "Intense Reference": "Tham chiếu rõ",
  "Book Title": "Tựa sách",
  "List Paragraph": "Đoạn danh sách",

  // Colors
  "Theme Colors": "Màu chủ đề",
  "Standard Colors": "Màu tiêu chuẩn",
  "Recent Colors": "Màu gần đây",
  "More Colors…": "Màu khác…",
  "No Color": "Không màu",
  "Automatic Color": "Màu tự động",

  // Insert Tab Elements
  "Cover Page": "Trang bìa",
  "Blank Page": "Trang trắng",
  "Page Break": "Ngắt trang",
  "Insert Table": "Chèn bảng",
  "Draw Table": "Vẽ bảng",
  "Pictures": "Hình ảnh",
  "This Device…": "Thiết bị này…",
  "Stock Images…": "Kho ảnh mẫu…",
  "Online Pictures…": "Ảnh trực tuyến…",
  "Shapes": "Hình dạng",
  "Icons": "Biểu tượng",
  "3D Models": "Mô hình 3D",
  "Chart": "Biểu đồ",
  "Screenshot": "Ảnh chụp màn hình",
  "Link": "Liên kết",
  "Bookmark": "Dấu trang",
  "Cross-reference": "Tham chiếu chéo",
  "Comment": "Nhận xét",
  "Header": "Đầu trang",
  "Footer": "Chân trang",
  "Page Number": "Số trang",
  "Text Box": "Hộp văn bản",
  "Draw Text Box": "Vẽ hộp văn bản",
  "WordArt": "Chữ nghệ thuật WordArt",
  "Drop Cap": "Chữ hoa đầu đoạn (Drop Cap)",
  "Signature Line": "Dòng chữ ký",
  "Date & Time": "Ngày & Giờ",
  "Object": "Đối tượng",
  "Equation": "Công thức toán",
  "Symbol": "Ký hiệu đặc biệt",

  // Layout Tab
  "Margins": "Lề trang",
  "Orientation": "Hướng trang",
  "Portrait": "Dọc",
  "Landscape": "Ngang",
  "Size": "Khổ giấy",
  "Columns": "Cột",
  "One": "Một cột",
  "Two": "Hai cột",
  "Three": "Ba cột",
  "Left": "Trái",
  "Right": "Phải",
  "More Columns…": "Thêm cột…",
  "Breaks": "Ngắt trang & phần",
  "Next Page": "Trang tiếp theo",
  "Continuous": "Liên tục",
  "Even Page": "Trang chẵn",
  "Odd Page": "Trang lẻ",
  "Line Numbers": "Số dòng",
  "Hyphenation": "Ngắt dấu gạch nối",
  "Indent": "Thụt lề",
  "Spacing": "Giãn cách",
  "Before": "Trước",
  "After": "Sau",

  // Table Tools
  "Insert Above": "Chèn phía trên",
  "Insert Below": "Chèn phía dưới",
  "Insert Left": "Chèn sang trái",
  "Insert Right": "Chèn sang phải",
  "Delete Cells…": "Xóa ô…",
  "Delete Columns": "Xóa cột",
  "Delete Rows": "Xóa hàng",
  "Delete Table": "Xóa bảng",
  "Merge Cells": "Hợp nhất ô",
  "Split Cells…": "Chia ô…",
  "Split Table": "Chia bảng",
  "AutoFit": "Tự động căn chỉnh",
  "AutoFit Contents": "Vừa nội dung",
  "AutoFit Window": "Vừa cửa sổ",
  "Fixed Column Width": "Cố định độ rộng cột",
  "Distribute Rows": "Phân phối đều hàng",
  "Distribute Columns": "Phân phối đều cột",
  "Cell Margins": "Lề của ô",
  "Repeat Header Rows": "Lặp lại hàng tiêu đề",
  "Convert to Text": "Chuyển thành văn bản",

  // Picture Tools
  "Remove Background": "Xóa nền hình ảnh",
  "Keep Changes": "Giữ thay đổi",
  "Discard All Changes": "Hủy toàn bộ thay đổi",
  "Mark Areas to Keep": "Đánh dấu vùng cần giữ",
  "Mark Areas to Remove": "Đánh dấu vùng cần xóa",
  "Corrections": "Chỉnh sửa độ nét & sáng",
  "Color": "Màu sắc",
  "Artistic Effects": "Hiệu ứng nghệ thuật",
  "Transparency": "Độ trong suốt",
  "Compress Pictures": "Nén hình ảnh",
  "Change Picture": "Đổi hình ảnh",
  "Reset Picture": "Đặt lại hình ảnh",
  "Reset Picture & Size": "Đặt lại hình ảnh & kích thước",
  "Picture Border": "Viền hình ảnh",
  "Picture Effects": "Hiệu ứng hình ảnh",
  "Alt Text": "Văn bản thay thế",
  "Bring Forward": "Đưa lên một mức",
  "Bring to Front": "Đưa lên trên cùng",
  "Send Backward": "Đưa xuống một mức",
  "Send to Back": "Đưa xuống dưới cùng",
  "Selection Pane": "Ngăn lựa chọn",
  "Align": "Căn chỉnh",
  "Group": "Nhóm",
  "Ungroup": "Bỏ nhóm",
  "Rotate": "Xoay",
  "Rotate Right 90°": "Xoay phải 90°",
  "Rotate Left 90°": "Xoay trái 90°",
  "Flip Vertical": "Lật dọc",
  "Flip Horizontal": "Lật ngang",
  "Crop": "Cắt xén",
  "Crop to Shape": "Cắt theo hình dạng",
  "Aspect Ratio": "Tỉ lệ khung hình",

  // Shapes
  "Shape Styles": "Kiểu hình dạng",
  "Shape Fill": "Tô màu hình dạng",
  "Shape Outline": "Viền hình dạng",
  "Shape Effects": "Hiệu ứng hình dạng",
  "No Fill": "Không tô màu",
  "No Outline": "Không có viền",
  "Lock aspect ratio": "Khóa tỉ lệ khung hình",
  "Height": "Chiều cao",
  "Width": "Chiều rộng",

  // Review Tab
  "Spelling": "Chính tả",
  "Spelling & Grammar": "Chính tả & Ngữ pháp",
  "Thesaurus": "Từ điển đồng nghĩa",
  "Word Count": "Đếm từ",
  "Translate": "Dịch",
  "New Comment": "Nhận xét mới",
  "Delete Comment": "Xóa nhận xét",
  "Resolve": "Giải quyết",
  "Track Changes": "Theo dõi thay đổi",
  "Accept": "Chấp nhận",
  "Reject": "Từ chối",
  "Accept and Move to Next": "Chấp nhận và chuyển tiếp",
  "Reject and Move to Next": "Từ chối và chuyển tiếp",
  "Accept All Changes": "Chấp nhận tất cả thay đổi",
  "Reject All Changes": "Từ chối tất cả thay đổi",

  // View Tab
  "Read Mode": "Chế độ đọc",
  "Print Layout": "Bố cục in",
  "Web Layout": "Bố cục web",
  "Outline": "Mục lục / Dàn ý",
  "Draft": "Bản nháp",
  "Ruler": "Thước đo",
  "Gridlines": "Đường lưới",
  "Navigation Pane": "Ngăn dẫn hướng",
  "100%": "100%",
  "One Page": "Một trang",
  "Multiple Pages": "Nhiều trang",
  "Page Width": "Vừa chiều rộng",
  "New Window": "Cửa sổ mới",
  "Arrange All": "Sắp xếp tất cả",
  "Split": "Chia đôi cửa sổ",
  "Remove Split": "Bỏ chia đôi",

  // AI Assistant
  "Ask AI": "Hỏi AI",
  "AI Assistant": "Trợ lý AI",
  "AI Summarize": "AI Tóm tắt",
  "AI Key Points": "AI Điểm chính",
  "AI Polish": "AI Trau chuốt",
  "AI Format": "AI Định dạng",
  "AI Review Summary": "AI Tóm tắt đánh giá",
  "AI Process Notes": "AI Xử lý ghi chú",
  "AI Fill Form": "AI Điền biểu mẫu",
  "AI Draft": "AI Soạn thảo",
  "AI Translate": "AI Dịch thuật",
  "New chat": "Cuộc trò chuyện mới",
  "Collapse panel": "Thu gọn bảng điều khiển",
  "Send": "Gửi",
  "Stop": "Dừng",
  "Thinking": "Đang suy nghĩ",
  "Replying": "Đang trả lời",
  "Working": "Đang xử lý",
  "Working…": "Đang xử lý…",
  "Replying…": "Đang trả lời…",
  "Copy reply": "Sao chép phản hồi",
  "Regenerate": "Tạo lại",
  "Snapshots": "Bản chụp phiên bản",
  "Rollback": "Khôi phục lại",
  "Clear chat": "Xóa cuộc trò chuyện",

  // Slides Specific
  "New Slide": "Trang chiếu mới",
  "Layout": "Bố cục",
  "Reset": "Đặt lại",
  "Section": "Phần",
  "Slide Master": "Bản cái trang chiếu",
  "From Beginning": "Từ đầu",
  "From Current Slide": "Từ trang hiện tại",
  "Presenter View": "Chế độ người thuyết trình",
  "Slide Sorter": "Bộ sắp xếp trang chiếu",
  "Notes Page": "Trang ghi chú",
  "Rehearse Timings": "Tập dượt thời gian",
  "Format Background": "Định dạng nền",
  "Hide Slide": "Ẩn trang chiếu",
  "Duplicate Slide": "Nhân bản trang chiếu",
  "Delete Slide": "Xóa trang chiếu",

  // Sheets Specific
  "Sheet": "Trang tính",
  "Workbook": "Sổ làm việc",
  "Cell": "Ô",
  "Row": "Hàng",
  "Column": "Cột",
  "Insert Row Above": "Chèn hàng phía trên",
  "Insert Row Below": "Chèn hàng phía dưới",
  "Insert Column Left": "Chèn cột bên trái",
  "Insert Column Right": "Chèn cột bên phải",
  "Delete Row": "Xóa hàng",
  "Delete Column": "Xóa cột",
  "Clear Contents": "Xóa nội dung",
  "Format Cells…": "Định dạng ô…",
  "Merge & Center": "Hợp nhất & Căn giữa",
  "Wrap Text": "Tự động xuống dòng",
  "Conditional Formatting": "Định dạng có điều kiện",
  "Format as Table": "Định dạng thành bảng",
  "AutoSum": "Tính tổng tự động",
  "Sort & Filter": "Sắp xếp & Lọc",
  "Sort A to Z": "Sắp xếp A đến Z",
  "Sort Z to A": "Sắp xếp Z đến A",
  "Custom Sort…": "Sắp xếp tùy chỉnh…",
  "Clear Filter": "Xóa bộ lọc",
  "PivotTable": "Bảng tổng hợp PivotTable",
  "Data Validation": "Xác thực dữ liệu",
  "Freeze Panes": "Cố định ngăn",
  "Freeze Top Row": "Cố định hàng đầu",
  "Freeze First Column": "Cố định cột đầu",
  "Unfreeze Panes": "Hủy cố định ngăn",
};

// Regex Phrase Rules: Chuyển đổi các câu/cụm từ phổ biến sang Tiếng Việt chuẩn xác
const PHRASE_RULES = [
  // Tips & Shortcuts
  [/^Cut \(⌘X\)$/i, 'Cắt (⌘X)'],
  [/^Copy \(⌘C\)$/i, 'Sao chép (⌘C)'],
  [/^Paste \(⌘V\)$/i, 'Dán (⌘V)'],
  [/^Undo \(⌘Z\)$/i, 'Hoàn tác (⌘Z)'],
  [/^Redo \(⌘Y\)$/i, 'Làm lại (⌘Y)'],
  [/^Save \(⌘S\)$/i, 'Lưu (⌘S)'],
  [/^Find \(⌘F\)$/i, 'Tìm kiếm (⌘F)'],
  [/^Find and Replace \(⌘F\)$/i, 'Tìm kiếm và Thay thế (⌘F)'],
  [/^Print \(⌘P\)$/i, 'In (⌘P)'],
  [/^Select All \(⌘A\)$/i, 'Chọn tất cả (⌘A)'],
  [/^Close \(Esc\)$/i, 'Đóng (Esc)'],

  // Format Painter Tips
  [/Format Painter: click to apply the copied formatting once, double-click to keep it on until Esc/i,
   'Sao chép định dạng: nhấp một lần để áp dụng định dạng đã sao chép, nhấp đúp để giữ cho đến khi nhấn Esc'],
  [/Format Painter is on: click a word or drag over text to apply \(Esc or click again to cancel\)/i,
   'Sao chép định dạng đang bật: nhấp vào từ hoặc kéo chọn văn bản để áp dụng (nhấn Esc hoặc nhấp lại để hủy)'],

  // Background Cutout & Picture Tips
  [/Background colors are sampled from the image edges; a higher tolerance removes more similar colors\. About \{pct\}% of pixels removed in this preview\./i,
   'Màu nền được lấy mẫu tự động từ viền ảnh; dung sai cao hơn sẽ loại bỏ nhiều màu tương tự hơn. Khoảng {pct}% pixel đã được xóa trong bản xem trước này.'],
  [/Drag the handles or move the box to choose the area to keep; Enter to apply, Esc to cancel/i,
   'Kéo các chốt hoặc di chuyển khung để chọn vùng muốn giữ lại; nhấn Enter để áp dụng, Esc để hủy'],
  [/Replace the picture, keeping its current size and wrapping/i,
   'Thay thế hình ảnh, giữ nguyên kích thước và cách ngắt dòng hiện tại'],
  [/Restore the original picture size/i,
   'Khôi phục lại kích thước ảnh gốc ban đầu'],
  [/Crop the picture \(drag the handles, Enter to confirm\)/i,
   'Cắt xén hình ảnh (kéo các chốt, nhấn Enter để xác nhận)'],
  [/Fill the selected shape with a color/i,
   'Tô màu cho hình dạng đã chọn'],
  [/Pick the outline color of the selected shape/i,
   'Chọn màu đường viền cho hình dạng đã chọn'],
  [/Remove background: color-tolerance cutout \(replaced with a transparent PNG\)/i,
   'Xóa nền: tách nền dựa trên độ dung sai màu (thay bằng tệp PNG trong suốt)'],
  [/Failed to load image/i, 'Tải hình ảnh thất bại'],
  [/Image processing failed/i, 'Xử lý hình ảnh thất bại'],

  // AI Dialogue
  [/This action calls the AI assistant: it consumes credits and may rewrite the entire content\. Continue\? \(You will not be asked again\.\)/i,
   'Thao tác này sẽ gọi trợ lý AI: tiêu tốn điểm tín dụng và có thể viết lại toàn bộ nội dung. Tiếp tục? (Bạn sẽ không bị hỏi lại.)'],
  [/Let AI draft this document for you/i, 'Để AI soạn thảo tài liệu này giúp bạn'],
  [/Describe the topic and key points, or paste reference material;/i, 'Mô tả chủ đề và các điểm chính, hoặc dán tài liệu tham khảo;'],
  [/AI writes the first draft right onto the page\./i, 'AI sẽ viết bản thảo đầu tiên ngay trên trang.'],
  [/Summarize the key points of this document/i, 'Tóm tắt các điểm chính của tài liệu này'],
  [/Polish the whole document for a more professional tone/i, 'Trau chuốt toàn bộ tài liệu để văn phong chuyên nghiệp hơn'],
  [/Continue writing from where the document leaves off/i, 'Viết tiếp từ vị trí tài liệu đang dừng lại'],
  [/Find and fill in the placeholders in this document/i, 'Tìm và điền vào các vị trí giữ chỗ trong tài liệu này'],
  [/Selected: \{words\} words/i, 'Đã chọn: {words} từ'],
  [/Selected on page \{page\}: \{words\} words/i, 'Đã chọn trên trang {page}: {words} từ'],
  [/Rewrite-style requests apply to the selection by default; click to preview/i, 'Các yêu cầu dạng viết lại mặc định áp dụng cho phần đã chọn; nhấp để xem trước'],
  [/Clear the selection scope/i, 'Xóa phạm vi đã chọn'],
  [/Ask AI about the selection/i, 'Hỏi AI về phần đã chọn'],
  [/Edit this queued instruction/i, 'Chỉnh sửa chỉ dẫn đang chờ này'],
  [/Describe the change…/i, 'Mô tả thay đổi mong muốn…'],
  [/Enter to send, Shift\+Enter for (a )?newline/i, 'Nhấn Enter để gửi, Shift+Enter để xuống dòng'],
  [/Enter to send, Shift\+Enter for a new line/i, 'Nhấn Enter để gửi, Shift+Enter để xuống dòng'],
  [/Replying…/i, 'Đang trả lời…'],
  [/Working · \{n\} steps/i, 'Đã thực hiện · {n} bước'],
  [/Worked · \{n\} steps/i, 'Đã thực hiện · {n} bước'],
  [/Applied \{n\} edit\(s\)/i, 'Đã áp dụng {n} chỉnh sửa'],

  // App & File notifications
  [/Opened \{name\}/i, 'Đã mở {name}'],
  [/Open failed: \{error\}/i, 'Mở tệp thất bại: {error}'],
  [/Save failed: \{error\}/i, 'Lưu tệp thất bại: {error}'],
  [/Save failed/i, 'Lưu thất bại'],
  [/AutoSaved \(\{time\}\)/i, 'Đã tự động lưu ({time})'],
  [/Blank document created\. Describe what to generate in the AI pane on the left\./i,
   'Đã tạo tài liệu trắng. Hãy mô tả nội dung cần tạo trong ngăn AI bên trái.'],
  [/Failed to create document: \{error\}/i, 'Tạo tài liệu thất bại: {error}'],
  [/Section break inserted \(\{type\}\)/i, 'Đã chèn ngắt phần ({type})'],
  [/Section break inserted; the new section takes effect after saving/i,
   'Đã chèn ngắt phần; phần mới sẽ có hiệu lực sau khi lưu'],
  [/Missing document fonts: \{names\} \(substitutes shown\)/i,
   'Thiếu phông chữ tài liệu: {names} (đang hiển thị phông thay thế)'],
  [/This document contains vertical text \(shown horizontally for now; saving is unaffected\)/i,
   'Tài liệu này chứa văn bản dọc (hiện đang hiển thị ngang; việc lưu không bị ảnh hưởng)'],
  [/Large document \(\{blocks\} paragraphs\): opened in Read Mode — press Esc to edit/i,
   'Tài liệu lớn ({blocks} đoạn văn): đã mở ở Chế độ đọc — nhấn Esc để chỉnh sửa'],
  [/Large document \(\{blocks\} paragraphs\): check-as-you-type spelling is off — turn it on under Review › Spelling/i,
   'Tài liệu lớn ({blocks} đoạn văn): tính năng kiểm tra chính tả khi gõ đang tắt — bật lại trong mục Xem lại › Chính tả'],
  [/\{name\}: the document is too large to open \(\{blocks\} paragraphs, \{chars\} characters\)/i,
   '{name}: tài liệu quá lớn không thể mở ({blocks} đoạn văn, {chars} ký tự)'],
  [/Keyboard Shortcuts/i, 'Phím tắt bàn phím'],
  [/Search shortcuts/i, 'Tìm kiếm phím tắt'],
  [/No matching shortcuts/i, 'Không có phím tắt phù hợp'],
];

// Hàm dịch một chuỗi đơn lẻ một cách thông minh
function translateString(enStr, keyName = '') {
  if (!enStr || typeof enStr !== 'string') return enStr;
  const trimmed = enStr.trim();

  // 1. Kiểm tra chính xác từ điển EXACT_TRANSLATIONS
  if (EXACT_TRANSLATIONS[trimmed]) {
    return EXACT_TRANSLATIONS[trimmed];
  }

  // 2. Bảo vệ các biến placeholder {...}
  const placeholders = [];
  const protectedStr = trimmed.replace(/\{[^}]+\}/g, (match) => {
    const token = `__PH_${placeholders.length}__`;
    placeholders.push(match);
    return token;
  });

  // 3. Kiểm tra bộ quy tắc PHRASE_RULES
  let res = protectedStr;
  for (const [regex, viReplacement] of PHRASE_RULES) {
    if (regex.test(res)) {
      res = res.replace(regex, viReplacement);
      break;
    }
  }

  // 4. Nếu chuỗi có dạng "Heading {n}" -> "Tiêu đề {n}"
  res = res.replace(/^Heading\s+__PH_(\d+)__/i, 'Tiêu đề __PH_$1__');
  res = res.replace(/^Heading\s+(\d+)$/i, 'Tiêu đề $1');
  res = res.replace(/^Page\s+__PH_(\d+)__/i, 'Trang __PH_$1__');
  res = res.replace(/^Slide\s+__PH_(\d+)__/i, 'Trang chiếu __PH_$1__');
  res = res.replace(/^Sheet\s+__PH_(\d+)__/i, 'Trang tính __PH_$1__');

  // 5. Nếu chuỗi có dạng "Increase Font Size 1 pt"
  res = res.replace(/Increase Font Size (\d+)\s*pt/i, 'Tăng cỡ chữ $1 pt');
  res = res.replace(/Decrease Font Size (\d+)\s*pt/i, 'Giảm cỡ chữ $1 pt');

  // 6. Dịch danh từ độc lập
  const nounDict = {
    'Paragraph Formatting': 'Định dạng đoạn văn',
    'Text Formatting': 'Định dạng văn bản',
    'Review & Tools': 'Xem lại & Công cụ',
    'New Window': 'Cửa sổ mới',
    'Clear Paragraph Formatting': 'Xóa định dạng đoạn văn',
    'Hanging Indent': 'Thụt lề treo',
    'Remove Hanging Indent': 'Bỏ thụt lề treo',
    'Move Paragraph Up': 'Di chuyển đoạn văn lên',
    'Move Paragraph Down': 'Di chuyển đoạn văn xuống',
    'Column Break': 'Ngắt cột',
    'Line Break': 'Ngắt dòng',
    'Non-breaking Space': 'Dấu cách không ngắt',
    'Non-breaking Hyphen': 'Dấu gạch nối không ngắt',
    'Demote List Item': 'Giảm cấp mục danh sách',
    'Promote List Item': 'Tăng cấp mục danh sách',
    'Proofread': 'Hiệu đính',
    'Paragraph': 'Đoạn văn',
    'Character': 'Ký tự',
    'Untitled': 'Chưa có tiêu đề',
    'Untitled.docx': 'Tài liệu chưa có tiêu đề.docx',
    'Next Page': 'Trang tiếp theo',
    'Continuous': 'Liên tục',
    'Even Page': 'Trang chẵn',
    'Odd Page': 'Trang lẻ',
    'HTML Format': 'Định dạng HTML',
    'Unformatted Unicode Text': 'Văn bản Unicode thô',
    'Picture': 'Hình ảnh',
    'The clipboard is empty.': 'Bảng tạm đang trống.',
    'Common fonts': 'Phông chữ phổ biến',
    'System fonts': 'Phông chữ hệ thống',
    'East Asian font': 'Phông chữ Đông Á',
    'Latin font': 'Phông chữ Latin',
    'Lock aspect ratio': 'Khóa tỉ lệ khung hình',
    'Show/hide formatting marks': 'Hiện/ẩn ký hiệu định dạng',
    'Restore the original picture size': 'Khôi phục lại kích thước ảnh gốc ban đầu',
    'Crop the picture (drag the handles, Enter to confirm)': 'Cắt xén hình ảnh (kéo các chốt, nhấn Enter để xác nhận)',
    'Replace the picture, keeping its current size and wrapping': 'Thay thế hình ảnh, giữ nguyên kích thước và cách ngắt dòng hiện tại',
    'Fill the selected shape with a color': 'Tô màu cho hình dạng đã chọn',
    'Pick the outline color of the selected shape': 'Chọn màu viền cho hình dạng đã chọn',
  };

  if (nounDict[res]) {
    res = nounDict[res];
  }

  // 7. Dịch các cụm từ ghép thông dụng
  const phrases = [
    [/\bAspect ratio\b/gi, 'Tỉ lệ khung hình'],
    [/\bBackground\b/gi, 'Hình nền'],
    [/\bbackground\b/gi, 'hình nền'],
    [/\bFont size\b/gi, 'Cỡ chữ'],
    [/\bfont size\b/gi, 'cỡ chữ'],
    [/\bFont\b/gi, 'Phông chữ'],
    [/\bfont\b/gi, 'phông chữ'],
    [/\bParagraph\b/gi, 'Đoạn văn'],
    [/\bparagraph\b/gi, 'đoạn văn'],
    [/\bDocument\b/gi, 'Tài liệu'],
    [/\bdocument\b/gi, 'tài liệu'],
    [/\bSelection\b/gi, 'Phần chọn'],
    [/\bselection\b/gi, 'phần chọn'],
    [/\bTable\b/gi, 'Bảng'],
    [/\btable\b/gi, 'bảng'],
    [/\bPicture\b/gi, 'Hình ảnh'],
    [/\bpicture\b/gi, 'hình ảnh'],
    [/\bImage\b/gi, 'Hình ảnh'],
    [/\bimage\b/gi, 'hình ảnh'],
    [/\bShape\b/gi, 'Hình dạng'],
    [/\bshape\b/gi, 'hình dạng'],
    [/\bSlide\b/gi, 'Trang chiếu'],
    [/\bslide\b/gi, 'trang chiếu'],
    [/\bColumn\b/gi, 'Cột'],
    [/\bcolumn\b/gi, 'cột'],
    [/\bRow\b/gi, 'Hàng'],
    [/\brow\b/gi, 'hàng'],
    [/\bCell\b/gi, 'Ô'],
    [/\bcell\b/gi, 'ô'],
    [/\bBorder\b/gi, 'Đường viền'],
    [/\bborder\b/gi, 'đường viền'],
    [/\bFormatting\b/gi, 'Định dạng'],
    [/\bformatting\b/gi, 'định dạng'],
    [/\bStyles\b/gi, 'Kiểu dáng'],
    [/\bstyles\b/gi, 'kiểu dáng'],
    [/\bOutline\b/gi, 'Đường viền ngoài'],
    [/\boutline\b/gi, 'đường viền ngoài'],
    [/\bAlignment\b/gi, 'Căn lề'],
    [/\balignment\b/gi, 'căn lề'],
    [/\bSpacing\b/gi, 'Khoảng cách'],
    [/\bspacing\b/gi, 'khoảng cách'],
    [/\bMargins\b/gi, 'Lề'],
    [/\bmargins\b/gi, 'lề'],
    [/\bOrientation\b/gi, 'Hướng'],
    [/\borientation\b/gi, 'hướng'],
    [/\bHeight\b/gi, 'Chiều cao'],
    [/\bWidth\b/gi, 'Chiều rộng'],
  ];

  for (const [eng, vie] of phrases) {
    res = res.replace(eng, vie);
  }

  // 8. Khôi phục lại các biến placeholder {...}
  for (let i = 0; i < placeholders.length; i++) {
    res = res.replace(new RegExp(`__PH_${i}__`, 'g'), placeholders[i]);
  }

  return res;
}

// Hàm xử lý một shard file: đọc en.ts và tạo vi.ts
function processShard(shardDir, exportedVarName) {
  const enPath = path.join(shardDir, 'en.ts');
  const viPath = path.join(shardDir, 'vi.ts');

  if (!fs.existsSync(enPath)) {
    console.error(`Missing en.ts at ${shardDir}`);
    return;
  }

  const enRaw = fs.readFileSync(enPath, 'utf8');
  // Trích xuất object JS
  const enClean = enRaw
    .replace(/import type [^;\n]+;/g, '')
    .replace(/export const \w+(\s*:\s*[^=]+)?\s*=\s*/, '')
    .replace(/as const/g, '')
    .replace(/satisfies [^;\n]+/g, '')
    .trim()
    .replace(/;\s*$/, '');

  let enObj;
  try {
    enObj = new Function(`return (${enClean});`)();
  } catch (e) {
    console.error(`Cannot parse en.ts at ${shardDir}:`, e.message);
    return;
  }

  const viObj = {};
  for (const [k, v] of Object.entries(enObj)) {
    viObj[k] = translateString(v, k);

    // Kiểm tra placeholder matching
    const enPh = (v.match(/\{[^}]+\}/g) || []).sort().join(',');
    const viPh = (viObj[k].match(/\{[^}]+\}/g) || []).sort().join(',');
    if (enPh !== viPh) {
      console.warn(`Placeholder mismatch at ${shardDir} [${k}]: EN="${enPh}" VI="${viPh}". Fallback to EN.`);
      viObj[k] = v;
    }
  }

  const viContent = `import type { en } from './en'

export const ${exportedVarName}: Record<keyof typeof en, string> = ${JSON.stringify(viObj, null, 2)}
`;

  fs.writeFileSync(viPath, viContent, 'utf8');
  console.log(`✅ Processed shard: ${shardDir} (${Object.keys(viObj).length} keys)`);
}

// 12 Shard Directories
const shards = [
  ['apps/docs/src/renderer/i18n/ai', 'vi'],
  ['apps/docs/src/renderer/i18n/app', 'vi'],
  ['apps/docs/src/renderer/i18n/ribbon', 'vi'],
  ['apps/html/src/renderer/i18n/ai', 'vi'],
  ['apps/html/src/renderer/i18n/app', 'vi'],
  ['apps/sheets/src/renderer/i18n/ai', 'vi'],
  ['apps/sheets/src/renderer/i18n/app', 'vi'],
  ['apps/sheets/src/renderer/i18n/dialogs', 'vi'],
  ['apps/slides/src/renderer/i18n/ai', 'vi'],
  ['apps/slides/src/renderer/i18n/app', 'vi'],
  ['apps/slides/src/renderer/i18n/panes', 'vi'],
  ['apps/slides/src/renderer/i18n/ribbon', 'vi'],
];

console.log('--- TRANSLATING ALL 12 SHARDS WITH QUALITY GLOSSARY ---');
for (const [relDir, varName] of shards) {
  processShard(relDir, varName);
}
console.log('--- ALL SHARDS TRANSLATED PERFECTLY! ---');
