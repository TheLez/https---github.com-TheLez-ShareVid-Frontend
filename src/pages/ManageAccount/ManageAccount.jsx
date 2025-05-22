import React, { useState, useEffect } from 'react';
import { useAuth } from '../../authContext';
import axiosInstance from '../../utils/axiosInstance';
import SideBar from '../../components/SideBar/SideBar';
import './ManageAccount.scss';

const ManageAccount = ({ sidebar, setSidebar }) => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(10);
    const [formData, setFormData] = useState({
        name: '',
        gender: '',
        birth: '',
        email: '',
        role: '',
        avatar: null,
        status: ''
    });
    const [avatarPreview, setAvatarPreview] = useState('');
    const [formError, setFormError] = useState(null);
    const LIMIT = 10;

    // Ánh xạ gender và status
    const mapGenderToForm = (dbGender) => {
        if (dbGender === 1) return 'male';
        if (dbGender === 0) return 'female';
        return '';
    };

    const mapGenderToDB = (formGender) => {
        if (formGender === 'male') return 1;
        if (formGender === 'female') return 0;
        return null;
    };

    const mapStatusToForm = (dbStatus) => {
        if (dbStatus === 1) return 'active';
        if (dbStatus === 0) return 'locked';
        return '';
    };

    const mapStatusToDB = (formStatus) => {
        if (formStatus === 'active') return 1;
        if (formStatus === 'locked') return 0;
        return null;
    };

    useEffect(() => {
        setSidebar(true);
    }, [setSidebar]);

    // Fetch danh sách tài khoản
    useEffect(() => {
        const fetchAccounts = async () => {
            if (!user?.id) {
                setError('Vui lòng đăng nhập để quản lý tài khoản.');
                return;
            }
            setLoading(true);
            try {
                const params = { page, limit: LIMIT };
                if (searchQuery) params.search = searchQuery;
                const res = await axiosInstance.get('/account/get-all', { params });
                console.log('API response:', res.data); // Debug response
                const newAccounts = Array.isArray(res.data.data?.accounts)
                    ? res.data.data.accounts.filter(acc => acc && acc.userid)
                    : [];
                setAccounts(page === 1 ? newAccounts : [...accounts, ...newAccounts]);
                setHasMore(newAccounts.length === LIMIT);
                setError(null);
            } catch (err) {
                console.error('Error fetching accounts:', err.response?.data || err.message);
                setError(err.response?.data?.error || 'Không thể tải danh sách tài khoản.');
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, [user, page, searchQuery]);

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
                hasMore &&
                !loading
            ) {
                setPage(prev => prev + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading]);

    // Xử lý tìm kiếm
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
        setAccounts([]);
        setHasMore(true);
    };

    // Xử lý click vào tài khoản
    const handleAccountClick = (account) => {
        if (!account || !account.userid) {
            setError('Dữ liệu tài khoản không hợp lệ.');
            return;
        }
        setSelectedAccount(account);
        setFormData({
            name: account.name || '',
            gender: mapGenderToForm(account.gender),
            birth: account.birth ? new Date(account.birth).toISOString().split('T')[0] : '',
            email: account.email || '',
            role: account.role || '',
            avatar: null,
            status: mapStatusToForm(account.status)
        });
        setAvatarPreview(account.avatar || '');
        setShowEditForm(true);
        setFormError(null);
    };

    // Xử lý form chỉnh sửa
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setFormError('Ảnh đại diện không được lớn hơn 2MB.');
                return;
            }
            setFormData(prev => ({ ...prev, avatar: file }));
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError('Tên tài khoản không được để trống.');
            return;
        }
        if (!formData.email.trim()) {
            setFormError('Email không được để trống.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setFormError('Email không hợp lệ.');
            return;
        }
        if (!formData.role) {
            setFormError('Vui lòng chọn vai trò.');
            return;
        }
        if (!formData.status) {
            setFormError('Vui lòng chọn trạng thái.');
            return;
        }
        if (formData.birth && new Date(formData.birth) > new Date()) {
            setFormError('Ngày sinh không được là tương lai.');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            const gender = mapGenderToDB(formData.gender);
            formDataToSend.append('gender', gender !== null ? gender : ''); // Gửi chuỗi rỗng nếu null
            formDataToSend.append('birth', formData.birth || '');
            formDataToSend.append('email', formData.email);
            formDataToSend.append('role', formData.role);
            const status = mapStatusToDB(formData.status);
            if (status === null) {
                throw new Error('Trạng thái không hợp lệ.');
            }
            formDataToSend.append('status', status);
            if (formData.avatar) {
                formDataToSend.append('avatar', formData.avatar);
            }

            // Log payload
            const payload = {};
            for (let [key, value] of formDataToSend.entries()) {
                payload[key] = value;
            }
            console.log('FormData payload:', payload);

            const res = await axiosInstance.put(`/account/update-account/${selectedAccount.userid}`, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Log toàn bộ response
            console.log('Update response (full):', res);

            // Kiểm tra response
            if (!res.data || !res.data.data || typeof res.data.data !== 'object' || !res.data.data.userid) {
                throw new Error(`Dữ liệu tài khoản cập nhật không hợp lệ: ${JSON.stringify(res.data)}`);
            }

            // Cập nhật danh sách tài khoản
            setAccounts(prev => prev.map(acc =>
                acc.userid === selectedAccount.userid ? { ...acc, ...res.data.data } : acc
            ));
            setShowEditForm(false);
            setFormError(null);
            setFormData(prev => ({ ...prev, avatar: null }));
            setAvatarPreview(res.data.data.avatar || '');
            alert('Cập nhật tài khoản thành công!');
        } catch (err) {
            console.error('Error updating account:', err.response?.data || err.message);
            const errorMessage = err.response?.data?.error || err.message || 'Không thể cập nhật tài khoản.';
            setFormError(`Lỗi: ${errorMessage}`);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa tài khoản này?')) return;

        try {
            await axiosInstance.delete(`/account/delete-account/${selectedAccount.userid}`);
            setAccounts(prev => prev.filter(acc => acc.userid !== selectedAccount.userid));
            setShowEditForm(false);
            setError(null);
            alert('Xóa tài khoản thành công!');
        } catch (err) {
            console.error('Error deleting account:', err.response?.data || err.message);
            setFormError(err.response?.data?.error || 'Không thể xóa tài khoản.');
        }
    };

    const handleFormCancel = () => {
        setShowEditForm(false);
        setFormError(null);
        setSelectedAccount(null);
        setAvatarPreview('');
    };

    return (
        <>
            <SideBar
                sidebar={sidebar}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                setFeedParams={() => { }}
                category={category}
                setCategory={setCategory}
            />
            <div className={`container ${sidebar ? '' : 'large-container'}`}>
                <div className="manage-account-page">
                    <h2>Quản lý tài khoản</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo userid hoặc name"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <table className="account-table">
                        <thead>
                            <tr>
                                <th>UserID</th>
                                <th>Tên</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan="6">Không có tài khoản nào.</td>
                                </tr>
                            ) : (
                                accounts
                                    .filter(acc => acc && acc.userid) // Loại bỏ phần tử không hợp lệ
                                    .map(account => (
                                        <tr
                                            key={account.userid}
                                            onClick={() => handleAccountClick(account)}
                                            className="account-row"
                                        >
                                            <td>{account.userid}</td>
                                            <td>{account.name || 'N/A'}</td>
                                            <td>{account.email || 'N/A'}</td>
                                            <td>{account.role || 'N/A'}</td>
                                            <td>{account.status === 1 ? 'Hoạt động' : 'Khóa'}</td>
                                            <td>{account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                    {loading && <p>Đang tải...</p>}

                    {showEditForm && selectedAccount && (
                        <div className="edit-form-modal">
                            <div className="edit-form-content">
                                <h3>Thông tin tài khoản</h3>
                                <form onSubmit={handleFormSubmit}>
                                    <div className="form-group">
                                        <label>Tên tài khoản</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Giới tính</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ngày sinh</label>
                                        <input
                                            type="date"
                                            name="birth"
                                            value={formData.birth}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Vai trò</label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Chọn vai trò</option>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ảnh đại diện</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                        {avatarPreview && (
                                            <img
                                                src={avatarPreview}
                                                alt="Preview"
                                                className="avatar-preview"
                                            />
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Trạng thái</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Chọn trạng thái</option>
                                            <option value="active">Hoạt động</option>
                                            <option value="locked">Khóa</option>
                                        </select>
                                    </div>
                                    {formError && <p className="error">{formError}</p>}
                                    <div className="form-actions">
                                        <button type="submit">Lưu</button>
                                        <button type="button" onClick={handleDelete}>Xóa</button>
                                        <button type="button" onClick={handleFormCancel}>Hủy</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ManageAccount;