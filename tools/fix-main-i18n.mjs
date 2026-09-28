import fs from 'node:fs';
import path from 'node:path';

function replaceCreateI18n(filePath, varName, viDict, enDict) {
  const content = fs.readFileSync(filePath, 'utf8');
  const startRegex = new RegExp(`const ${varName} = createI18n\\(\\{`);
  const match = content.match(startRegex);
  if (!match) {
    throw new Error(`Could not find const ${varName} = createI18n({ in ${filePath}`);
  }
  const startIndex = match.index;
  // find the matching closing `})`
  // We can scan from startIndex
  const rest = content.slice(startIndex);
  const endMatch = rest.match(/\n\}\)\n/);
  if (!endMatch) {
    throw new Error(`Could not find closing }) for ${varName} in ${filePath}`);
  }
  const endIndex = startIndex + endMatch.index + endMatch[0].length;

  const newBlock = `const ${varName} = createI18n({
  vi: ${JSON.stringify(viDict, null, 4).replace(/\n/g, '\n  ')},
  en: ${JSON.stringify(enDict, null, 4).replace(/\n/g, '\n  ')}
})\n`;

  const updated = content.slice(0, startIndex) + newBlock + content.slice(endIndex);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`Updated ${varName} in ${path.relative(process.cwd(), filePath)}`);
}

// 1. apps/shell/src/main/updater.ts
const updaterPath = path.resolve('apps/shell/src/main/updater.ts');
const updaterVi = {
  updTitle: 'Cập nhật phần mềm',
  updHeadline: 'Đã có phiên bản mới',
  updDesc: 'Bản cập nhật này bao gồm các cải tiến hiệu năng và sửa lỗi. Khuyến nghị cập nhật ngay.',
  updDownload: 'Cập nhật ngay',
  updLater: 'Nhắc tôi sau',
  updInstall: 'Khởi động lại & Cài đặt',
  updDownloading: 'Đang tải bản cập nhật…',
  updFailed: 'Tải bản cập nhật thất bại. Vui lòng kiểm tra mạng và thử lại.',
  updRetry: 'Thử lại',
  updManual: 'Cập nhật tự động thất bại. Vui lòng tải phiên bản mới nhất từ trang tải về và cài đặt thủ công.',
  updUpToDate: 'Bạn đang dùng phiên bản mới nhất ({version}).',
  updCheckFailed: 'Không thể kiểm tra cập nhật. Vui lòng kiểm tra mạng và thử lại.',
  updOpenDownload: 'Mở trang tải về'
};
const updaterEn = {
  updTitle: 'Software Update',
  updHeadline: 'A new version is available',
  updDesc: 'This update includes performance improvements and bug fixes. We recommend updating now.',
  updDownload: 'Update Now',
  updLater: 'Remind me later',
  updInstall: 'Restart & Install',
  updDownloading: 'Downloading update…',
  updFailed: 'Update download failed. Check your network and try again.',
  updRetry: 'Retry',
  updManual: 'Automatic update failed. Please get the latest version from the download page and install it manually.',
  updUpToDate: "You're up to date (version {version}).",
  updCheckFailed: "Couldn't check for updates. Check your network and try again.",
  updOpenDownload: 'Open Download Page'
};
replaceCreateI18n(updaterPath, 'tUpd', updaterVi, updaterEn);

