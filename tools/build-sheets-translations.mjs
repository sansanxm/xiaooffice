import fs from 'node:fs';

const rawSheets = JSON.parse(fs.readFileSync('tools/i18n-engine/missing-sheets.json', 'utf8'));
const currentDict = JSON.parse(fs.readFileSync('tools/i18n-data/sheets-full-dict.json', 'utf8'));

// Common Sheets Terminology Map
const SHEETS_GLOSSARY = {
  // Chart Formatting & Elements
  "Accounting": "Kế toán",
  "Short Date": "Ngày ngắn",
  "Long Date": "Ngày dài",
  "Fraction": "Phân số",
  "Percentage": "Phần trăm",
  "Category Name + Percentage": "Tên danh mục + Phần trăm",
  "Chart Area": "Vùng biểu đồ",
  "Value Axis": "Trục giá trị",
  "Category Axis": "Trục danh mục",
  "Series": "Chuỗi",
  "Data Point": "Điểm dữ liệu",
  "Fill Color": "Màu tô",
  "Point Explosion": "Độ tách điểm dữ liệu",
  "Legend & Labels": "Chú giải & Nhãn",
  "Legend Position": "Vị trí chú giải",
  "Label Position": "Vị trí nhãn",
  "Outside End": "Bên ngoài ở cuối",
  "Inside End": "Bên trong ở cuối",
  "Label Number Format": "Định dạng số của nhãn",
  "Minimum": "Tối thiểu",
  "Maximum": "Tối đa",
  "Gap Width": "Độ rộng khoảng cách",
  "Pie Explosion": "Độ tách hình tròn",
  "Doughnut Hole Size": "Kích thước lỗ vành khuyên",
  "Select Data Source": "Chọn nguồn dữ liệu",
  "Keep at least one series.": "Giữ lại ít nhất một chuỗi.",
  "No categories to switch.": "Không có danh mục nào để chuyển đổi.",
  "Series Name": "Tên chuỗi",
  "Values Range": "Phạm vi giá trị",
  "Categories Range": "Phạm vi danh mục",
  "Keep unchanged": "Giữ nguyên",
  "Move Up": "Di chuyển lên",
  "Move Down": "Di chuyển xuống",
  "Remove Series": "Xóa chuỗi",
  "＋ Add Series": "＋ Thêm chuỗi",
  "Swap series and categories": "Hoán đổi chuỗi và danh mục",
  "Reading…": "Đang đọc…",
  "Unable to read the data range.": "Không thể đọc phạm vi dữ liệu.",
  "Format Selection…": "Định dạng phần đã chọn…",
  "Select Data…": "Chọn dữ liệu…",
  "Chart elements (add or edit titles, legend, and labels)": "Các thành phần biểu đồ (thêm hoặc sửa tiêu đề, chú giải và nhãn)",
  "Quick Layout": "Bố cục nhanh",
  "Chart Styles": "Kiểu biểu đồ",
  "Pick preset chart styles": "Chọn kiểu biểu đồ có sẵn",
  "Change Colors": "Đổi màu sắc",
  "Pick a chart color palette": "Chọn bảng màu cho biểu đồ",
  "Switch Row/Column": "Đổi hàng/cột",
  "Swap rows and columns": "Hoán đổi hàng và cột",
  "Change Chart Type": "Đổi loại biểu đồ",
  "Choose a different chart type": "Chọn loại biểu đồ khác",
  "Move Chart": "Di chuyển biểu đồ",
  "Choose where the chart is placed": "Chọn nơi đặt biểu đồ",
  "New sheet": "Trang tính mới",
  "Object in": "Đối tượng trong",
  "Gridlines": "Đường lưới",
  "Major Gridlines": "Đường lưới chính",
  "Minor Gridlines": "Đường lưới phụ",
  "Trendline": "Đường xu hướng",
  "Linear": "Tuyến tính",
  "Exponential": "Hàm mũ",
  "Linear Forecast": "Dự báo tuyến tính",
  "Moving Average": "Trung bình trượt",
  "Error Bars": "Thanh hiển thị lỗi",
  "Standard Error": "Sai số chuẩn",
  "Percentage": "Phần trăm",
  "Standard Deviation": "Độ lệch chuẩn",

  // Cell Formatting & Protection
  "Protect Sheet": "Bảo vệ trang tính",
  "Protect Sheet…": "Bảo vệ trang tính…",
  "Unprotect Sheet": "Hủy bảo vệ trang tính",
  "Lock the sheet so unwanted edits cannot be made": "Khóa trang tính để ngăn chặn các chỉnh sửa ngoài ý muốn",
  "Protect Workbook": "Bảo vệ sổ làm việc",
  "Unprotect Workbook": "Hủy bảo vệ sổ làm việc",
  "Lock the structure of the workbook": "Khóa cấu trúc của sổ làm việc",
  "Allow Edit Ranges": "Cho phép chỉnh sửa phạm vi",
  "Allow Edit Ranges…": "Cho phép chỉnh sửa phạm vi…",
  "Track Changes": "Theo dõi thay đổi",
  "Highlight Changes": "Đánh dấu thay đổi",
  "Accept/Reject Changes": "Chấp nhận/Từ chối thay đổi",

  // Sort & Filter
  "Sort & Filter": "Sắp xếp & Lọc",
  "Sort A to Z": "Sắp xếp từ A đến Z",
  "Sort Z to A": "Sắp xếp từ Z đến A",
  "Custom Sort…": "Sắp xếp tùy chỉnh…",
  "Filter": "Lọc",
  "Clear Filter": "Xóa bộ lọc",
  "Reapply Filter": "Áp dụng lại bộ lọc",
  "Advanced Filter…": "Bộ lọc nâng cao…",

  // Data Tools
  "Data Validation": "Xác thực dữ liệu",
  "Data Validation…": "Xác thực dữ liệu…",
  "Circle Invalid Data": "Khoanh tròn dữ liệu không hợp lệ",
  "Clear Validation Circles": "Xóa các vòng tròn xác thực",
  "Text to Columns": "Văn bản thành cột",
  "Flash Fill": "Điền nhanh (Flash Fill)",
  "Remove Duplicates": "Xóa các mục trùng lặp",
  "Consolidate": "Hợp nhất dữ liệu",
  "What-If Analysis": "Phân tích giả định",
  "Goal Seek…": "Dò tìm mục tiêu (Goal Seek)…",
  "Data Table…": "Bảng dữ liệu…",
  "Scenario Manager…": "Quản lý kịch bản…",

  // Sheet Tabs & View
  "Sheet Views": "Chế độ xem trang tính",
  "Normal": "Bình thường",
  "Page Break Preview": "Xem trước ngắt trang",
  "Page Layout": "Bố cục trang",
  "Custom Views": "Chế độ xem tùy chỉnh",
  "Formula Bar": "Thanh công thức",
  "Headings": "Tiêu đề hàng/cột",
  "Freeze Panes": "Cố định khung nhìn",
  "Freeze Top Row": "Cố định hàng đầu",
  "Freeze First Column": "Cố định cột đầu",
  "Unfreeze Panes": "Hủy cố định khung nhìn",
  "Split": "Chia khung nhìn",
  "Hide": "Ẩn",
  "Unhide": "Bỏ ẩn",

  // Formulas & Functions
  "AutoSum": "Tính tổng tự động (AutoSum)",
  "Sum": "Tổng",
  "Average": "Trung bình",
  "Count Numbers": "Đếm số",
  "Max": "Lớn nhất",
  "Min": "Nhỏ nhất",
  "More Functions…": "Thêm hàm khác…",
  "Insert Function": "Chèn hàm",
  "Insert Function…": "Chèn hàm…",
  "Recently Used": "Dùng gần đây",
  "Financial": "Tài chính",
  "Logical": "Logic",
  "Text": "Văn bản",
  "Date & Time": "Ngày & Giờ",
  "Lookup & Reference": "Tra cứu & Tham chiếu",
  "Math & Trig": "Toán & Lượng giác",
  "Statistical": "Thống kê",
  "Engineering": "Kỹ thuật",
  "Cube": "Khối (Cube)",
  "Information": "Thông tin",
  "Compatibility": "Tương thích",
  "Web": "Web",
  "Name Manager": "Quản lý tên",
  "Define Name": "Định nghĩa tên",
  "Use in Formula": "Sử dụng trong công thức",
  "Create from Selection": "Tạo từ phần đã chọn",
  "Trace Precedents": "Truy vết ô tiền thân",
  "Trace Dependents": "Truy vết ô phụ thuộc",
  "Remove Arrows": "Xóa mũi tên truy vết",
  "Show Formulas": "Hiện công thức",
  "Error Checking": "Kiểm tra lỗi",
  "Evaluate Formula": "Đánh giá công thức",
  "Calculation Options": "Tùy chọn tính toán",
  "Calculate Now": "Tính toán ngay (F9)",
  "Calculate Sheet": "Tính toán trang tính (Shift+F9)",

  // Page Setup & Print
  "Print Area": "Vùng in",
  "Set Print Area": "Đặt vùng in",
  "Clear Print Area": "Xóa vùng in",
  "Print Titles": "Tiêu đề in",
  "Width": "Chiều rộng",
  "Height": "Chiều cao",
  "Scale": "Tỷ lệ",
  "Scale to Fit": "Thu phóng cho vừa",
  "Sheet Options": "Tùy chọn trang tính",
  "Header/Footer": "Đầu trang/Chân trang",
};

