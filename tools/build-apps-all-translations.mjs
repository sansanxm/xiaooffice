import fs from 'node:fs';

const untranslatedApps = JSON.parse(fs.readFileSync('tools/i18n-engine/untranslated-apps.json', 'utf8'));

// High quality Vietnamese Office translations dictionary
const APP_DICT = {};

for (const item of untranslatedApps) {
  const { key, text } = item;
  let s = text;

  // Exact known matches
  if (text === 'OK') s = 'OK';
  else if (text === 'Cancel') s = 'Hủy';
  else if (text === 'Close') s = 'Đóng';
  else if (text === 'Save') s = 'Lưu';
  else if (text === 'Open') s = 'Mở';
  else if (text === 'Update') s = 'Cập nhật';
  else if (text === 'Delete') s = 'Xóa';
  else if (text === 'Edit') s = 'Chỉnh sửa';
  else if (text === 'Reply') s = 'Trả lời';
  else if (text === 'Reopen') s = 'Mở lại';
  else if (text === 'Resolve') s = 'Giải quyết';
  else if (text === 'Resolved') s = 'Đã giải quyết';
  else if (text === 'Security') s = 'Bảo mật';
  else if (text === 'Protection') s = 'Bảo vệ';
  else if (text === 'Restrict editing') s = 'Hạn chế chỉnh sửa';
  else if (text === 'Tracked changes') s = 'Theo dõi thay đổi';
  else if (text === 'Read only') s = 'Chỉ đọc';
  else if (text === 'Forms') s = 'Biểu mẫu';
  else if (text === 'Privacy') s = 'Quyền riêng tư';
  else if (text === 'Open Read-Only') s = 'Mở chỉ đọc';
  else if (text === 'Protection password') s = 'Mật khẩu bảo vệ';
  else if (text === 'Password') s = 'Mật khẩu';
  else if (text === 'Incorrect password') s = 'Mật khẩu không chính xác';
  else if (text === 'Compare Results') s = 'Kết quả so sánh';
  else if (text === 'Compared with ') s = 'So sánh với ';
  else if (text === 'The two documents are identical') s = 'Hai tài liệu hoàn toàn giống nhau';
  else if (text === '(empty paragraph)') s = '(đoạn văn trống)';
  else if (text === 'First Page') s = 'Trang đầu tiên';
  else if (text === 'Odd Pages') s = 'Các trang lẻ';
  else if (text === 'Even Pages') s = 'Các trang chẵn';
  else if (text === 'Default') s = 'Mặc định';
  else if (text === 'Double-click to edit the header') s = 'Nhấp đúp để chỉnh sửa đầu trang';
  else if (text === 'Double-click to edit the footer') s = 'Nhấp đúp để chỉnh sửa chân trang';
  else if (text === 'Double-click to edit the footnote') s = 'Nhấp đúp để chỉnh sửa chú thích cuối trang';
  else if (text === 'Same as Previous') s = 'Giống phần trước';
  else if (text === 'Edit footnote') s = 'Chỉnh sửa chú thích cuối trang';
  else if (text === 'Delete footnote') s = 'Xóa chú thích cuối trang';
  else if (text === 'Edit endnote') s = 'Chỉnh sửa chú thích cuối tài liệu';
  else if (text === 'Delete endnote') s = 'Xóa chú thích cuối tài liệu';
  else if (text === 'Footnote text…') s = 'Nội dung chú thích cuối trang…';
  else if (text === 'Endnote text…') s = 'Nội dung chú thích cuối tài liệu…';
  else if (text === 'Opening…') s = 'Đang mở…';
  else if (text === 'Password Protected') s = 'Được bảo vệ bằng mật khẩu';
  else if (text === 'Enter the open password') s = 'Nhập mật khẩu mở tài liệu';
  else if (text === 'Enter the password to modify') s = 'Nhập mật khẩu sửa đổi';
  else if (text === 'Show password') s = 'Hiện mật khẩu';
  else if (text === 'Hide password') s = 'Ẩn mật khẩu';
  else if (text === 'The password is incorrect. Try again.') s = 'Mật khẩu không chính xác. Vui lòng thử lại.';
  else if (text === 'Confirm password') s = 'Xác nhận mật khẩu';
  else if (text === 'The passwords don\'t match') s = 'Mật khẩu không khớp';
  else if (text === 'Recent Documents') s = 'Tài liệu gần đây';
  else if (text === 'Remove Split') s = 'Hủy chia khung';
  else if (text === 'Exit Read Mode (Esc)') s = 'Thoát Chế độ đọc (Esc)';
  else if (text === 'Expand the AI editing pane') s = 'Mở rộng ngăn chỉnh sửa AI';
  else if (text === 'Word Count') s = 'Số đếm từ';
  else if (text === 'Track Changes: On') s = 'Theo dõi thay đổi: Bật';
  else if (text === 'Track Changes: Off') s = 'Theo dõi thay đổi: Tắt';
  else if (text === 'AutoCorrect Options') s = 'Tùy chọn tự động sửa lỗi';
  else if (text === 'Replace as you type:') s = 'Thay thế khi bạn gõ:';
  else if (text === 'Restore Defaults') s = 'Khôi phục mặc định';
  else if (text === 'Pasting from other programs:') s = 'Dán từ các chương trình khác:';
  else if (text === 'Preferences') s = 'Tùy chọn';
  else if (text === 'Show measurements in units of') s = 'Hiển thị đơn vị đo lường theo';
  else if (text === 'Inches') s = 'Inch';
  else if (text === 'Centimeters') s = 'Xentimét';
  else if (text === 'Millimeters') s = 'Milimét';
  else if (text === 'Points') s = 'Điểm (Points)';
  else if (text === 'Picas') s = 'Pica';
  else if (text === 'Words') s = 'Số từ';
  else if (text === 'Asian characters (Chinese, Japanese, Korean)') s = 'Ký tự châu Á (Trung, Nhật, Hàn)';
  else if (text === 'Non-Asian words') s = 'Từ không phải tiếng châu Á';
  else if (text === 'Characters (no spaces)') s = 'Ký tự (không tính khoảng trắng)';
  else if (text === 'Characters (with spaces)') s = 'Ký tự (tính cả khoảng trắng)';
  else if (text === 'Paragraphs') s = 'Đoạn văn';
  else if (text === 'No headings in this document') s = 'Không có tiêu đề nào trong tài liệu này';
  else if (text === 'Search document') s = 'Tìm kiếm tài liệu';
  else if (text === 'Headings') s = 'Tiêu đề';
  else if (text === 'Results') s = 'Kết quả';
  else if (text === 'Type to search the document') s = 'Nhập để tìm kiếm trong tài liệu';
  else if (text === 'No matches') s = 'Không có kết quả phù hợp';
  else if (text === 'Preparing pages…') s = 'Đang chuẩn bị trang…';
  else if (text === 'Expand') s = 'Mở rộng';
  else if (text === 'Collapse') s = 'Thu gọn';
  else if (text === 'Promote') s = 'Nâng cấp';
  else if (text === 'Demote') s = 'Hạ cấp';
  else if (text === 'New Heading Before') s = 'Tiêu đề mới phía trước';
  else if (text === 'New Heading After') s = 'Tiêu đề mới phía sau';
  else if (text === 'Select Heading and Content') s = 'Chọn tiêu đề và nội dung';
  else if (text === 'Expand All') s = 'Mở rộng tất cả';
  else if (text === 'Collapse All') s = 'Thu gọn tất cả';
  else if (text === 'Show Heading Levels') s = 'Hiển thị cấp độ tiêu đề';
  else if (text === 'First Line Indent') s = 'Thụt lề dòng đầu tiên';
  else if (text === 'Left Indent') s = 'Thụt lề trái';
  else if (text === 'Right Indent') s = 'Thụt lề phải';
  else if (text === 'Top Margin') s = 'Lề trên';
  else if (text === 'Bottom Margin') s = 'Lề dưới';
  else if (text === 'Left Margin') s = 'Lề trái';
  else if (text === 'Right Margin') s = 'Lề phải';
  else if (text === 'All changes accepted') s = 'Đã chấp nhận tất cả thay đổi';
  else if (text === 'All changes rejected') s = 'Đã từ chối tất cả thay đổi';
  else if (text === 'No tracked changes to process') s = 'Không có thay đổi được theo dõi nào cần xử lý';
  else if (text === 'Edit comment') s = 'Chỉnh sửa nhận xét';
  else if (text === 'Delete comment') s = 'Xóa nhận xét';
  else if (text === 'Delete comment (and replies)') s = 'Xóa nhận xét (và các câu trả lời)';
  else if (text === 'Delete reply') s = 'Xóa câu trả lời';
  else if (text === 'Reply…') s = 'Trả lời…';
  else if (text === 'This document has no comments') s = 'Tài liệu này không có nhận xét nào';
  else if (text === '(optional)') s = '(tùy chọn)';
  else if (text === 'Password to open this document') s = 'Mật khẩu để mở tài liệu này';
  else if (text === 'Password to modify this document') s = 'Mật khẩu để sửa đổi tài liệu này';
  else if (text === 'Enter the protection password to change or remove it') s = 'Nhập mật khẩu bảo vệ để thay đổi hoặc xóa bỏ';
  else if (text === 'Remove author and organization metadata from this file on save') s = 'Xóa siêu dữ liệu tác giả và tổ chức khỏi tệp này khi lưu';
  else if (text === 'Protection settings updated; they apply when the document is saved') s = 'Đã cập nhật cài đặt bảo vệ; sẽ áp dụng khi tài liệu được lưu';
  else if (text === 'Write-Protected') s = 'Được bảo vệ chống ghi';
  else if (text === 'All ink removed; takes effect after saving') s = 'Đã xóa tất cả nét mực; có hiệu lực sau khi lưu';
  else if (text === 'Watermark removed; takes effect after saving') s = 'Đã xóa hình mờ; có hiệu lực sau khi lưu';
  else if (text === '\"Different First Page\" disabled') s = 'Đã tắt \"Trang đầu khác biệt\"';
  else if (text === '\"Different Odd & Even Pages\" disabled') s = 'Đã tắt \"Trang chẵn & lẻ khác nhau\"';
  else if (text === 'Delete this header and connect to the header in the previous section?') s = 'Xóa đầu trang này và kết nối với đầu trang ở phần trước?';
  else if (text === 'Delete this footer and connect to the footer in the previous section?') s = 'Xóa chân trang này và kết nối với chân trang ở phần trước?';
  else if (text === 'AutoSave (every 30 seconds and when the window loses focus)') s = 'Tự động lưu (sau mỗi 30 giây và khi cửa sổ mất tiêu điểm)';
  else if (text === 'Split pane (read-only preview, scrolls independently)') s = 'Khung chia tách (xem trước chỉ đọc, cuộn độc lập)';
  else if (text === 'Backspace right after a correction undoes it.') s = 'Nhấn phím Backspace ngay sau khi sửa để hoàn tác.';
  else if (text === '\"Straight quotes\" with “smart quotes”') s = '\"Dấu ngoặc kép thẳng\" thành “dấu ngoặc kép cong”';
  else if (text === 'Hyphens (--) with dash (—)') s = 'Dấu gạch ngang (--) thành gạch ngang dài (—)';
  else if (text === 'Automatic bulleted and numbered lists') s = 'Tự động tạo danh sách dấu đầu dòng và đánh số';
  else if (text === 'Symbols: (c) (r) (tm) ... fractions and arrows') s = 'Ký hiệu: (c) (r) (tm) ... phân số và mũi tên';
  else if (text === 'Ordinals (1st) with superscript') s = 'Số thứ tự (1st) với chỉ số trên';
  else if (text === 'Capitalize first letter of sentences') s = 'Viết hoa chữ cái đầu câu';
  else if (text === 'An existing password shows as dots: leave it unchanged to keep it, or clear the field to remove it') s = 'Mật khẩu hiện tại hiển thị dưới dạng dấu chấm: để nguyên nếu muốn giữ lại, hoặc xóa trống để gỡ bỏ';
  else if (text === 'Set open and modify passwords, editing restrictions, and privacy options; changes apply when the document is saved') s = 'Đặt mật khẩu mở và sửa đổi, giới hạn chỉnh sửa và tùy chọn quyền riêng tư; các thay đổi áp dụng khi lưu tài liệu';

  // Dynamic parameterized patterns
  else if (s.startsWith('Open failed: ')) s = s.replace('Open failed: ', 'Mở tài liệu thất bại: ');
  else if (s.startsWith('Save failed: ')) s = s.replace('Save failed: ', 'Lưu tài liệu thất bại: ');
  else if (s.startsWith('Print failed: ')) s = s.replace('Print failed: ', 'In tài liệu thất bại: ');
  else if (s.startsWith('Compare failed: ')) s = s.replace('Compare failed: ', 'So sánh thất bại: ');
  else if (s.startsWith('Exporting ') && s.endsWith(' images…')) s = s.replace('Exporting ', 'Đang xuất ').replace(' images…', ' hình ảnh…');
  else if (s.includes('the document is too large to open')) {
    s = s.replace('the document is too large to open (', 'tài liệu quá lớn không thể mở (')
      .replace(' paragraphs, ', ' đoạn văn, ')
      .replace(' characters)', ' ký tự)');
  }
  else if (s.includes('opened in Read Mode — press Esc to edit')) {
    s = s.replace('Large document (', 'Tài liệu lớn (')
      .replace(' paragraphs): opened in Read Mode — press Esc to edit', ' đoạn văn): đã mở ở Chế độ đọc — nhấn Esc để chỉnh sửa');
  }
  else if (s.includes('check-as-you-type spelling is off')) {
    s = s.replace('Large document (', 'Tài liệu lớn (')
      .replace(' paragraphs): check-as-you-type spelling is off — turn it on under Review › Spelling', ' đoạn văn): tính năng kiểm tra chính tả khi nhập đang tắt — bật lại trong mục Xem lại › Chính tả');
  }
  else if (s.startsWith('Missing document fonts: ')) {
    s = s.replace('Missing document fonts: ', 'Thiếu phông chữ tài liệu: ').replace(' (substitutes shown)', ' (đang hiển thị phông chữ thay thế)');
  }
  else if (s.startsWith('Source \"') && s.includes('\" added; reference it via Insert Citation')) {
    s = s.replace('Source "', 'Đã thêm nguồn "').replace('" added; reference it via Insert Citation', '" — tham chiếu qua Chèn trích dẫn');
  }
  else if (s.startsWith('\"') && s.includes('\" has a password to modify. Enter it to edit, or open read-only.')) {
    s = s.replace('has a password to modify. Enter it to edit, or open read-only.', 'có mật khẩu sửa đổi. Nhập mật khẩu để chỉnh sửa, hoặc mở ở chế độ chỉ đọc.');
  }
  else if (s.startsWith('\"') && s.includes('\" is password protected. Enter the password to open it.')) {
    s = s.replace('is password protected. Enter the password to open it.', 'được bảo vệ bằng mật khẩu. Nhập mật khẩu để mở.');
  }
  else if (s.startsWith('Page ') && s.includes(' of ')) {
    s = s.replace('Page ', 'Trang ').replace(' of ', ' trên ');
  }
  else if (s.endsWith(' words')) {
    s = s.replace(' words', ' từ');
  }
  else if (s.endsWith(' pages')) {
    s = s.replace(' pages', ' trang');
  }
  else if (s.startsWith('Header -Section ') && s.endsWith('-')) {
    s = s.replace('Header -Section ', 'Đầu trang -Phần ').replace('-', '');
  }
  else if (s.startsWith('Footer -Section ') && s.endsWith('-')) {
    s = s.replace('Footer -Section ', 'Chân trang -Phần ').replace('-', '');
  }
  else if (s.startsWith('Show Heading ')) {
    s = s.replace('Show Heading ', 'Hiển thị tiêu đề ');
  }
  else if (s.startsWith('Tab stop type: ')) {
    s = s.replace('Tab stop type: ', 'Loại điểm dừng tab: ').replace(' (click to cycle)', ' (nhấp để chuyển đổi)');
  }
  else if (s.includes('tab stop @ ')) {
    s = s.replace('tab stop @ ', 'điểm dừng tab tại ');
  }

  // Common replacements for general phrases
  const fallbackRules = [
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
    [/Page \{page\}/gi, 'Trang {page}'],
    [/Lock the workbook structure/gi, 'Khóa cấu trúc sổ làm việc'],
    [/Ranges that stay editable while the sheet is protected/gi, 'Các phạm vi vẫn có thể chỉnh sửa khi trang tính được bảo vệ'],
    [/Add Data Labels/gi, 'Thêm nhãn dữ liệu'],
    [/Delete Data Labels/gi, 'Xóa nhãn dữ liệu'],
    [/Delete Chart/gi, 'Xóa biểu đồ'],
    [/Recalculate the current PivotTable/gi, 'Tính toán lại PivotTable hiện tại'],
    [/Select the PivotTable area first, then refresh/gi, 'Chọn vùng PivotTable trước, sau đó làm mới'],
  ];

  for (const [re, rep] of fallbackRules) {
    s = s.replace(re, rep);
  }

  APP_DICT[key] = s;
}

fs.writeFileSync('tools/i18n-data/apps-all-full-dict.json', JSON.stringify(APP_DICT, null, 2), 'utf8');
console.log('Saved apps-all-full-dict.json with keys:', Object.keys(APP_DICT).length);
