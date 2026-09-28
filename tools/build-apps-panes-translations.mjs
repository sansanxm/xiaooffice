import fs from 'node:fs';

const rawMissing = JSON.parse(fs.readFileSync('tools/i18n-engine/missing-apps-panes.json', 'utf8'));

// Base translation glossary for Apps & Panes
const APPS_PANES_GLOSSARY = {
  // Shortcuts
  "Keyboard Shortcuts": "Phím tắt bàn phím",
  "Search shortcuts": "Tìm kiếm phím tắt",
  "No matching shortcuts": "Không tìm thấy phím tắt phù hợp",
  "Edit": "Chỉnh sửa",
  "Text Formatting": "Định dạng văn bản",
  "Paragraph Formatting": "Định dạng đoạn văn",
  "Review & Tools": "Xem lại & Công cụ",
  "New Window": "Cửa sổ mới",
  "Clear Paragraph Formatting": "Xóa định dạng đoạn văn",
  "Hanging Indent": "Thụt lề treo (Hanging Indent)",
  "Remove Hanging Indent": "Xóa thụt lề treo",
  "Move Paragraph Up": "Di chuyển đoạn văn lên",
  "Move Paragraph Down": "Di chuyển đoạn văn xuống",
  "Column Break": "Ngắt cột",
  "Line Break": "Ngắt dòng",
  "Non-breaking Space": "Khoảng trắng không ngắt",
  "Non-breaking Hyphen": "Dấu gạch nối không ngắt",
  "Increase Font Size 1 pt": "Tăng cỡ chữ 1 pt",
  "Decrease Font Size 1 pt": "Giảm cỡ chữ 1 pt",
  "Demote List Item": "Hạ cấp mục danh sách",
  "Promote List Item": "Nâng cấp mục danh sách",
  "Proofread": "Hiệu đính",
  "Update": "Cập nhật",
  "New": "Mới",
  "Ready": "Sẵn sàng",
  "Untitled.docx": "Chưa đặt tên.docx",

  // Large document & Fonts
  "Blank document created. Describe what to generate in the AI pane on the left.": "Đã tạo tài liệu trống. Mô tả nội dung cần tạo trong bảng AI ở bên trái.",
  "Numbering restarted": "Đã đánh số lại từ đầu",
  "Numbering continued": "Đã tiếp tục đánh số",
  "No fields to update": "Không có trường nào để cập nhật",
  "Page number format set": "Đã đặt định dạng số trang",
  "Page Number Format": "Định dạng số trang",
  "Continue from previous section": "Tiếp tục từ phần trước",
  "Leave \"Start at\" blank to continue from the previous section": "Để trống \"Bắt đầu tại\" để tiếp tục từ phần trước",
  "Exporting PDF…": "Đang xuất PDF…",
  "Exporting HTML…": "Đang xuất HTML…",
  "Export PDF": "Xuất PDF",
  "failed to print page group": "in nhóm trang thất bại",
  "Print": "In",
  "Preparing to print…": "Đang chuẩn bị in…",
  "Range": "Phạm vi",
  "All slides": "Tất cả trang chiếu",
  "Current slide": "Trang chiếu hiện tại",
  "Custom range": "Phạm vi tùy chỉnh",
  "No slides to print": "Không có trang chiếu nào để in",
  "Generating preview…": "Đang tạo bản xem trước…",
  "Previous page": "Trang trước",
  "Next page": "Trang tiếp theo",
  "PDF export canceled": "Đã hủy xuất PDF",
  "HTML export canceled": "Đã hủy xuất HTML",
  "Exporting images…": "Đang xuất hình ảnh…",
  "The selection is no longer valid; reselect the text to comment on": "Vùng chọn không còn hợp lệ; vui lòng chọn lại đoạn văn bản cần nhận xét",
  "Comment added; written to the document on save": "Đã thêm nhận xét; sẽ được ghi vào tài liệu khi lưu",
  "Comment updated; written to the document on save": "Đã cập nhật nhận xét; sẽ được ghi vào tài liệu khi lưu",
  "The original comment's anchor no longer exists; cannot reply": "Vị trí gắn nhận xét gốc không còn tồn tại; không thể trả lời",
  "Reply added; written to the document on save": "Đã thêm câu trả lời; sẽ được ghi vào tài liệu khi lưu",
  "Comment resolved": "Nhận xét đã được giải quyết",
  "Comment reopened": "Nhận xét đã được mở lại",
  "Type a comment…": "Nhập nhận xét…",
  "(Unknown author)": "(Tác giả không xác định)",
  "Resolved": "Đã giải quyết",

  // Panes in Slides
  "Format Shape": "Định dạng hình dạng",
  "Fill": "Tô màu",
  "Line": "Đường viền",
  "Effects": "Hiệu ứng",
  "Size & Properties": "Kích thước & Thuộc tính",
  "Text Options": "Tùy chọn văn bản",
  "Solid fill": "Tô màu đơn sắc",
  "Gradient fill": "Tô màu dải màu (Gradient)",
  "Picture or texture fill": "Tô bằng hình ảnh hoặc chất liệu",
  "Pattern fill": "Tô bằng hoa văn",
  "Slide background fill": "Tô màu nền trang chiếu",
  "Color": "Màu sắc",
  "Transparency": "Độ trong suốt",
  "Solid line": "Đường nét liền",
  "Gradient line": "Đường nét dải màu",
  "Width": "Độ rộng",
  "Compound type": "Loại nét kết hợp",
  "Dash type": "Kiểu nét đứt",
  "Cap type": "Kiểu đầu nét",
  "Join type": "Kiểu góc nối",
  "Shadow": "Đổ bóng",
  "Reflection": "Phản chiếu",
  "Glow": "Phát sáng",
  "Soft Edges": "Làm mềm cạnh",
  "3-D Format": "Định dạng 3D",
  "3-D Rotation": "Xoay 3D",
  "Top bevel": "Góc vát trên",
  "Bottom bevel": "Góc vát dưới",
  "Depth": "Độ sâu",
  "Contour": "Đường bao viền",
  "Material": "Chất liệu bề mặt",
  "Lighting": "Ánh sáng",
  "Angle": "Góc quay",
  "Distance": "Khoảng cách",
  "Blur": "Độ mờ",
  "Size": "Kích thước",
  "Presets": "Kiểu mẫu có sẵn",
  "Text fill": "Tô màu văn bản",
  "Text outline": "Viền văn bản",
  "Vertical alignment": "Căn lề theo chiều dọc",
  "Text direction": "Hướng văn bản",
  "Top margin": "Lề trên",
  "Bottom margin": "Lề dưới",
  "Left margin": "Lề trái",
  "Right margin": "Lề phải",
  "Wrap text in shape": "Tự động xuống dòng trong hình",
  "Columns": "Cột",
  "Number of columns": "Số cột",
  "Spacing": "Khoảng cách",

  // HTML App
  "HTML Editor": "Trình soạn thảo HTML",
  "Preview": "Xem trước",
  "Code": "Mã nguồn",
  "Split View": "Xem song song",
  "New HTML Document": "Tài liệu HTML mới",
  "Export as HTML…": "Xuất dưới dạng HTML…",
  "Save HTML": "Lưu HTML",
  "Insert Tag": "Chèn thẻ",
  "Format Code": "Định dạng mã nguồn",
  "Word Wrap": "Tự động xuống dòng",
  "Line Numbers": "Số dòng",
};