// 2. apps/shell/src/main/index.ts
const shellIndexPath = path.resolve('apps/shell/src/main/index.ts');
const shellIndexVi = {
  dlgAddFolderRoot: 'Thêm thư mục vào Trang chủ',
  errFolderRootUnusable: 'Không thể đọc thư mục đã chọn',
  menuFile: 'Tệp',
  menuSectionNew: 'Mới',
  menuOpenInNewWindow: 'Mở trong cửa sổ mới',
  menuNewDoc: 'AI Docs',
  menuNewSheet: 'AI Sheets',
  untitledSheet: 'Bảng tính chưa có tiêu đề',
  untitledDoc: 'Tài liệu chưa có tiêu đề',
  untitledDeck: 'Bản trình bày chưa có tiêu đề',
  untitledMarkdown: 'Markdown chưa có tiêu đề',
  untitledHtml: 'HTML chưa có tiêu đề',
  untitledPdf: 'PDF chưa có tiêu đề',
  menuNewSlide: 'AI Slides',
  menuNewMarkdown: 'AI Markdown',
  menuNewHtml: 'AI HTML',
  menuNewPdf: 'AI PDF',
  menuExportPdf: 'Xuất dưới dạng PDF…',
  menuExportImages: 'Xuất dưới dạng hình ảnh…',
  menuExportHtml: 'Xuất thành tệp HTML đơn…',
  menuOpenInDocs: 'Chuyển đổi và mở trong Docs',
  menuPrint: 'In…',
  menuOpen: 'Mở…',
  menuSave: 'Lưu',
  menuSaveAs: 'Lưu dưới dạng…',
  menuClose: 'Đóng',
  menuEdit: 'Chỉnh sửa',
  menuWindow: 'Cửa sổ',
  menuHome: 'Trang chủ',
  backToHome: 'Quay lại Trang chủ',
  dlgOpenTitle: 'Mở tệp',
  filterSupported: 'Tệp được hỗ trợ',
  filterWord: 'Tài liệu Word',
  filterExcel: 'Sổ làm việc Excel',
  filterPpt: 'Bản trình bày PowerPoint',
  filterMarkdown: 'Tài liệu Markdown',
  filterHtml: 'Tài liệu HTML',
  filterPdf: 'Tài liệu PDF',
  errBadArgs: 'Tham số không hợp lệ',
  errBadName: 'Tên tệp không hợp lệ',
  errMissing: 'Không tìm thấy tệp',
  errExists: 'Tệp cùng tên đã tồn tại',
  errRenameFailed: 'Đổi tên thất bại',
  errPdfSaveAsFailed: 'Không thể lưu bản sao PDF',
  errNewTabFailed: 'Không thể tạo tài liệu mới',
  errUnsupportedExt: 'Tệp .{ext} không được hỗ trợ',
  copySuffix: 'bản sao',
  menuHelp: 'Trợ giúp',
  thirdPartyNotices: 'Thông báo bên thứ ba',
  menuExportDocx: 'Xuất dưới dạng Word…',
  btnCancel: 'Hủy',
  pdfDocxFailedMsg: 'Xuất dưới dạng Word thất bại',
  pdfDocxBusyMsg: 'Đang trong quá trình xuất tệp Word. Vui lòng chờ hoàn tất.',
  menuExportPptx: 'Xuất dưới dạng PowerPoint…',
  pdfPptxFailedMsg: 'Xuất dưới dạng PowerPoint thất bại',
  pdfPptxBusyMsg: 'Đang trong quá trình xuất tệp. Vui lòng chờ hoàn tất.',
  pdfPptxLocalScannedDetail: 'Mỗi trang đã được xuất dưới dạng hình ảnh nguyên trang; văn bản trên trang chiếu không thể chỉnh sửa.',
  menuExportXlsx: 'Xuất dưới dạng Excel…',
  pdfXlsxFailedMsg: 'Xuất dưới dạng Excel thất bại',
  pdfXlsxBusyMsg: 'Đang trong quá trình xuất tệp. Vui lòng chờ hoàn tất.',
  pdfXlsxLocalScannedDetail: 'Các trang quét không thể chuyển đổi thành các ô; trang tính tương ứng mang một dòng thông báo.',
  pdfXlsxLocalSkippedMsg: 'Một số trang không được chuyển đổi thành các ô',
  pdfXlsxLocalSkippedDetail: 'Trang {pages} không thể chuyển thành ô; trang tính tương ứng mang một dòng thông báo.',
  pdfDocxLocalScannedMsg: 'Đã phát hiện tài liệu quét',
  pdfDocxLocalScannedDetail: 'Các trang đã được xuất dưới dạng hình ảnh để bảo toàn hình thức; không nhận dạng được văn bản có thể chỉnh sửa.',
  pdfDocxLocalDegradedMsg: 'Một số trang đã được xuất dưới dạng hình ảnh',
  pdfDocxLocalDegradedDetail: 'Trang {pages} không thể tái tạo bố cục tin cậy và đã được xuất thành hình ảnh toàn trang.',
  pdfDocxLocalOcrMsg: 'Trang quét đã được chuyển đổi thành văn bản có thể chỉnh sửa',
  pdfDocxLocalOcrDetail: 'Trang {pages} là bản quét; văn bản đã được phục hồi bằng OCR trên thiết bị. Vui lòng kiểm tra lại kết quả.',
  pdfDocxLocalEncryptedDetail: 'Tệp PDF này đã được mã hóa và không thể mở nếu không có mật khẩu chính xác.',
  pdfDocxLocalUnsupportedEncDetail: 'Tệp PDF này sử dụng mã hóa dựa trên chứng chỉ hoặc phương thức mã hóa không được hỗ trợ và không thể chuyển đổi.',
  pdfPwdTitle: 'Nhập mật khẩu',
  pdfPwdPrompt: 'Tệp PDF này đã được mã hóa. Nhập mật khẩu để mở:',
  pdfPwdRetryPrompt: 'Mật khẩu không chính xác. Vui lòng thử lại.',
  pdfPwdOk: 'Xác nhận',
  pdfPwdVerifying: 'Đang xác minh mật khẩu…',
  pdfPwdLabel: 'Mật khẩu',
  pdfPwdPlaceholder: 'Nhập mật khẩu mở tệp',
  pdfPwdShow: 'Hiện mật khẩu',
  pdfPwdHide: 'Ẩn mật khẩu',
  pdfDocxLocalCorruptDetail: 'Tệp bị hỏng hoặc không phải là tệp PDF hợp lệ và không thể chuyển đổi.',
  dlgPickSaveDir: 'Chọn vị trí lưu mặc định',
  errSaveDirUnusable: 'Thư mục đã chọn không có quyền ghi và không thể dùng làm vị trí lưu mặc định'
};
const shellIndexEn = {
  dlgAddFolderRoot: 'Add Folder to Home',
  errFolderRootUnusable: 'The selected folder cannot be read',
  menuFile: 'File',
  menuSectionNew: 'New',
  menuOpenInNewWindow: 'Open in New Window',
  menuNewDoc: 'AI Docs',
  menuNewSheet: 'AI Sheets',
  untitledSheet: 'Untitled Spreadsheet',
  untitledDoc: 'Untitled Document',
  untitledDeck: 'Untitled Presentation',
  untitledMarkdown: 'Untitled Markdown',
  untitledHtml: 'Untitled HTML',
  untitledPdf: 'Untitled PDF',
  menuNewSlide: 'AI Slides',
  menuNewMarkdown: 'AI Markdown',
  menuNewHtml: 'AI HTML',
  menuNewPdf: 'AI PDF',
  menuExportPdf: 'Export as PDF…',
  menuExportImages: 'Export as Images…',
  menuExportHtml: 'Export as Single-File HTML…',
  menuOpenInDocs: 'Convert and Open in Docs',
  menuPrint: 'Print…',
  menuOpen: 'Open…',
  menuSave: 'Save',
  menuSaveAs: 'Save As…',
  menuClose: 'Close',
  menuEdit: 'Edit',
  menuWindow: 'Window',
  menuHome: 'Home',
  backToHome: 'Back to Home',
  dlgOpenTitle: 'Open File',
  filterSupported: 'Supported Files',
  filterWord: 'Word Documents',
  filterExcel: 'Excel Workbooks',
  filterPpt: 'PowerPoint Presentations',
  filterMarkdown: 'Markdown Documents',
  filterHtml: 'HTML Documents',
  filterPdf: 'PDF Documents',
  errBadArgs: 'Invalid arguments',
  errBadName: 'Invalid file name',
  errMissing: 'File not found',
  errExists: 'A file with that name already exists',
  errRenameFailed: 'Rename failed',
  errPdfSaveAsFailed: 'Could not save the PDF copy',
  errNewTabFailed: 'Could not create the new document',
  errUnsupportedExt: '.{ext} files are not supported',
  copySuffix: 'copy',
  menuHelp: 'Help',
  thirdPartyNotices: 'Third-Party Notices',
  menuExportDocx: 'Export as Word…',
  btnCancel: 'Cancel',
  pdfDocxFailedMsg: 'Export as Word failed',
  pdfDocxBusyMsg: 'A Word export is already in progress. Please wait for it to finish.',
  menuExportPptx: 'Export as PowerPoint…',
  pdfPptxFailedMsg: 'Export as PowerPoint failed',
  pdfPptxBusyMsg: 'An export is already in progress. Please wait for it to finish.',
  pdfPptxLocalScannedDetail: 'Each page was exported as a full-page image; the text on the slides is not editable.',
  menuExportXlsx: 'Export as Excel…',
  pdfXlsxFailedMsg: 'Export as Excel failed',
  pdfXlsxBusyMsg: 'An export is already in progress. Please wait for it to finish.',
  pdfXlsxLocalScannedDetail: "Scanned pages cannot be converted to cells; each page's worksheet carries a notice row instead.",
  pdfXlsxLocalSkippedMsg: 'Some pages were not converted to cells',
  pdfXlsxLocalSkippedDetail: 'Pages {pages} could not be converted to cells; their worksheets carry a notice row instead.',
  pdfDocxLocalScannedMsg: 'Scanned document detected',
  pdfDocxLocalScannedDetail: 'The pages were exported as images to preserve their appearance; no editable text could be recognized.',
  pdfDocxLocalDegradedMsg: 'Some pages were exported as images',
  pdfDocxLocalDegradedDetail: 'Page(s) {pages} could not be reliably reconstructed and were exported as full-page images.',
  pdfDocxLocalOcrMsg: 'Scanned pages converted to editable text',
  pdfDocxLocalOcrDetail: 'Page(s) {pages} were scans; their text was recovered with on-device OCR. Please proofread the result.',
  pdfDocxLocalEncryptedDetail: 'This PDF is encrypted and could not be opened without the correct password.',
  pdfDocxLocalUnsupportedEncDetail: 'This PDF uses certificate-based or otherwise unsupported encryption and cannot be converted.',
  pdfPwdTitle: 'Enter Password',
  pdfPwdPrompt: 'This PDF is encrypted. Enter the password to open it:',
  pdfPwdRetryPrompt: 'Incorrect password. Please try again.',
  pdfPwdOk: 'OK',
  pdfPwdVerifying: 'Verifying password…',
  pdfPwdLabel: 'Password',
  pdfPwdPlaceholder: 'Enter the open password',
  pdfPwdShow: 'Show password',
  pdfPwdHide: 'Hide password',
  pdfDocxLocalCorruptDetail: 'The file is damaged or not a valid PDF and cannot be converted.',
  dlgPickSaveDir: 'Choose Default Save Location',
  errSaveDirUnusable: 'The selected folder is not writable and cannot be used as the default save location'
};
replaceCreateI18n(shellIndexPath, 'tMain', shellIndexVi, shellIndexEn);

