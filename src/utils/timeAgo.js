const timeAgo = (date) => {
    const now = new Date();
    const givenDate = new Date(date);

    // Kiểm tra xem có phải là hôm nay không
    if (now.toDateString() === givenDate.toDateString()) {
        return 'Hôm nay';
    }

    const seconds = Math.floor((now - givenDate) / 1000);
    let interval = Math.floor(seconds / 31536000); // Số giây trong một năm

    if (interval > 1) return `${interval} năm trước`;
    interval = Math.floor(seconds / 2592000); // Số giây trong một tháng
    if (interval > 1) return `${interval} tháng trước`;
    interval = Math.floor(seconds / 604800); // Số giây trong một tuần
    if (interval > 1) return `${interval} tuần trước`;
    interval = Math.floor(seconds / 86400); // Số giây trong một ngày
    if (interval === 1) return 'Hôm qua'; // Nếu là hôm qua

    return `${interval} ngày trước`; // Trả về số ngày trước
};

export default timeAgo;