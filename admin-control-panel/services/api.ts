import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (phone: string, mpin: string) => {
        const response = await api.post('/admin/login', { phone, mpin });
        if (response.data.success) {
            localStorage.setItem('admin_token', response.data.token);
            localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
    },
    isAuthenticated: () => {
        return !!localStorage.getItem('admin_token');
    }
};

export const dashboardService = {
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data.data;
    }
};

export const userService = {
    getUsers: async (page = 1, limit = 10, search = '') => {
        try {
            console.log('[API] Fetching users...', { page, limit, search });
            const response = await api.get('/admin/users', { params: { page, limit, search } });
            console.log('[API] User response:', response.data);

            const { users, total, totalPages, currentPage } = response.data.data;

            const mappedUsers = users.map((user: any) => ({
                id: user.id.toString(),
                name: user.full_name || 'N/A',
                phone: user.phone,
                balance: parseFloat(user.wallet?.balance || '0'),
                status: user.status,
                joinedAt: new Date(user.createdAt || user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }));

            return { users: mappedUsers, total, totalPages, currentPage };
        } catch (error) {
            console.error('[API] Error fetching users:', error);
            throw error;
        }
    },
    updateStatus: async (id: string, status: string) => {
        const response = await api.put(`/admin/users/${id}/status`, { status });
        return response.data.data;
    }
};

export const marketService = {
    getMarkets: async () => {
        const response = await api.get('/markets');
        return response.data.data.map((m: any) => ({
            ...m,
            openTime: m.open_time,
            closeTime: m.close_time,
            status: m.status ? 'Open' : 'Closed'
        }));
    },
    createMarket: async (data: any) => {
        const payload = {
            name: data.name,
            open_time: data.openTime,
            close_time: data.closeTime,
            status: data.status === 'Open',
            type: data.type
        };
        const response = await api.post('/markets', payload);
        const m = response.data.data;
        return {
            ...m,
            openTime: m.open_time,
            closeTime: m.close_time,
            status: m.status ? 'Open' : 'Closed'
        };
    },
    updateMarket: async (id: string, data: any) => {
        const payload: any = {};
        if (data.name) payload.name = data.name;
        if (data.openTime) payload.open_time = data.openTime;
        if (data.closeTime) payload.close_time = data.closeTime;
        if (data.status) payload.status = data.status === 'Open';

        const response = await api.put(`/markets/${id}`, payload);
        const m = response.data.data;
        return {
            ...m,
            openTime: m.open_time,
            closeTime: m.close_time,
            status: m.status ? 'Open' : 'Closed'
        };
    },
    deleteMarket: async (id: string) => {
        const response = await api.delete(`/markets/${id}`);
        return response.data.data;
    }
};

export const resultService = {
    declareResult: async (data: any) => {
        const response = await api.post('/results', data);
        return response.data.data;
    },
    getHistory: async () => {
        const response = await api.get('/results');
        return response.data.data;
    },
    revoke: async (id: string) => {
        const response = await api.del(`/results/${id}`);
        return response;
    }
}

export const walletService = {
    getWithdrawals: async (status: string = 'all') => {
        const response = await api.get('/wallet/withdrawals', { params: { status } });
        const withdrawals = response.data.data.rows || response.data.data;
        return withdrawals.map((w: any) => ({
            id: w.id.toString(),
            userId: w.user?.username || 'Unknown', // Mapping user object
            userName: w.user?.username || 'Unknown', // Duplicate for UI
            amount: parseFloat(w.amount),
            status: w.status,
            method: w.bank_details?.method || 'Bank',
            details: {
                holderName: w.bank_details?.account_holder_name || w.bank_details?.holder_name || '',
                bankName: w.bank_details?.bank_name || '',
                accountNo: w.bank_details?.account_number || '',
                ifsc: w.bank_details?.ifsc_code || '',
                upiId: w.bank_details?.upi_id || ''
            },
            requestDate: new Date(w.created_at || w.createdAt).toLocaleString(),
            processedDate: w.updatedAt ? new Date(w.updatedAt).toLocaleString() : undefined,
            rejectionReason: w.admin_remark
        }));
    },
    approveWithdrawal: async (id: string) => {
        const response = await api.put(`/wallet/withdrawals/${id}/approve`);
        return response.data;
    },
    rejectWithdrawal: async (id: string, reason: string) => {
        const response = await api.put(`/wallet/withdrawals/${id}/reject`, { reason });
        return response.data;
    }
};

export const bidsService = {
    getAllBids: async (filters: any = {}) => {
        const response = await api.get('/bids/all', { params: filters });
        const rows = response.data.data.rows || [];
        return rows.map((b: any) => ({
            id: b.id.toString(),
            userId: b.user_id.toString(),
            userName: b.user?.full_name || 'Unknown',
            gameName: b.market?.name || 'Unknown Market',
            marketType: b.game_type?.name || 'Unknown Type',
            digits: b.digit,
            amount: parseFloat(b.amount),
            multiplier: parseFloat(b.game_type?.rate || '1'),
            session: b.session,
            timestamp: new Date(b.createdAt).toLocaleTimeString(),
            date: new Date(b.createdAt).toLocaleDateString()
        }));
    }
};

export const depositService = {
    getDeposits: async (status: string = 'all') => {
        const response = await api.get('/deposits/admin/all', { params: { status } });
        const deposits = response.data.data.rows || response.data.data;
        return deposits.map((d: any) => ({
            id: d.id.toString(),
            userId: d.user?.phone || 'Unknown', // Changed to phone
            userName: d.user?.full_name || 'Unknown', // Changed to full_name
            amount: parseFloat(d.amount),
            utr: d.utr_number,
            screenshotUrl: d.screenshot_url,
            status: d.status,
            requestDate: new Date(d.created_at || d.createdAt).toLocaleString(),
            processedBy: d.approved_by,
            adminRemark: d.admin_remark
        }));
    },
    approveDeposit: async (id: string) => {
        const response = await api.put(`/deposits/${id}/approve`);
        return response.data;
    },
    rejectDeposit: async (id: string, reason: string) => {
        const response = await api.put(`/deposits/${id}/reject`, { reason });
        return response.data;
    }
};

export const settingsService = {
    getAll: () => api.get('/settings'),
    update: (data: any) => api.put('/settings', data),
};

export default api;
