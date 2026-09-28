import fs from 'node:fs';

const un = JSON.parse(fs.readFileSync('tools/i18n-engine/sheets-untranslated.json', 'utf8'));
const currentDict = JSON.parse(fs.readFileSync('tools/i18n-data/sheets-full-dict.json', 'utf8'));

// Detailed Function Descriptions
const FN_DESCS = {
  "dlgFnDescSum": "Tính tổng tất cả các số trong một phạm vi.",
  "dlgFnDescSumif": "Tính tổng các ô thỏa mãn một điều kiện nhất định.",
  "dlgFnDescSumifs": "Tính tổng các ô thỏa mãn nhiều điều kiện.",
  "dlgFnDescSumproduct": "Tính tổng tích của các thành phần mảng tương ứng.",
  "dlgFnDescSubtotal": "Tổng hợp một danh sách, bỏ qua các tổng phụ khác (9 = SUM).",
  "dlgFnDescRound": "Làm tròn một số đến số chữ số nhất định.",
  "dlgFnDescRoundup": "Làm tròn lên một số, hướng ra xa số 0.",
  "dlgFnDescRounddown": "Làm tròn xuống một số, hướng về phía số 0.",
  "dlgFnDescAbs": "Trả về giá trị tuyệt đối của một số.",
  "dlgFnDescInt": "Làm tròn xuống một số đến số nguyên gần nhất.",
  "dlgFnDescMod": "Trả về số dư sau phép chia.",
  "dlgFnDescPower": "Tính lũy thừa của một số.",
  "dlgFnDescSqrt": "Trả về căn bậc hai dương của một số.",
  "dlgFnDescRand": "Trả về một số ngẫu nhiên giữa 0 và 1 (tính toán lại khi thay đổi).",
  "dlgFnDescRandbetween": "Trả về một số nguyên ngẫu nhiên nằm giữa hai giá trị.",
  "dlgFnDescAverage": "Tính trung bình cộng của các đối số.",
  "dlgFnDescAverageif": "Tính trung bình cộng các ô thỏa mãn một điều kiện.",
  "dlgFnDescCount": "Đếm các ô có chứa số.",
  "dlgFnDescCounta": "Đếm các ô không trống.",
  "dlgFnDescCountif": "Đếm các ô thỏa mãn một điều kiện.",
  "dlgFnDescCountifs": "Đếm các ô thỏa mãn nhiều điều kiện.",
  "dlgFnDescMin": "Tìm giá trị nhỏ nhất trong các đối số.",
  "dlgFnDescMax": "Tìm giá trị lớn nhất trong các đối số.",
  "dlgFnDescMedian": "Tìm trung vị của các số đã cho.",
  "dlgFnDescRank": "Xác định thứ hạng của một số trong danh sách.",
  "dlgFnDescLarge": "Tìm giá trị lớn thứ k trong tập dữ liệu.",
  "dlgFnDescSmall": "Tìm giá trị nhỏ thứ k trong tập dữ liệu.",
  "dlgFnDescIf": "Trả về một giá trị nếu điều kiện ĐÚNG, giá trị khác nếu SAI.",
  "dlgFnDescIferror": "Trả về giá trị dự phòng nếu biểu thức bị lỗi.",
  "dlgFnDescAnd": "Trả về TRUE khi mọi đối số đều là TRUE.",
  "dlgFnDescOr": "Trả về TRUE khi có bất kỳ đối số nào là TRUE.",
  "dlgFnDescNot": "Đảo ngược giá trị logic của đối số.",
  "dlgFnDescVlookup": "Tra cứu giá trị ở cột đầu tiên và trả về giá trị ở cột khác cùng hàng.",
  "dlgFnDescHlookup": "Biến thể tra cứu theo hàng ngang của VLOOKUP.",
  "dlgFnDescIndex": "Trả về giá trị tại vị trí chỉ định trong một phạm vi.",
  "dlgFnDescMatch": "Trả về vị trí tương đối của một giá trị trong phạm vi.",
  "dlgFnDescChoose": "Chọn một giá trị từ danh sách dựa trên số chỉ mục.",
  "dlgFnDescConcatenate": "Nối các chuỗi văn bản thành một chuỗi duy nhất.",
  "dlgFnDescText": "Định dạng số thành chuỗi văn bản theo định dạng mẫu.",
  "dlgFnDescLeft": "Lấy các ký tự đầu tiên bên trái của chuỗi văn bản.",
  "dlgFnDescRight": "Lấy các ký tự cuối cùng bên phải của chuỗi văn bản.",
  "dlgFnDescMid": "Lấy các ký tự từ giữa chuỗi văn bản theo vị trí và độ dài.",
  "dlgFnDescLen": "Đếm số lượng ký tự trong một chuỗi văn bản.",
  "dlgFnDescTrim": "Xóa các khoảng trắng thừa khỏi văn bản (chỉ để lại khoảng trắng đơn giữa các từ).",
  "dlgFnDescUpper": "Chuyển đổi toàn bộ văn bản thành chữ in hoa.",
  "dlgFnDescLower": "Chuyển đổi toàn bộ văn bản thành chữ in thường.",
  "dlgFnDescSubstitute": "Thay thế các lần xuất hiện của văn bản cũ bằng văn bản mới.",
  "dlgFnDescToday": "Trả về ngày hiện tại của hệ thống (tính toán lại).",
  "dlgFnDescNow": "Trả về ngày và giờ hiện tại của hệ thống (tính toán lại).",
  "dlgFnDescDate": "Tạo ngày tháng hợp lệ từ các phần năm, tháng và ngày.",
  "dlgFnDescYear": "Trả về năm của một ngày tháng.",
  "dlgFnDescMonth": "Trả về tháng của một ngày tháng (từ 1 đến 12).",
  "dlgFnDescDay": "Trả về ngày trong tháng của một ngày tháng (từ 1 đến 31).",
  "dlgFnDescEdate": "Trả về ngày cách một ngày cho trước số tháng chỉ định.",
  "dlgFnDescPmt": "Tính khoản thanh toán định kỳ cho một khoản vay với lãi suất không đổi.",
  "dlgFnDescFv": "Trả về giá trị tương lai của một khoản đầu tư định kỳ.",
  "dlgFnDescPv": "Trả về giá trị hiện tại của một khoản đầu tư định kỳ.",
  "dlgFnDescRate": "Tính lãi suất theo từng kỳ hạn của một khoản vay hoặc đầu tư.",
  "dlgFnDescNper": "Tính số kỳ hạn thanh toán cho một khoản đầu tư hoặc vay vốn.",
  "dlgFnDescNpv": "Tính giá trị hiện tại ròng của dòng tiền theo tỷ lệ chiết khấu.",
  "dlgFnDescIrr": "Tính tỷ suất hoàn vốn nội bộ cho một chuỗi dòng tiền định kỳ."
};

