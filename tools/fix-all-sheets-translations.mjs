import fs from 'node:fs';

const sheetsDict = JSON.parse(fs.readFileSync('tools/i18n-data/sheets-full-dict.json', 'utf8'));

// Exact mappings for all the problematic Sheets keys
const CLEAN_SHEETS_FIXES = {
  appBreaksNeedCell: "Vui lòng chọn một ô bên dưới hàng 1 hoặc bên phải cột A trước.",
  appWorkbookProtectionWillWrite: "Bảo vệ cấu trúc sổ làm việc sẽ được lưu khi lưu tệp (không mật khẩu).",
  appWorkbookProtectedWithPassword: "Cấu trúc sổ làm việc được bảo vệ bằng mật khẩu — không thể thay đổi tại đây.",
  appRangesPasswordBlocked: "Trang tính này có phạm vi chỉnh sửa được bảo vệ bằng mật khẩu — chưa hỗ trợ chỉnh sửa.",
  appComboNoSelectData: "Chưa hỗ trợ thay đổi nguồn dữ liệu của biểu đồ kết hợp.",
  appPivotChartHintOut: "Vui lòng chọn một ô trong vùng kết quả PivotTable trước, sau đó chọn loại biểu đồ",
  appSlicerHintOut: "Vui lòng chọn một ô trong vùng kết quả PivotTable trước, sau đó chèn bộ cắt lọc",
  appTimelineHintOut: "Vui lòng chọn một ô trong vùng kết quả PivotTable trước, sau đó chèn dòng thời gian",
  appPivotCellNoEdit: "Ô này thuộc bảng PivotTable — chưa hỗ trợ chỉnh sửa trực tiếp.",
  appPivotSheetNoMove: "Trang tính này chứa bảng PivotTable — chưa hỗ trợ di chuyển phạm vi.",
  appMergeOverTable: "Vùng chọn giao với bảng Excel — chưa hỗ trợ hợp nhất các ô trong bảng.",
  appPivotSheetNoDuplicate: "Trang tính này chứa bảng PivotTable — chưa hỗ trợ nhân bản trang tính.",
  appDuplicateScopedNames: "Trang tính này có tên theo phạm vi trang — chưa hỗ trợ nhân bản trang tính.",
  appSelectCellFirst: "Vui lòng chọn một ô trước.",
  appProtectedWithPassword: "Trang tính này được bảo vệ bằng mật khẩu — chưa hỗ trợ gỡ bảo vệ.",
  appProtectionWillWrite: "Bảo vệ trang tính sẽ được lưu khi lưu tệp (không mật khẩu). Trình soạn thảo không bắt buộc áp dụng.",
  appProtectionWillRemove: "Bảo vệ trang tính sẽ được gỡ bỏ khi lưu tệp.",
  appSelectRangeFirst: "Vui lòng chọn một phạm vi ô trước.",
  appSaveErrX14Dv: "Trang tính có xác thực dữ liệu mở rộng (x14); chưa hỗ trợ chỉnh sửa quy tắc xác thực.",
  appPivotLayoutMismatch: "Bố cục PivotTable không khớp với phạm vi kết quả — vui lòng làm mới trong Excel trước khi tính toán lại.",
  appPivotGrowUnsupported: "Bố cục PivotTable này (tiêu đề thu gọn/nhiều hàng) chưa hỗ trợ tự động mở rộng — vui lòng làm mới trong Excel.",
  appPivotGrowConflict: "Vùng mở rộng của PivotTable bị xung đột với nội dung hiện có — hãy xóa vùng đích rồi làm mới.",
  appShapeNotEditable: "Không tìm thấy hình dạng có thể chỉnh sửa \"{id}\" (chỉ hình dạng thêm trong phiên này mới sửa được).",
  appCalcFieldNameClash: "Trường tính toán \"{name}\" không được trùng tên với tiêu đề nguồn.",
  appCalcFieldNameDuplicate: "Tên trường tính toán phải là duy nhất.",
  appPivotRelayoutOverlap: "Bố cục PivotTable mới sẽ ghi đè lên nội dung hiện có — hãy xóa vùng đích trước.",
  appPivotDefNotLoadedSave: "Định nghĩa PivotTable chưa được tải — nếu bạn đã sửa trong phiên này, hãy lưu (⌘S) trước.",
  appPivotEditUnsupported: "PivotTable này hiện chưa thể chỉnh sửa: {reasons}",
  appPivotEditHasFeatures: "PivotTable có nhóm, bộ lọc, bộ lọc báo cáo hoặc trường tính toán chưa hỗ trợ sửa bố cục — hãy điều chỉnh trong Excel.",
  appPivotEditValuesOnRows: "PivotTable có trường giá trị nằm trên trục hàng chưa hỗ trợ chỉnh sửa bố cục.",
  appPivotEditAggUnsupported: "Kiểu tổng hợp của PivotTable này (ví dụ: Product hoặc Count Numbers) chưa hỗ trợ chỉnh sửa bố cục.",
  appPivotSourceSheetNotFound: "Không tìm thấy trang tính nguồn \"{name}\" của PivotTable.",
  appSlicerPivotStale: "PivotTable đích của bộ cắt lọc không còn hợp lệ.",
  appSlicerNeedsFullLoad: "Lọc bằng bộ cắt lọc yêu cầu chế độ tải toàn bộ — sổ làm việc này quá lớn và đã được tải theo luồng.",
  appSlicerPivotMissing: "PivotTable liên kết với bộ cắt lọc này không còn tồn tại.",
  appSlicerSheetMissing: "Trang tính liên kết với bộ cắt lọc này không còn tồn tại.",
  appSlicerFilterFailed: "Lọc bằng bộ cắt lọc thất bại.",
  appSlicerKeepOne: "Giữ lại ít nhất một mục được chọn trong bộ cắt lọc.",
  appSlicerCleared: "Đã xóa bộ lọc của bộ cắt \"{name}\".",
  appSlicerRemoved: "Đã xóa bộ cắt \"{name}\"; tất cả các mục đã được khôi phục.",
  appTimelineHintIn: "Chèn dòng thời gian cho trường ngày tháng của PivotTable hiện tại",
  appTimelineNeedsFile: "Mở tệp XLSX trước — dòng thời gian hoạt động trên các bảng PivotTable của tệp.",
  appTimelinePivotStale: "PivotTable đích của dòng thời gian không còn hợp lệ.",
  appTimelineNoDateFields: "PivotTable này không có trường ngày tháng nào để tạo dòng thời gian.",
  appTimelineCreated: "Đã tạo dòng thời gian \"{name}\" — nhấp vào các tháng để lọc PivotTable.",
  appTimelineNeedsFullLoad: "Lọc bằng dòng thời gian yêu cầu chế độ tải toàn bộ — sổ làm việc này quá lớn và đã được tải theo luồng.",
  appTimelinePivotMissing: "PivotTable liên kết với dòng thời gian này không còn tồn tại.",
  appTimelineSheetMissing: "Trang tính liên kết với dòng thời gian này không còn tồn tại.",
  appTimelineFilterFailed: "Lọc bằng dòng thời gian thất bại.",
  appTimelineCleared: "Đã xóa bộ lọc dòng thời gian \"{name}\".",
  appTimelineRemoved: "Đã xóa dòng thời gian \"{name}\"; hiển thị lại tất cả dữ liệu.",
  appAutoFilterRangeChanged: "Phạm vi lọc tự động đã thay đổi — hãy lưu tệp.",
  appAutoFilterCleared: "Đã xóa tất cả bộ lọc trên trang tính này.",
  appAutoFilterFailed: "Lọc thất bại.",
  appSortFailed: "Sắp xếp thất bại.",
  appSortDone: "Đã sắp xếp phạm vi.",
  appSortNeedsRange: "Chọn một phạm vi ô trước khi sắp xếp.",
  appFindNoMatch: "Không tìm thấy kết quả phù hợp.",
  appFindReplaceDone: "Đã thay thế {count} vị trí xuất hiện.",
  appFindReplaceNone: "Không tìm thấy nội dung để thay thế.",
  appFormulaErrorHelp: "Công thức có lỗi cú pháp. Kiểm tra lại dấu ngoặc và tên hàm.",
  appCellLockedNotice: "Ô này đã bị khóa và không thể chỉnh sửa khi trang tính được bảo vệ.",
  appSheetProtectedNotice: "Trang tính đang được bảo vệ. Vui lòng hủy bảo vệ để chỉnh sửa.",
  appCopyDone: "Đã sao chép vào bảng tạm.",
  appCutDone: "Đã cắt vào bảng tạm.",
  appPasteDone: "Đã dán nội dung.",
  appPasteSpecialDone: "Đã dán đặc biệt.",
  appInsertRowDone: "Đã chèn hàng.",
  appInsertColDone: "Đã chèn cột.",
  appDeleteRowDone: "Đã xóa hàng.",
  appDeleteColDone: "Đã xóa cột.",
  appClearAllDone: "Đã xóa sạch ô.",
  appClearFormatsDone: "Đã xóa định dạng.",
  appClearValuesDone: "Đã xóa giá trị.",
};

