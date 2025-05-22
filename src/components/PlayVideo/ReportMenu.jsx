import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';

const ReportMenu = ({ video, onClose }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    const reportReasons = [
        "Vi phạm bản quyền",
        "Nội dung phản cảm",
        "Thông tin sai lệch",
        "Kích động/thù ghét",
        "Quảng bá chủ nghĩa khủng bố",
        "Khác"
    ];

    const submitReport = async () => {
        const reason = selectedReason === 'Khác' ? customReason.trim() : selectedReason;
        if (!reason) {
            alert("Vui lòng chọn hoặc nhập lý do báo cáo.");
            return;
        }

        try {
            await axiosInstance.post('/notification/report', {
                content: `Báo cáo video "${video.title}" (ID: ${video.videoid}): ${reason}`,
            });
            alert("Báo cáo đã được gửi.");
            onClose();
        } catch (error) {
            console.error("❌ Lỗi khi gửi báo cáo:", error);
            alert("Gửi báo cáo thất bại.");
        }
    };

    return (
        <div className="report-menu">
            <h4>Chọn lý do báo cáo</h4>
            <ul>
                {reportReasons.map(reason => (
                    <li key={reason}>
                        <label>
                            <input
                                type="radio"
                                name="report-reason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                            />
                            {reason}
                        </label>
                    </li>
                ))}
            </ul>
            {selectedReason === 'Khác' && (
                <textarea
                    placeholder="Nhập lý do khác..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                />
            )}
            <button onClick={submitReport}>Gửi báo cáo</button>
        </div>
    );
};

export default ReportMenu;