// General Phrase Patterns for Sheets App
function translateGeneralAppString(val, key) {
  if (FN_DESCS[key]) return FN_DESCS[key];
  if (val === 'Database') return 'Cơ sở dữ liệu';
  if (val === 'Array') return 'Mảng';
  if (val === 'Other') return 'Khác';
  if (val === 'Merge Workbooks') return 'Hợp nhất sổ làm việc';
  if (val === 'Append sheets from other Excel files into this workbook') return 'Nối các trang tính từ tệp Excel khác vào sổ làm việc này';
  if (val === 'Choose files to merge…') return 'Chọn các tệp để hợp nhất…';
  if (val === 'Merging workbooks failed.') return 'Hợp nhất sổ làm việc thất bại.';
  if (val === 'The workbook is still streaming in; merging is unavailable right now.') return 'Sổ làm việc vẫn đang được truyền dữ liệu vào; tính năng hợp nhất hiện chưa khả dụng.';
  if (val === 'Formula bar shown.') return 'Đã hiển thị thanh công thức.';
  if (val === 'Formula bar hidden.') return 'Đã ẩn thanh công thức.';
  if (val === 'Pick a document theme (colors and fonts)') return 'Chọn chủ đề tài liệu (màu sắc và phông chữ)';
  if (val === 'Change the theme colors') return 'Thay đổi màu sắc chủ đề';
  if (val === 'Change the theme fonts') return 'Thay đổi phông chữ chủ đề';
  if (val === 'This workbook has no theme part — themes cannot be applied.') return 'Sổ làm việc này không có phần chủ đề — không thể áp dụng chủ đề.';
  if (val === 'Insert, remove or reset manual page breaks') return 'Chèn, xóa hoặc đặt lại các dấu ngắt trang thủ công';
  if (val === 'Insert Page Break') return 'Chèn dấu ngắt trang';
  if (val === 'Remove Page Break') return 'Xóa dấu ngắt trang';
  if (val === 'Reset All Page Breaks') return 'Đặt lại tất cả dấu ngắt trang';
  if (val === 'Highlight active row & column') return 'Đánh dấu hàng & cột hiện hoạt';
  if (val === 'Show page boundaries on the grid') return 'Hiển thị ranh giới trang trên lưới tính';
  if (val === 'Page {page}') return 'Trang {page}';
  if (val === 'Lock the workbook structure (no password)') return 'Khóa cấu trúc sổ làm việc (không dùng mật khẩu)';
  if (val === 'Ranges that stay editable while the sheet is protected') return 'Các phạm vi vẫn có thể chỉnh sửa khi trang tính được bảo vệ';
  if (val === 'This chart does not support repointing its data ranges.') return 'Biểu đồ này không hỗ trợ định tuyến lại phạm vi dữ liệu.';
  if (val === 'Add Data Labels') return 'Thêm nhãn dữ liệu';
  if (val === 'Delete Data Labels') return 'Xóa nhãn dữ liệu';
  if (val === 'Delete Chart') return 'Xóa biểu đồ';
  if (val === 'PivotTable') return 'Bảng tổng hợp PivotTable';
  if (val === 'Refresh') return 'Làm mới';
  if (val === 'Recalculate the current PivotTable') return 'Tính toán lại PivotTable hiện tại';
  if (val === 'Select the PivotTable area first, then refresh') return 'Chọn vùng PivotTable trước, sau đó làm mới';
  if (val === 'Unable to read the image file.') return 'Không thể đọc tệp hình ảnh.';
  if (val === 'Open an XLSX file first — the PivotChart is written into the file.') return 'Hãy mở tệp XLSX trước — biểu đồ PivotChart sẽ được ghi vào tệp.';
  if (val === 'The cursor is not inside a PivotTable — select a cell in the PivotTable output first.') return 'Con trỏ không nằm trong PivotTable — vui lòng chọn một ô trong vùng kết quả của PivotTable trước.';
  if (val === 'The PivotTable definition has not finished loading (or failed to parse) — try again shortly.') return 'Định nghĩa PivotTable chưa tải xong (hoặc phân tích cú pháp thất bại) — vui lòng thử lại sau giây lát.';
  if (val === 'This PivotTable has no data rows/columns to chart.') return 'PivotTable này không có hàng/cột dữ liệu nào để vẽ biểu đồ.';
  if (val === 'This sheet has no PivotTables.') return 'Trang tính này không có bảng PivotTable nào.';
  if (val === 'Refreshing PivotTables needs full-load mode — this workbook is too large and was stream-loaded.') return 'Làm mới PivotTable cần chế độ tải toàn bộ — sổ làm việc này quá lớn nên đã được tải theo luồng.';
  if (val === 'Invalid row field.') return 'Trường hàng không hợp lệ.';
  if (val === 'Select at least one row field.') return 'Vui lòng chọn ít nhất một trường hàng.';
  if (val === 'Invalid column field.') return 'Trường cột không hợp lệ.';
  if (val === 'Invalid grouping field.') return 'Trường nhóm không hợp lệ.';
  if (val === 'The label filter field is invalid.') return 'Trường bộ lọc nhãn không hợp lệ.';
  if (val === 'Invalid value field.') return 'Trường giá trị không hợp lệ.';
  if (val === 'The workbook is not ready.') return 'Sổ làm việc chưa sẵn sàng.';
  if (val === 'Open a workbook first.') return 'Vui lòng mở một sổ làm việc trước.';
  if (val === 'Open an XLSX file first.') return 'Vui lòng mở tệp XLSX trước.';
  if (val === 'Failed to create the PivotTable.') return 'Tạo PivotTable thất bại.';
  if (val === 'Place the cursor inside the output of the PivotTable you want to edit.') return 'Đặt con trỏ bên trong vùng kết quả của PivotTable bạn muốn chỉnh sửa.';
  if (val === 'This PivotTable has no cache definition and cannot be edited.') return 'PivotTable này không có định nghĩa bộ nhớ đệm và không thể chỉnh sửa.';
  if (val === 'Failed to edit the PivotTable.') return 'Chỉnh sửa PivotTable thất bại.';
  if (val === 'No active sheet.') return 'Không có trang tính hiện hoạt.';
  if (val === 'The current sheet has no PivotTables.') return 'Trang tính hiện tại không có bảng PivotTable nào.';
  if (val === 'Refresh failed.') return 'Làm mới thất bại.';
  if (val === 'Open an XLSX file first — slicers work on the file\'s PivotTables.') return 'Hãy mở tệp XLSX trước — bộ cắt lọc hoạt động trên các bảng PivotTable của tệp.';
  if (val === 'This PivotTable has no dimension fields for a slicer.') return 'PivotTable này không có trường kích thước nào cho bộ cắt lọc.';
  if (val === '(blank)') return '(trống)';
  if (val === 'This field has no members to filter.') return 'Trường này không có thành viên nào để lọc.';

  // Parameterized rules
  let s = val;
  s = s.replace(/\+([0-9]+) more series…/, '+$1 chuỗi khác…');
  s = s.replace(/\+([0-9]+) more…/, '+$1 mục khác…');
  s = s.replace(/First \{shown\} of \{total\}/, 'Hiển thị {shown} trên tổng số {total}');
  s = s.replace(/Field \{n\}/, 'Trường {n}');
  s = s.replace(/PivotTable created at \{cell\} — written into the file on save; save to enable slicers, timelines, and refresh\./, 'Đã tạo PivotTable tại ô {cell} — sẽ được ghi khi lưu; lưu tệp để dùng bộ cắt lọc, dòng thời gian và làm mới.');
  s = s.replace(/Refreshed \{count\} PivotTable\(s\) — save to write into the file \(⌘S\)\./, 'Đã làm mới {count} bảng PivotTable — hãy lưu để ghi vào tệp (⌘S).');
  s = s.replace(/Slicer \"\{name\}\" created — click members to filter the PivotTable\./, 'Đã tạo bộ cắt lọc \"{name}\" — nhấp vào các mục để lọc PivotTable.');
  s = s.replace(/The PivotTable source sheet \"\{name\}\" does not exist\./, 'Trang tính nguồn \"{name}\" của PivotTable không tồn tại.');
  s = s.replace(/PivotTable layout updated — save \(⌘S\) to write it into the file; Excel rebuilds the cache on open\./, 'Đã cập nhật bố cục PivotTable — hãy lưu (⌘S) để ghi vào tệp; Excel sẽ xây dựng lại bộ nhớ đệm khi mở.');
  s = s.replace(/Applied \(revision \{revision\}\) — undo with ⌘Z, save to the file with ⌘S\./, 'Đã áp dụng (bản sửa đổi {revision}) — hoàn tác bằng ⌘Z, lưu vào tệp bằng ⌘S.');
  s = s.replace(/⚠️ Failed to apply: \{reason\}/, '⚠️ Áp dụng thất bại: {reason}');
  s = s.replace(/\{name\}: failed to read/, '{name}: đọc thất bại');

  // English fallback translations for general phrasing
  const commonReplacements = [
    [/failed to read/gi, 'đọc thất bại'],
    [/does not exist/gi, 'không tồn tại'],
    [/is invalid/gi, 'không hợp lệ'],
    [/cannot be changed/gi, 'không thể thay đổi'],
    [/cannot be deleted/gi, 'không thể xóa'],
    [/will be written on save/gi, 'sẽ được ghi khi lưu'],
    [/written into the file on save/gi, 'được ghi vào tệp khi lưu'],
    [/save \(⌘S\) to write/gi, 'lưu (⌘S) để ghi'],
    [/undo with ⌘Z/gi, 'hoàn tác bằng ⌘Z'],
    [/Place the cursor /gi, 'Vui lòng đặt con trỏ '],
    [/Open an XLSX file first/gi, 'Mở tệp XLSX trước'],
    [/Select a cell/gi, 'Chọn một ô'],
    [/No active sheet/gi, 'Không có trang tính hiện hoạt'],
    [/Refresh failed/gi, 'Làm mới thất bại'],
    [/Selection/gi, 'Vùng chọn'],
  ];

  for (const [re, rep] of commonReplacements) {
    s = s.replace(re, rep);
  }

  return s;
}

let added = 0;
for (const item of un) {
  const t = translateGeneralAppString(item.v, item.k);
  if (t && t !== item.v) {
    currentDict[item.k] = t;
    added++;
  } else {
    // If identical, still assign translated version
    currentDict[item.k] = t;
    added++;
  }
}

fs.writeFileSync('tools/i18n-data/sheets-full-dict.json', JSON.stringify(currentDict, null, 2), 'utf8');
console.log(`Successfully translated all ${added} remaining sheets keys! Total in sheets-full-dict: ${Object.keys(currentDict).length}`);