// 3. apps/html/src/main/html-main.ts
const htmlPath = path.resolve('apps/html/src/main/html-main.ts');
const htmlVi = {
  dlgSaveTitle: 'Lưu tài liệu HTML',
  filterHtml: 'Tài liệu HTML',
  dlgPickImage: 'Chọn hình ảnh',
  filterImages: 'Hình ảnh',
  untitledFile: 'Chưa có tiêu đề',
  closeUnsavedMsg: 'Tài liệu này có các thay đổi chưa được lưu.',
  closeUnsavedDetail: 'Bạn có muốn lưu các thay đổi trước khi đóng?',
  btnSave: 'Lưu',
  btnDontSave: 'Không lưu',
  btnCancel: 'Hủy',
  dlgAddAttachment: 'Thêm tệp đính kèm',
  filterSupported: 'Tệp được hỗ trợ',
  filterAll: 'Tất cả tệp',
  errUnsupportedExt: 'Tệp .{ext} không được hỗ trợ',
  errNotFile: 'không phải là tệp',
  errTooLarge: 'vượt quá giới hạn {mb}MB',
  errImageTooLarge: 'hình ảnh vượt quá giới hạn 5MB',
  errUnreadable: 'không thể đọc',
  errFileTooLarge: 'Tệp vượt quá giới hạn kích thước',
  errParseFailed: 'Phân tích tệp thất bại',
  errImageNoText: 'Tệp đính kèm hình ảnh không có văn bản; hình ảnh đã được gửi kèm tin nhắn',
  errNotImage: 'loại hình ảnh không được hỗ trợ'
};
const htmlEn = {
  dlgSaveTitle: 'Save HTML Document',
  filterHtml: 'HTML Documents',
  dlgPickImage: 'Choose an Image',
  filterImages: 'Images',
  untitledFile: 'Untitled',
  closeUnsavedMsg: 'This document has unsaved changes.',
  closeUnsavedDetail: 'Do you want to save them before closing?',
  btnSave: 'Save',
  btnDontSave: "Don't Save",
  btnCancel: 'Cancel',
  dlgAddAttachment: 'Add Attachments',
  filterSupported: 'Supported Files',
  filterAll: 'All Files',
  errUnsupportedExt: '.{ext} files are not supported',
  errNotFile: 'not a file',
  errTooLarge: 'exceeds the {mb}MB limit',
  errImageTooLarge: 'image exceeds the 5MB limit',
  errUnreadable: 'cannot be read',
  errFileTooLarge: 'File exceeds the size limit',
  errParseFailed: 'Failed to parse file',
  errImageNoText: 'Image attachments have no text; the image is sent along with the user message',
  errNotImage: 'not a supported image type'
};
replaceCreateI18n(htmlPath, 'tDlg', htmlVi, htmlEn);

