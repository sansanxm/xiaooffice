import fs from 'node:fs';

const list = JSON.parse(fs.readFileSync('tools/i18n-engine/final-untranslated.json', 'utf8'));

// Master Vietnamese dictionary for context menus, app strings, dialogs, warnings
const MASTER_APP_MAP = {
  // Context Menus
  "Keep Text Only": "Chỉ giữ lại văn bản",
  "Always use this choice": "Luôn sử dụng lựa chọn này",
  "Font…": "Phông chữ…",
  "Paragraph…": "Đoạn văn…",
  "Update Field": "Cập nhật trường",
  "Toggle Field Codes": "Bật/tắt mã trường",
  "Edit Field…": "Chỉnh sửa trường…",
  "Field code": "Mã trường",
  "Restart at 1": "Bắt đầu lại từ 1",
  "Continue Numbering": "Tiếp tục đánh số",
  "Set Numbering Value…": "Đặt giá trị đánh số…",
  "Adjust List Indents…": "Điều chỉnh thụt lề danh sách…",
  "No Suggestions": "Không có gợi ý",
  "Add to Dictionary": "Thêm vào từ điển",
  "Ignore All": "Bỏ qua tất cả",
  "Synonyms": "Từ đồng nghĩa",
  "Uses AI": "Sử dụng AI",
  "View Image": "Xem hình ảnh",
  "Save Image As…": "Lưu hình ảnh dưới dạng…",
  "Actual Size": "Kích thước thực tế",
  "Hyperlink…": "Siêu liên kết…",
  "Edit Hyperlink…": "Chỉnh sửa siêu liên kết…",
  "Open Hyperlink": "Mở siêu liên kết",
  "Copy Hyperlink": "Sao chép siêu liên kết",
  "Remove Hyperlink": "Xóa siêu liên kết",
  "In Line with Text": "Cùng dòng với văn bản",
  "Square · picture left": "Vuông · hình bên trái",
  "Square · picture right": "Vuông · hình bên phải",
  "Top and Bottom": "Trên và dưới",
  "Behind Text": "Dưới văn bản",
  "In Front of Text": "Trên văn bản",
  "Bring to Front": "Đưa lên trên cùng",
  "Bring Forward": "Đưa lên phía trước",
  "Send Backward": "Đưa về phía sau",
  "Send to Back": "Đưa xuống dưới cùng",
  "Asian / Latin font": "Phông chữ châu Á / Latin",
  "Font style": "Kiểu phông chữ",
  "Regular": "Thường",
  "Bold Italic": "Đậm nghiêng",
  "Font color": "Màu phông chữ",
  "Double strikethrough": "Gạch ngang đôi",
  "Small caps": "Chữ hoa nhỏ (Small caps)",
  "All caps": "Chữ hoa toàn bộ (All caps)",
  "Hidden": "Ẩn",
  "Scale (%)": "Tỷ lệ (%)",
  "Paste as Plain Text": "Dán dưới dạng văn bản thuần",
  "Paste Options": "Tùy chọn dán",
  "Keep Source Formatting": "Giữ nguyên định dạng nguồn",
  "Merge Formatting": "Hòa trộn định dạng",
  "Decimal": "Thập phân",
  "AI Settings": "Cài đặt AI",
  "Genspark account": "Tài khoản Genspark",
  "Checking…": "Đang kiểm tra…",
  "Signed in": "Đã đăng nhập",
  "Sign in to Genspark": "Đăng nhập Genspark",
  "Model": "Mô hình",

  // Table Context Menu
  "Insert Rows Above": "Chèn hàng lên trên",
  "Insert Rows Below": "Chèn hàng xuống dưới",
  "Insert Columns to the Left": "Chèn cột sang trái",
  "Insert Columns to the Right": "Chèn cột sang phải",
  "Delete Rows": "Xóa hàng",
  "Delete Columns": "Xóa cột",
  "Delete Table": "Xóa bảng",
  "Merge Cells": "Hợp nhất các ô",
  "Split Cells…": "Tách ô…",
  "Distribute Rows Evenly": "Phân bổ đều các hàng",
  "Distribute Columns Evenly": "Phân bổ đều các cột",
  "Borders and Shading…": "Đường viền và Đổ bóng…",
  "Table Properties…": "Thuộc tính bảng…",

  // Cell Properties & Paragraph Alignment
  "Alignment": "Căn lề",
  "Left": "Trái",
  "Right": "Phải",
  "Center": "Giữa",
  "Justified": "Đều",
  "Indentation": "Thụt lề",
  "Special": "Đặc biệt",
  "Spacing": "Khoảng cách",
  "Before": "Trước",
  "After": "Sau",
  "Line spacing": "Giãn dòng",
  "Single": "Đơn",
  "1.5 lines": "1,5 dòng",
  "Double": "Đôi",
  "At least": "Tối thiểu",
  "Exactly": "Chính xác",
  "Multiple": "Nhiều dòng",
  "At": "Tại",

  // Sheets Context & Actions
  "Insert…": "Chèn…",
  "Delete…": "Xóa…",
  "Clear Contents": "Xóa nội dung",
  "Format Cells…": "Định dạng ô…",
  "Row Height…": "Chiều cao hàng…",
  "Column Width…": "Độ rộng cột…",
  "Hide": "Ẩn",
  "Unhide": "Bỏ ẩn",
  "Rename…": "Đổi tên…",
  "Move or Copy…": "Di chuyển hoặc Sao chép…",
  "Tab Color": "Màu thẻ trang tính",
  "View Code": "Xem mã nguồn",
  "Protect Sheet…": "Bảo vệ trang tính…",
  "Select All Sheets": "Chọn tất cả trang tính",
  "Ungroup Sheets": "Hủy nhóm trang tính",
  "Insert Copied Cells": "Chèn các ô đã sao chép",
  "Insert Cut Cells": "Chèn các ô đã cắt",

  // Common Messages & Hints
  "This document contains vertical text (shown horizontally for now; saving is unaffected)": "Tài liệu này chứa văn bản dọc (tạm thời hiển thị ngang; lưu tệp không bị ảnh hưởng)",
  "Mixed paper sizes: opening pagination preview to export pages merged…": "Khổ giấy hỗn hợp: đang mở bản xem trước phân trang để xuất các trang đã hợp nhất…",
  "All changes accepted": "Đã chấp nhận tất cả thay đổi",
  "All changes rejected": "Đã từ chối tất cả thay đổi",
  "No tracked changes to process": "Không có thay đổi được theo dõi nào cần xử lý",
  "Edit comment": "Chỉnh sửa nhận xét",
  "Delete comment": "Xóa nhận xét",
  "Delete comment (and replies)": "Xóa nhận xét (và các câu trả lời)",
  "Delete reply": "Xóa câu trả lời",
  "This document has no comments": "Tài liệu này không có nhận xét nào",
  "Write-Protected": "Được bảo vệ chống ghi",
  "All ink removed; takes effect after saving": "Đã xóa toàn bộ nét mực; có hiệu lực sau khi lưu",
  "Watermark removed; takes effect after saving": "Đã xóa hình mờ; có hiệu lực sau khi lưu",
  "\"Different First Page\" enabled; switch at the top of the page to edit the first-page header and footer": "Đã bật \"Trang đầu khác biệt\"; chuyển đổi ở đầu trang để sửa đầu trang và chân trang của trang đầu",
  "\"Different First Page\" disabled": "Đã tắt \"Trang đầu khác biệt\"",
  "\"Different Odd & Even Pages\" enabled; switch at the top of the page to edit the even-page header and footer": "Đã bật \"Trang chẵn & lẻ khác nhau\"; chuyển đổi ở đầu trang để sửa đầu trang và chân trang của trang chẵn",
  "\"Different Odd & Even Pages\" disabled": "Đã tắt \"Trang chẵn & lẻ khác nhau\"",
  "First Page": "Trang đầu tiên",
  "Odd Pages": "Các trang lẻ",
  "Even Pages": "Các trang chẵn",
  "Default": "Mặc định",
  "Double-click to edit the header": "Nhấp đúp để chỉnh sửa đầu trang",
  "Double-click to edit the footer": "Nhấp đúp để chỉnh sửa chân trang",
  "Double-click to edit the footnote": "Nhấp đúp để chỉnh sửa chú thích cuối trang",
  "Same as Previous": "Giống phần trước",
  "Delete this header and connect to the header in the previous section?": "Xóa đầu trang này và kết nối với đầu trang ở phần trước?",
  "Delete this footer and connect to the footer in the previous section?": "Xóa chân trang này và kết nối với chân trang ở phần trước?",
  "Opening…": "Đang mở…",
  "Password Protected": "Được bảo vệ bằng mật khẩu",
  "The password is incorrect. Try again.": "Mật khẩu không đúng. Vui lòng thử lại.",
  "The passwords don't match": "Mật khẩu không khớp",
  "Recent Documents": "Tài liệu gần đây",
  "Exit Read Mode (Esc)": "Thoát Chế độ đọc (Esc)",
  "Expand the AI editing pane": "Mở rộng ngăn chỉnh sửa AI",
  "Word Count": "Số đếm từ",
  "Track Changes: On": "Theo dõi thay đổi: Bật",
  "Track Changes: Off": "Theo dõi thay đổi: Tắt",
  "No headings in this document": "Không có tiêu đề nào trong tài liệu này",
  "Search document": "Tìm kiếm tài liệu",
  "Headings": "Tiêu đề",
  "Results": "Kết quả",
  "Type to search the document": "Nhập để tìm kiếm trong tài liệu",
  "No matches": "Không có kết quả phù hợp",
  "Preparing pages…": "Đang chuẩn bị trang…",
  "Expand All": "Mở rộng tất cả",
  "Collapse All": "Thu gọn tất cả",
  "Show Heading Levels": "Hiển thị cấp độ tiêu đề",
  "First Line Indent": "Thụt lề dòng đầu tiên",
  "Left Indent": "Thụt lề trái",
  "Right Indent": "Thụt lề phải",
};

