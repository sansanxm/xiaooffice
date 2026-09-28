import fs from 'node:fs';

const rawAi = JSON.parse(fs.readFileSync('tools/i18n-data/raw-ai.json', 'utf8'));

const AI_EXTRA = JSON.parse(fs.readFileSync('tools/i18n-data/ai-full-extra.json', 'utf8'));
export const AI_TRANSLATIONS = {
  ...AI_EXTRA,
  // Common Panel & Titles
  "aiEmptyDraftTitle": "Hãy để AI phác thảo tài liệu này giúp bạn",
  "aiEmptyDraftBody1": "Mô tả chủ đề và các điểm chính, hoặc dán tài liệu tham khảo;",
  "aiEmptyDraftBody2": "AI sẽ viết bản nháp đầu tiên trực tiếp lên trang.",
  "aiStarterSummarize": "Tóm tắt các điểm chính của tài liệu này",
  "aiStarterPolishAll": "Trau chuốt toàn bộ tài liệu để văn phong chuyên nghiệp hơn",
  "aiStarterContinue": "Tiếp tục viết tiếp từ vị trí tài liệu đang dừng lại",
  "aiStarterFillTemplate": "Tìm và điền vào các vị trí giữ chỗ trong tài liệu này",
  "aiGskLoginBtn": "Đăng nhập vào Genspark",
  "aiPanelTitle": "Genspark",
  "aiOpenAssistant": "Mở trợ lý AI",
  "aiSummarizeBtn": "AI Tóm tắt",
  "aiSummarizePrompt": "Tóm tắt nội dung chính và các điểm cốt lõi của tài liệu này",
  "aiPolishBtn": "AI Trau chuốt",
  "aiPolishPrompt": "Trau chuốt toàn bộ tài liệu để câu từ rõ ràng và trôi chảy hơn",
  "aiPolishSelectionPrompt": "Trau chuốt nội dung đã chọn để câu từ rõ ràng và trôi chảy hơn",
  "aiScopeSelection": "{count} phần tử đã chọn",
  "aiScopeSelectionTip": "Các yêu cầu viết lại mặc định áp dụng cho phần đã chọn; nhấp để xem trước",
  "aiScopeClearTitle": "Bỏ phạm vi đã chọn và áp dụng cho toàn bộ",
  "aiAskBtn": "Hỏi AI",
  "aiAskTitle": "Hỏi AI về phần đã chọn",
  "aiAskEditTitle": "Chỉnh sửa chỉ dẫn trong hàng đợi này",
  "aiAskPlaceholder": "Mô tả thay đổi bạn muốn thực hiện…",
  "aiAskSendNow": "Gửi ngay",
  "aiAskQueue": "Thêm vào hàng đợi",
  "aiAskUpdate": "Cập nhật",
  "aiChipPolish": "Trau chuốt đoạn này",
  "aiChipShorten": "Rút gọn đoạn này súc tích hơn",
  "aiChipExpand": "Mở rộng nội dung đoạn này",
  "aiChipFixGrammar": "Sửa lỗi chính tả và ngữ pháp",
  "aiChipReplaceImage": "Thay thế hình ảnh",
  "aiChipRegenImage": "Tạo lại bằng AI",
  "aiChipImageCaption": "Thêm chú thích ảnh",
  "aiChipChartData": "Cập nhật dữ liệu biểu đồ",
  "aiChipChartTitle": "Đổi tiêu đề biểu đồ",
  "aiChipTableEdit": "Điều chỉnh hàng/cột",
  "aiQueueTitle": "Chỉnh sửa trong hàng đợi",
  "aiQueueHint": "Nhấp vào một dòng để chuyển đến đoạn văn tương ứng; gửi sẽ áp dụng tất cả các chỉnh sửa cùng lúc",
  "aiQueueSend": "Gửi {count} chỉnh sửa",
  "aiQueueDiscard": "Hủy bỏ",
  "aiQueueDiscardConfirm": "Hủy tất cả {count} chỉnh sửa trong hàng đợi?",
  "aiQueueRowEdit": "Chỉnh sửa",
  "aiQueueOrphan": "Đoạn văn bản đích đã bị xóa",
  "aiQueueFullNotice": "Hàng đợi đã đầy (tối đa {max})",
  "aiQueueSubmitted": "Nhóm gồm {count} chỉnh sửa:",
  "aiSumReadComments": "Đọc nhận xét",
  "aiSumReadRevisions": "Đọc bản sửa đổi",
  "aiSumReplyComment": "Đã trả lời nhận xét",
  "aiSumResolveComment": "Đã giải quyết nhận xét",
  "aiSumAcceptChanges": "Đã chấp nhận thay đổi",
  "aiSumRejectChanges": "Đã từ chối thay đổi",
  "aiSumInsertFootnote": "Đã chèn chú thích cuối trang",
  "aiSumInsertEndnote": "Đã chèn chú thích cuối tài liệu",
  "aiSumDeleteNote": "Đã xóa chú thích",
  "aiSumEditNote": "Đã sửa chú thích",
  "aiSumReadNotes": "Đọc chú thích",
  "aiSumAddComment": "Đã thêm nhận xét",
  "aiSumDeleteComment": "Đã xóa nhận xét",
  "aiTidyBtn": "AI Định dạng",
  "aiTidyPrompt": "Dọn dẹp định dạng tài liệu — ví dụ sửa cấp độ tiêu đề, đồng nhất định dạng danh sách, loại bỏ in đậm/nghiêng không cần thiết và tạo sự nhất quán cho khoảng cách thụt lề đoạn văn. Chỉ điều chỉnh định dạng — không thay đổi bất kỳ nội dung văn bản nào",
  "aiSwitchModelTitle": "Đổi mô hình AI",
  "aiNewChatTitle": "Cuộc trò chuyện mới",
  "aiCollapseTitle": "Thu gọn bảng",
  "aiHistorySep": "—— Cuộc trò chuyện trước đó ——",
  "aiEmptyTitle": "Thiết kế trang cùng AI",
  "aiEmptyBody1": "Đưa ra chỉ dẫn hoặc đặt câu hỏi;",
  "aiEmptyBody2": "khi đã chọn các phần tử, lệnh viết lại sẽ nhắm vào phần tử đã chọn.",
  "aiStarterWeeklyReport": "Viết báo cáo tiến độ dự án tuần cho tôi",
  "aiStarterLaunchPost": "Soạn thảo thông báo ra mắt sản phẩm",
  "aiStarterEventOutline": "Lập dàn ý kế hoạch tổ chức sự kiện",
  "aiThinking": "Đang suy nghĩ",
  "aiStreaming": "Đang phản hồi…",
  "aiDone": "Đã hoàn thành",
  "aiError": "Đã xảy ra lỗi",
  "aiRetry": "Thử lại",
  "aiCopy": "Sao chép",
  "aiCopied": "Đã sao chép",
  "aiInsert": "Chèn vào tài liệu",
  "aiReplace": "Thay thế phần đã chọn",
  "aiDiscard": "Hủy bỏ",
  "aiKeep": "Giữ lại",
  "aiStop": "Dừng",
  "aiStopped": "Đã dừng",
  "aiRegenerate": "Tạo lại",
  "aiPlaceholderInput": "Nhập yêu cầu cho AI (nhấn Enter để gửi, Shift+Enter để xuống dòng)…",
  "aiSend": "Gửi",
  "aiAttachFiles": "Đính kèm tệp",
  "aiAttachHint": "Đính kèm tệp cục bộ (hoặc kéo thả vào bảng này)",
  "aiNoCredits": "Bạn đã hết tín dụng AI. Vui lòng nạp thêm để tiếp tục.",
  "aiTimeout": "Yêu cầu AI đã hết thời gian chờ: mạng không phản hồi. Vui lòng kiểm tra kết nối và thử lại.",
  "aiServiceBusy": "Dịch vụ AI đang bận — vui lòng thử lại sau giây lát.",
  "aiNetworkError": "Sự cố mạng: không thể kết nối tới dịch vụ AI. Kiểm tra kết nối và thử lại.",
  "aiEmptyResponse": "AI không trả về nội dung nào.",
  "aiTruncated": "(Phản hồi đã bị cắt ngắn do giới hạn độ dài và có thể chưa đầy đủ.)",
  "aiWroteContent": "Đã viết xong nội dung",
  "aiWrotePart": "Đã viết một phần nội dung",
  "aiWritingBlocks": "Đang viết tài liệu · {blocks} đoạn",
  "aiKeepOrDiscard": "Đã nhận được {blocks} đoạn trước khi dừng. Bạn muốn giữ lại phần này hay hủy bỏ?",
  "aiNoChange": "Không có đoạn nào khớp; tài liệu không bị thay đổi.",
  "aiProtectedSkip": "Không có đoạn văn nào có thể chỉnh sửa; tài liệu không thay đổi ({count} đoạn được bảo vệ đã được bỏ qua — bảng/hình ảnh không thể thay đổi bằng lệnh định dạng kiểu).",
  "aiUnchangedCount": "{count} đoạn khớp vẫn giữ nguyên; tài liệu không bị thay đổi."
};