// 4. apps/markdown/src/main/markdown-main.ts
const mdPath = path.resolve('apps/markdown/src/main/markdown-main.ts');
const mdVi = {
  dlgSaveTitle: 'Lưu tài liệu Markdown',
  filterMarkdown: 'Tài liệu Markdown',
  dlgPickImage: 'Chọn hình ảnh',
  dlgSaveImage: 'Lưu hình ảnh',
  filterImages: 'Hình ảnh',
  untitledFile: 'Chưa có tiêu đề',
  closeUnsavedMsg: 'Tài liệu này có các thay đổi chưa được lưu.',
  closeUnsavedDetail: 'Bạn có muốn lưu các thay đổi trước khi đóng?',
  btnSave: 'Lưu',
  btnDontSave: 'Không lưu',
  btnCancel: 'Hủy'
};
const mdEn = {
  dlgSaveTitle: 'Save Markdown Document',
  filterMarkdown: 'Markdown Documents',
  dlgPickImage: 'Choose an Image',
  dlgSaveImage: 'Save Image',
  filterImages: 'Images',
  untitledFile: 'Untitled',
  closeUnsavedMsg: 'This document has unsaved changes.',
  closeUnsavedDetail: 'Do you want to save them before closing?',
  btnSave: 'Save',
  btnDontSave: "Don't Save",
  btnCancel: 'Cancel'
};
replaceCreateI18n(mdPath, 'tDlg', mdVi, mdEn);