// Sentence / Template Rules for Sheets
function translateSheetsString(val, key) {
  if (currentDict[key]) return currentDict[key];
  if (SHEETS_GLOSSARY[val]) return SHEETS_GLOSSARY[val];

  // Specific dynamic patterns
  if (val.startsWith('Series "') && val.includes('" needs a values range')) {
    return val.replace('Series "', 'Chuỗi "').replace('" needs a values range', '" cần một phạm vi giá trị');
  }
  if (val.startsWith('Series "') && val.endsWith('"')) {
    return val.replace('Series "', 'Chuỗi "');
  }
  if (val.startsWith('Data Point "') && val.endsWith('"')) {
    return val.replace('Data Point "', 'Điểm dữ liệu "');
  }
  if (val.startsWith('Format — ')) {
    return val.replace('Format — ', 'Định dạng — ');
  }
  if (val.startsWith('Importing ') && val.includes(' from ')) {
    return val.replace('Importing ', 'Đang nhập ').replace(' from ', ' từ ');
  }
  if (val.startsWith('Merged ') && val.includes(' sheets from ')) {
    return val.replace('Merged ', 'Đã hợp nhất ')
      .replace(' sheets from ', ' trang tính từ ')
      .replace(' files (formulas imported as values).', ' tệp (công thức được nhập dưới dạng giá trị).');
  }
  if (val.startsWith('Could not create sheet ')) {
    return val.replace('Could not create sheet ', 'Không thể tạo trang tính ');
  }
  if (val.startsWith('Theme "') && val.endsWith('" applied — written to the file on save.')) {
    return val.replace('Theme "', 'Đã áp dụng chủ đề "').replace('" applied — written to the file on save.', '" — sẽ được ghi khi lưu.');
  }
  if (val.startsWith('{count} allow-edit range(s) will be written on save.')) {
    return '{count} phạm vi cho phép chỉnh sửa sẽ được ghi khi lưu.';
  }
  if (val.startsWith('Page ') && !val.includes(' ')) {
    return val.replace('Page ', 'Trang ');
  }

  // Common phrases
  let s = val;
  const replacements = [
    [/Select a cell /g, 'Chọn một ô '],
    [/before opening /g, 'trước khi mở '],
    [/is not supported/g, 'chưa được hỗ trợ'],
    [/will be written on save/g, 'sẽ được ghi khi lưu'],
    [/will be removed on save/g, 'sẽ được gỡ bỏ khi lưu'],
    [/password-protected/g, 'được bảo vệ bằng mật khẩu'],
    [/password is not supported/g, 'không hỗ trợ mật khẩu'],
    [/The workbook structure is protected/g, 'Cấu trúc sổ làm việc đang được bảo vệ'],
    [/cannot be added, removed, renamed or moved/g, 'không thể thêm, xóa, đổi tên hoặc di chuyển'],
    [/Page breaks are available once the sheet finishes loading\./g, 'Dấu ngắt trang sẽ khả dụng sau khi trang tính tải xong.'],
    [/Select a cell below row 1 or right of column A first\./g, 'Vui lòng chọn một ô bên dưới hàng 1 hoặc bên phải cột A trước.'],
    [/all manual page breaks cleared/g, 'đã xóa tất cả dấu ngắt trang thủ công'],
    [/page break inserted at the selection/g, 'đã chèn dấu ngắt trang tại vùng chọn'],
    [/page break removed/g, 'đã xóa dấu ngắt trang'],
    [/No manual page break at the selection\./g, 'Không có dấu ngắt trang thủ công nào tại vùng chọn.'],
    [/Reading highlight on\./g, 'Đã bật làm nổi bật vùng đọc.'],
    [/Reading highlight off\./g, 'Đã tắt làm nổi bật vùng đọc.'],
    [/Page Break Preview on\./g, 'Đã bật xem trước ngắt trang.'],
    [/Page Break Preview off\./g, 'Đã tắt xem trước ngắt trang.'],
  ];

  for (const [re, rep] of replacements) {
    s = s.replace(re, rep);
  }

  if (s !== val) return s;

  return null;
}

// Translate all missing sheets keys
let count = 0;
for (const [k, v] of Object.entries(rawSheets)) {
  if (!currentDict[k]) {
    const t = translateSheetsString(v, k);
    if (t) {
      currentDict[k] = t;
      count++;
    }
  }
}

fs.writeFileSync('tools/i18n-data/sheets-full-dict.json', JSON.stringify(currentDict, null, 2), 'utf8');
console.log(`Added ${count} translations. Total now in sheets-full-dict: ${Object.keys(currentDict).length}`);