export function translateAiItem(val, key) {
  // 1. Direct key match
  if (AI_TRANSLATIONS[key]) return AI_TRANSLATIONS[key];
  // 2. Direct value match
  if (AI_TRANSLATIONS[val]) return AI_TRANSLATIONS[val];

  // Specific key patterns
  if (val.startsWith('Writing the document · ')) {
    return val.replace('Writing the document · ', 'Đang viết tài liệu · ');
  }
  if (val.startsWith('Batch of ') && val.endsWith(' edits:')) {
    return val.replace('Batch of ', 'Nhóm gồm ').replace(' edits:', ' chỉnh sửa:');
  }
  if (val.startsWith('Selected: ') && val.endsWith(' words')) {
    return val.replace('Selected: ', 'Đã chọn: ').replace(' words', ' từ');
  }
  if (val.startsWith('Send ') && val.endsWith(' edits')) {
    return val.replace('Send ', 'Gửi ').replace(' edits', ' chỉnh sửa');
  }
  if (val.startsWith('Discard all ') && val.endsWith(' queued edits?')) {
    return val.replace('Discard all ', 'Hủy tất cả ').replace(' queued edits?', ' chỉnh sửa trong hàng đợi?');
  }
  if (val.startsWith('Queue is full (') && val.endsWith(' max)')) {
    return val.replace('Queue is full (', 'Hàng đợi đã đầy (tối đa ').replace(' max)', ')');
  }
  if (val.includes('blocks arrived before the writing stopped. Keep this part or discard it?')) {
    return val.replace('blocks arrived before the writing stopped. Keep this part or discard it?', 'đoạn đã được ghi trước khi dừng. Giữ lại phần này hay hủy bỏ?');
  }

  return null;
}