// Parameterized translations
function translateAppPaneString(val, key) {
  if (APPS_PANES_GLOSSARY[val]) return APPS_PANES_GLOSSARY[val];

  let s = val;

  // Patterns
  if (s.startsWith('Opened ')) return s.replace('Opened ', 'Đã mở ');
  if (s.startsWith('AutoSaved (')) return s.replace('AutoSaved (', 'Đã tự động lưu (');
  if (s.startsWith('Section break inserted (')) return s.replace('Section break inserted (', 'Đã chèn dấu ngắt phần (');
  if (s.startsWith('Page setup applied to section ')) return s.replace('Page setup applied to section ', 'Đã áp dụng thiết lập trang cho phần ').replace('; written to the document on save', '; sẽ được ghi khi lưu');
  if (s.startsWith('Inserted field ')) return s.replace('Inserted field ', 'Đã chèn trường ');
  if (s.startsWith('Updated ') && s.endsWith(' fields')) return s.replace('Updated ', 'Đã cập nhật ').replace(' fields', ' trường');
  if (s.startsWith('Style "') && s.includes('" updated from the selection')) {
    return s.replace('Style "', 'Kiểu "').replace('" updated from the selection; written to the document on save', '" đã cập nhật từ vùng chọn; sẽ được ghi khi lưu');
  }
  if (s.startsWith('Style "') && s.includes('" created and applied to the selection')) {
    return s.replace('Style "', 'Kiểu "').replace('" created and applied to the selection', '" đã được tạo và áp dụng cho vùng chọn');
  }
  if (s.startsWith('; applies to section ')) return s.replace('; applies to section ', '; áp dụng cho phần ');
  if (s.startsWith('PDF export failed: ')) return s.replace('PDF export failed: ', 'Xuất PDF thất bại: ');
  if (s.startsWith('HTML export failed: ')) return s.replace('HTML export failed: ', 'Xuất HTML thất bại: ');
  if (s.startsWith('PDF exported: ')) return s.replace('PDF exported: ', 'Đã xuất PDF: ');
  if (s.startsWith('HTML exported: ')) return s.replace('HTML exported: ', 'Đã xuất HTML: ');
  if (s.startsWith('Exported ') && s.includes(' images to ')) return s.replace('Exported ', 'Đã xuất ').replace(' images to ', ' hình ảnh vào ');
  if (s.startsWith('Image export failed: ')) return s.replace('Image export failed: ', 'Xuất hình ảnh thất bại: ');
  if (s.startsWith('Comments (')) return s.replace('Comments (', 'Nhận xét (');
  if (s.startsWith('Resolved comments (')) return s.replace('Resolved comments (', 'Nhận xét đã giải quyết (');
  if (s.includes('the document is too large to open')) {
    return s.replace('the document is too large to open (', 'tài liệu quá lớn không thể mở (')
      .replace(' paragraphs, ', ' đoạn văn, ')
      .replace(' characters)', ' ký tự)');
  }
  if (s.includes('opened in Read Mode — press Esc to edit')) {
    return s.replace('Large document (', 'Tài liệu lớn (')
      .replace(' paragraphs): opened in Read Mode — press Esc to edit', ' đoạn văn): đã mở ở Chế độ đọc — nhấn Esc để chỉnh sửa');
  }
  if (s.includes('check-as-you-type spelling is off')) {
    return s.replace('Large document (', 'Tài liệu lớn (')
      .replace(' paragraphs): check-as-you-type spelling is off — turn it on under Review › Spelling', ' đoạn văn): tính năng kiểm tra chính tả khi nhập đang tắt — bật lại trong Xem lại › Chính tả');
  }
  if (s.startsWith('Missing document fonts: ')) {
    return s.replace('Missing document fonts: ', 'Thiếu phông chữ tài liệu: ').replace(' (substitutes shown)', ' (đang hiển thị phông chữ thay thế)');
  }
  if (s.startsWith('Failed to create document: ')) return s.replace('Failed to create document: ', 'Tạo tài liệu thất bại: ');
  if (s.startsWith('Section break inserted; the new section takes effect after saving')) return 'Đã chèn dấu ngắt phần; phần mới sẽ có hiệu lực sau khi lưu';

  // Common phrase replacement table
  const replacements = [
    [/written to the document on save/g, 'sẽ được ghi vào tài liệu khi lưu'],
    [/written into the file on save/g, 'được ghi vào tệp khi lưu'],
    [/failed to load: /g, 'tải thất bại: '],
    [/failed to read/g, 'đọc thất bại'],
    [/does not exist/g, 'không tồn tại'],
    [/cannot be changed/g, 'không thể thay đổi'],
    [/cannot be deleted/g, 'không thể xóa'],
    [/is not supported/g, 'chưa được hỗ trợ'],
    [/Export as /g, 'Xuất dưới dạng '],
  ];

  for (const [re, rep] of replacements) {
    s = s.replace(re, rep);
  }

  return s;
}

const result = {};
let count = 0;
for (const [k, v] of Object.entries(rawMissing)) {
  const trans = translateAppPaneString(v, k);
  result[k] = trans;
  count++;
}

fs.writeFileSync('tools/i18n-data/apps-panes-full-dict.json', JSON.stringify(result, null, 2), 'utf8');
console.log(`Successfully built apps-panes-full-dict.json with ${count} keys!`);
