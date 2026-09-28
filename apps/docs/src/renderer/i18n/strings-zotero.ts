import { defineStrings } from '@genoffice/i18n'

const en = {
  zoteroCitation: 'Zotero Citation',
  zoteroCitationTip: 'Add a citation with Zotero; place the cursor in a citation to edit it',
  zoteroBibliography: 'Zotero Bibliography',
  zoteroBibliographyTip: 'Add or edit the bibliography with Zotero',
  zoteroRefresh: 'Refresh',
  zoteroRefreshTip: 'Refresh all Zotero citations and bibliographies',
  zoteroDocumentSettings: 'Document Settings',
  zoteroDocumentSettingsTip: 'Zotero document settings',
  zoteroDocumentPreferences: 'Document Preferences',
  zoteroRemoveCodes: 'Remove Field Codes',
  zoteroConnectionError: 'Unable to connect to Zotero. Start Zotero and keep it running.',
  zoteroOperationError: 'The Zotero operation failed.',
  zoteroNoteFieldsUnsupported:
    'This document has Zotero citations in footnotes or endnotes, which GenOffice cannot update yet. Zotero commands are turned off here so the bibliography stays intact.',
  zoteroGroup: 'Zotero',
}

const vi: Record<keyof typeof en, string> = {
  zoteroCitation: 'Trích dẫn Zotero',
  zoteroCitationTip: 'Thêm trích dẫn với Zotero; đặt con trỏ chuột vào trích dẫn để chỉnh sửa',
  zoteroBibliography: 'Tài liệu tham khảo Zotero',
  zoteroBibliographyTip: 'Thêm hoặc chỉnh sửa danh mục tài liệu tham khảo với Zotero',
  zoteroRefresh: 'Làm mới',
  zoteroRefreshTip: 'Làm mới tất cả các trích dẫn và tài liệu tham khảo Zotero',
  zoteroDocumentSettings: 'Cài đặt tài liệu',
  zoteroDocumentSettingsTip: 'Cài đặt tài liệu Zotero',
  zoteroDocumentPreferences: 'Tùy chọn tài liệu',
  zoteroRemoveCodes: 'Xóa mã trường',
  zoteroConnectionError: 'Không thể kết nối với Zotero. Hãy khởi chạy Zotero và giữ ứng dụng tiếp tục chạy.',
  zoteroOperationError: 'Thao tác Zotero thất bại.',
  zoteroNoteFieldsUnsupported:
    'Tài liệu này có trích dẫn Zotero trong chú thích cuối trang hoặc chú thích cuối tài liệu, tính năng cập nhật chưa được hỗ trợ. Các lệnh Zotero đã tạm tắt để bảo toàn danh mục tài liệu tham khảo.',
  zoteroGroup: 'Zotero',
}

/** Strings for the Zotero integration in the References tab. */
export const zoteroStrings = defineStrings({
  en,
  vi,
})