// Parameterized Translation Function
function translateOneItem(text, key) {
  if (MASTER_APP_MAP[text]) return MASTER_APP_MAP[text];

  let s = text;

  // Placeholder matching rules
  if (s.startsWith(': ') && s.includes(' added, ') && s.includes(' deleted, ')) {
    return s.replace(': ', ': đã thêm ').replace(' added, ', ', đã xóa ').replace(' deleted, ', ', đã sửa ').replace(' changed', '');
  }
  if (s.startsWith('… ') && s.endsWith(' identical paragraphs …')) {
    return s.replace('… ', '… ').replace(' identical paragraphs …', ' đoạn văn giống nhau …');
  }
  if (s.startsWith('Signed in: ')) {
    return s.replace('Signed in: ', 'Đã đăng nhập: ');
  }
  if (s.startsWith('Numbering value set to ')) {
    return s.replace('Numbering value set to ', 'Đã đặt giá trị đánh số thành ');
  }
  if (s.startsWith('Page ') && s.includes(' of ')) {
    return s.replace('Page ', 'Trang ').replace(' of ', ' trên ');
  }
  if (s.startsWith('Show Heading ')) {
    return s.replace('Show Heading ', 'Hiển thị tiêu đề ');
  }
  if (s.startsWith('Header -Section ') && s.endsWith('-')) {
    return s.replace('Header -Section ', 'Đầu trang -Phần ').replace('-', '');
  }
  if (s.startsWith('Footer -Section ') && s.endsWith('-')) {
    return s.replace('Footer -Section ', 'Chân trang -Phần ').replace('-', '');
  }
  if (s.startsWith('Tab stop type: ')) {
    return s.replace('Tab stop type: ', 'Loại điểm dừng tab: ').replace(' (click to cycle)', ' (nhấp để chuyển đổi)');
  }
  if (s.includes('tab stop @ ')) {
    return s.replace('tab stop @ ', 'điểm dừng tab tại ');
  }
  if (s.startsWith(', leader: ')) {
    return s.replace(', leader: ', ', ký tự dẫn: ');
  }
  if (s.startsWith('Page ')) {
    return s.replace('Page ', 'Trang ');
  }
  if (s.endsWith(' words')) {
    return s.replace(' words', ' từ');
  }
  if (s.endsWith(' pages')) {
    return s.replace(' pages', ' trang');
  }
  if (s.startsWith('e.g. ')) {
    return s.replace('e.g. ', 'ví dụ: ');
  }
  if (s.startsWith(' (# stands for the automatic page number)')) {
    return ' (# đại diện cho số trang tự động)';
  }
  if (s.startsWith('Source \"') && s.includes('\" added; reference it via Insert Citation')) {
    return s.replace('Source "', 'Đã thêm nguồn "').replace('" added; reference it via Insert Citation', '" — tham chiếu qua Chèn trích dẫn');
  }
  if (s.startsWith('\"') && s.includes('\" is password protected. Enter the password to open it.')) {
    return s.replace('is password protected. Enter the password to open it.', 'được bảo vệ bằng mật khẩu. Nhập mật khẩu để mở.');
  }
  if (s.startsWith('\"') && s.includes('\" has a password to modify. Enter it to edit, or open read-only.')) {
    return s.replace('has a password to modify. Enter it to edit, or open read-only.', 'có mật khẩu sửa đổi. Nhập mật khẩu để chỉnh sửa, hoặc mở ở chế độ chỉ đọc.');
  }

  // Regex phrase conversions
  const rules = [
    [/failed to read/gi, 'đọc thất bại'],
    [/does not exist/gi, 'không tồn tại'],
    [/cannot be changed/gi, 'không thể thay đổi'],
    [/cannot be deleted/gi, 'không thể xóa'],
    [/is not supported/gi, 'chưa được hỗ trợ'],
    [/will be written on save/gi, 'sẽ được ghi khi lưu'],
    [/written into the file on save/gi, 'được ghi vào tệp khi lưu'],
    [/Open an XLSX file first/gi, 'Mở tệp XLSX trước'],
    [/Place the cursor inside/gi, 'Đặt con trỏ bên trong'],
    [/Select a cell/gi, 'Chọn một ô'],
    [/No active sheet/gi, 'Không có trang tính hiện hoạt'],
    [/Refresh failed/gi, 'Làm mới thất bại'],
    [/The workbook is still streaming in/gi, 'Sổ làm việc vẫn đang truyền dữ liệu vào'],
    [/This sheet has no/gi, 'Trang tính này không có'],
    [/This workbook has no/gi, 'Sổ làm việc này không có'],
    [/Merge Workbooks/gi, 'Hợp nhất sổ làm việc'],
    [/Formula bar shown/gi, 'Đã hiển thị thanh công thức'],
    [/Formula bar hidden/gi, 'Đã ẩn thanh công thức'],
    [/Insert Page Break/gi, 'Chèn dấu ngắt trang'],
    [/Remove Page Break/gi, 'Xóa dấu ngắt trang'],
    [/Reset All Page Breaks/gi, 'Đặt lại tất cả dấu ngắt trang'],
    [/Highlight active row & column/gi, 'Đánh dấu hàng & cột hiện hoạt'],
    [/Show page boundaries on the grid/gi, 'Hiển thị ranh giới trang trên lưới'],
    [/Lock the workbook structure/gi, 'Khóa cấu trúc sổ làm việc'],
    [/Ranges that stay editable while the sheet is protected/gi, 'Các phạm vi vẫn có thể chỉnh sửa khi trang tính được bảo vệ'],
    [/Add Data Labels/gi, 'Thêm nhãn dữ liệu'],
    [/Delete Data Labels/gi, 'Xóa nhãn dữ liệu'],
    [/Delete Chart/gi, 'Xóa biểu đồ'],
    [/Recalculate the current PivotTable/gi, 'Tính toán lại PivotTable hiện tại'],
    [/Select the PivotTable area first, then refresh/gi, 'Chọn vùng PivotTable trước, sau đó làm mới'],
    [/Password to open this document/gi, 'Mật khẩu để mở tài liệu này'],
    [/Password to modify this document/gi, 'Mật khẩu để sửa đổi tài liệu này'],
    [/Enter the protection password/gi, 'Nhập mật khẩu bảo vệ'],
    [/Remove author and organization metadata/gi, 'Xóa siêu dữ liệu tác giả và tổ chức'],
    [/Protection settings updated/gi, 'Đã cập nhật cài đặt bảo vệ'],
  ];

  for (const [re, rep] of rules) {
    s = s.replace(re, rep);
  }

  return s;
}

const finalDict = {};
let count = 0;
for (const item of list) {
  const trans = translateOneItem(item.text, item.key);
  finalDict[item.key] = trans;
  count++;
}

fs.writeFileSync('tools/i18n-data/app-final-translations.json', JSON.stringify(finalDict, null, 2), 'utf8');
console.log(`Built app-final-translations.json with ${count} keys!`);