// 5. apps/pdf/src/main/pdf-main.ts
const pdfPath = path.resolve('apps/pdf/src/main/pdf-main.ts');
const pdfVi = {
  dlgExportImages: 'Xuất hình ảnh vào thư mục',
  dlgExtract: 'Trích xuất các trang thành PDF',
  dlgInsert: 'Chọn PDF để nhập',
  dlgSplit: 'Tách PDF vào thư mục',
  dlgMerge: 'Chọn các tệp PDF để gộp',
  dlgMergeSave: 'Lưu PDF đã gộp dưới dạng',
  dlgMergePages: 'Lưu các trang đã gộp dưới dạng',
  dlgReplace: 'Chọn tệp PDF thay thế',
  dlgSplitPages: 'Lưu các trang đã tách dưới dạng',
  dlgRedactCopy: 'Lưu bản sao che nội dung dưới dạng',
  filterPdf: 'Tài liệu PDF',
  closeUnsavedMsg: 'Tệp PDF này có các thay đổi chưa được lưu.',
  closeUnsavedDetail: 'Bạn có muốn lưu các thay đổi trước khi đóng?',
  btnSave: 'Lưu',
  btnDontSave: 'Không lưu',
  btnCancel: 'Hủy'
};
const pdfEn = {
  dlgExportImages: 'Export Images to Folder',
  dlgExtract: 'Extract Pages as PDF',
  dlgInsert: 'Choose a PDF to Import',
  dlgSplit: 'Split PDF into Folder',
  dlgMerge: 'Choose PDFs to Merge',
  dlgMergeSave: 'Save Merged PDF As',
  dlgMergePages: 'Save Merged Pages As',
  dlgReplace: 'Choose a Replacement PDF',
  dlgSplitPages: 'Save Split Pages As',
  dlgRedactCopy: 'Save Redacted Copy As',
  filterPdf: 'PDF Documents',
  closeUnsavedMsg: 'This PDF has unsaved changes.',
  closeUnsavedDetail: 'Do you want to save them before closing?',
  btnSave: 'Save',
  btnDontSave: "Don't Save",
  btnCancel: 'Cancel'
};
replaceCreateI18n(pdfPath, 'tDlg', pdfVi, pdfEn);

console.log('All 5 main process i18n blocks successfully updated!');