// Clean and apply fixes
let fixedCount = 0;
for (const [k, v] of Object.entries(CLEAN_SHEETS_FIXES)) {
  sheetsDict[k] = v;
  fixedCount++;
}

// Regex cleaner for any leftover English phrases
for (const [k, v] of Object.entries(sheetsDict)) {
  let s = v;
  s = s.replace(/Chọn một ô inside the PivotTable output first/g, 'Chọn một ô trong kết quả PivotTable trước');
  s = s.replace(/then pick a chart type/g, 'sau đó chọn loại biểu đồ');
  s = s.replace(/then insert a slicer/g, 'sau đó chèn bộ cắt lọc');
  s = s.replace(/then insert a timeline/g, 'sau đó chèn dòng thời gian');
  s = s.replace(/chưa được hỗ trợ yet/g, 'chưa được hỗ trợ');
  s = s.replace(/được bảo vệ bằng mật khẩu/g, 'được bảo vệ bằng mật khẩu');
  s = s.replace(/The workbook structure is/g, 'Cấu trúc sổ làm việc đang');
  s = s.replace(/it cannot be changed here\./g, 'không thể thay đổi tại đây.');
  s = s.replace(/This sheet has/g, 'Trang tính này có');
  s = s.replace(/editing them chưa được hỗ trợ\./g, 'chưa hỗ trợ chỉnh sửa.');
  s = s.replace(/Changing the data source of a combo chart/g, 'Thay đổi nguồn dữ liệu biểu đồ kết hợp');
  s = s.replace(/Chọn một ô first\./g, 'Vui lòng chọn một ô trước.');
  s = s.replace(/Chọn một ô range first\./g, 'Vui lòng chọn một phạm vi ô trước.');

  if (s !== v) {
    sheetsDict[k] = s;
    fixedCount++;
  }
}

fs.writeFileSync('tools/i18n-data/sheets-full-dict.json', JSON.stringify(sheetsDict, null, 2), 'utf8');
console.log(`Applied ${fixedCount} pure Vietnamese fixes to sheets-full-dict.json!`);
