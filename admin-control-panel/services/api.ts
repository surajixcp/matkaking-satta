import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://matkaking-satta-1.onrender.com/api/v1';

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
        console.log('[API] Request to:', config.url);
        console.log('[API] Token present:', !!token);
        if (token) {
            console.log('[API] Token (first 20 chars):', token.substring(0, 20) + '...');
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
                joinedAt: new Date(user.createdAt || user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                bank_name: user.bank_name,
                account_number: user.account_number,
                ifsc_code: user.ifsc_code,
                account_holder_name: user.account_holder_name,
                upi_id: user.upi_id
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
    },
    getUserHistory: async (id: string, name: string = 'Unknown') => {
        const response = await api.get(`/admin/users/${id}/history`);
        const response = await api.get(`/admin/users/${id}/history`);
        const { transactions, withdrawals, totalWinnings } = response.data.data;

        return {
            totalWinnings: parseFloat(totalWinnings || '0'),
            transactions: transactions.map((t: any) => ({
                id: `${t.id}`,
                user: name,
                userId: id,
                type: t.type,
                amount: parseFloat(t.amount),
                date: new Date(t.created_at || t.createdAt).toLocaleString(),
                status: t.status || 'success',
                method: t.description || 'Wallet' // Use description or default
            })),
            withdrawals: withdrawals.map((w: any) => ({
                id: w.id.toString(),
                userId: id,
                userName: name,
                amount: parseFloat(w.amount),
                status: w.status,
                method: 'UPI',
                details: w.bank_details || {},
                requestedAt: new Date(w.created_at || w.createdAt).toLocaleString(),
                processedAt: w.updatedAt ? new Date(w.updatedAt).toLocaleString() : undefined,
                rejectionReason: w.admin_remark
            })),
            bids: (response.data.data.bids || []).map((b: any) => ({
                id: b.id.toString(),
                userId: id,
                userName: name,
                gameName: b.market?.name || 'Unknown Market',
                marketType: b.game_type?.name || 'Unknown Type',
                digits: b.digit,
                amount: parseFloat(b.amount),
                multiplier: parseFloat(b.game_type?.rate || '0'),
                session: b.session,
                timestamp: new Date(b.createdAt).toLocaleTimeString(),
                date: new Date(b.createdAt).toLocaleDateString()
            }))
        }))
    };
},
    deleteUser: async (id: string) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
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
        const response = await api.get('/withdraw/admin/all', { params: { status: status !== 'all' ? status : undefined } });
        const withdrawals = response.data.data || [];
        return withdrawals.map((w: any) => ({
            id: w.id.toString(),
            userId: w.user_id?.toString() || w.user?.id?.toString() || 'Unknown',
            userName: w.user?.full_name || w.user?.username || 'Unknown',
            amount: parseFloat(w.amount),
            status: w.status,
            method: 'UPI', // Default for now
            details: {
                holderName: w.user?.full_name || '',
                bankName: '',
                accountNo: '',
                ifsc: '',
                upiId: w.user?.phone || ''
            },
            requestedAt: new Date(w.createdAt).toLocaleString(),
            processedAt: w.updatedAt ? new Date(w.updatedAt).toLocaleString() : undefined,
            rejectionReason: w.admin_remark
        }));
    },
    approveWithdrawal: async (id: string) => {
        const response = await api.post(`/withdraw/admin/${id}/approve`);
        return response.data;
    },
    rejectWithdrawal: async (id: string, reason: string) => {
        const response = await api.post(`/withdraw/admin/${id}/reject`, { remark: reason });
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

export const scraperService = {
    getRecent: async () => {
        const response = await api.get('/scraper/results');
        return response.data.data;
    }
};

export default api;
