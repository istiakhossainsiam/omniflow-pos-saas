const API_BASE_URL = '/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('omniflow_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, clear token if expired
    if (!endpoint.includes('/auth/login')) {
      // localStorage.removeItem('omniflow_token');
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || 'An error occurred during API request');
  }

  return data;
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getProfile: () => apiRequest('/auth/me'),
  switchBranch: (branchId) => apiRequest(`/auth/switch-branch/${branchId}`, { method: 'POST' }),
};

export const tenantApi = {
  getCurrent: () => apiRequest('/tenants/current'),
  getBranches: () => apiRequest('/tenants/branches'),
  createBranch: (branchData) => apiRequest('/tenants/branches', { method: 'POST', body: JSON.stringify(branchData) }),
  updateBranch: (branchId, branchData) => apiRequest(`/tenants/branches/${branchId}`, { method: 'PUT', body: JSON.stringify(branchData) }),
  deleteBranch: (branchId) => apiRequest(`/tenants/branches/${branchId}`, { method: 'DELETE' }),
  getAttendancePolicy: () => apiRequest('/tenants/attendance-policy'),
  updateAttendancePolicy: (policyData) => apiRequest('/tenants/attendance-policy', { method: 'PUT', body: JSON.stringify(policyData) }),
  getSettings: () => apiRequest('/tenants/settings'),
  updateSettings: (settingsData) => apiRequest('/tenants/settings', { method: 'PUT', body: JSON.stringify(settingsData) }),
  getSaasOverview: () => apiRequest('/tenants/saas-overview'),
  provision: (data) => apiRequest('/tenants/provision', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (tenantId, data) => apiRequest(`/tenants/${tenantId}/plan`, { method: 'PUT', body: JSON.stringify(data) }),
  getPlans: () => apiRequest('/tenants/plans'),
  createPlan: (data) => apiRequest('/tenants/plans', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscriptionPlan: (planId, data) => apiRequest(`/tenants/plans/${planId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlan: (planId) => apiRequest(`/tenants/plans/${planId}`, { method: 'DELETE' }),
  getLandingContent: () => apiRequest('/tenants/landing-content'),
  updateLandingContent: (data) => apiRequest('/tenants/landing-content', { method: 'PUT', body: JSON.stringify(data) }),
};

export const productApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products?${query}`);
  },
  getCategories: () => apiRequest('/products/categories'),
  generateMatrix: (matrixData) => apiRequest('/products/matrix-generate', { method: 'POST', body: JSON.stringify(matrixData) }),
  update: (productId, data) => apiRequest(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (productId) => apiRequest(`/products/${productId}`, { method: 'DELETE' }),
  updateVariant: (variantId, data) => apiRequest(`/products/variants/${variantId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVariant: (variantId) => apiRequest(`/products/variants/${variantId}`, { method: 'DELETE' }),
};

export const posApi = {
  scanBarcode: (barcode, branchId) => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/pos/scan/${encodeURIComponent(barcode)}${query}`);
  },
  createOrder: (orderData) => apiRequest('/pos/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getParkedOrders: (branchId) => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/pos/orders/parked${query}`);
  },
  searchCustomers: (query) => apiRequest(`/pos/customers/search?q=${encodeURIComponent(query)}`),
  createCustomer: (customerData) => apiRequest('/pos/customers', { method: 'POST', body: JSON.stringify(customerData) }),
  getShiftSummary: (branchId) => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/pos/shift-summary${query}`);
  },
  sendWhatsAppBill: (orderId, phone) => {
    return apiRequest(`/pos/orders/${orderId}/whatsapp-bill`, {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  },
  testWhatsAppConnection: (data) => {
    return apiRequest('/pos/whatsapp-test', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  lookupExchange: (query) => apiRequest(`/pos/orders/lookup-exchange?q=${encodeURIComponent(query)}`),
  processExchange: (data) => apiRequest('/pos/orders/process-exchange', { method: 'POST', body: JSON.stringify(data) }),
  getExchangeHistory: (branchId) => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/pos/exchanges/history${query}`);
  },
  getDueLedger: (search) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/pos/customers/due-ledger${query}`);
  },
  repayCustomerDue: (customerId, data) => apiRequest(`/pos/customers/${customerId}/repay-due`, { method: 'POST', body: JSON.stringify(data) }),
  getCustomerDueHistory: (customerId) => apiRequest(`/pos/customers/${customerId}/due-history`),
  getCurrentRegisterSession: (branchId) => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/pos/register/current-session${query}`);
  },
  openRegisterSession: (data) => apiRequest('/pos/register/open-session', { method: 'POST', body: JSON.stringify(data) }),
  closeRegisterSession: (data) => apiRequest('/pos/register/close-session', { method: 'POST', body: JSON.stringify(data) }),
  getZReports: (branchId) => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/pos/register/z-reports${query}`);
  }
};

export const attendanceApi = {
  getStatus: () => apiRequest('/attendance/status'),
  generateManagerSession: () => apiRequest('/attendance/generate-manager-session', { method: 'POST' }),
  checkIn: (checkInData) => apiRequest('/attendance/check-in', { method: 'POST', body: JSON.stringify(checkInData) }),
  listRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/attendance/records?${query}`);
  },
  verifyQueue: (recordId) => apiRequest(`/attendance/verify-queue/${recordId}`, { method: 'POST' }),
};

export const employeeApi = {
  list: (branchId) => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/employees${query}`);
  },
  create: (employeeData) => apiRequest('/employees', { method: 'POST', body: JSON.stringify(employeeData) }),
  update: (employeeId, employeeData) => apiRequest(`/employees/${employeeId}`, { method: 'PUT', body: JSON.stringify(employeeData) }),
  delete: (employeeId) => apiRequest(`/employees/${employeeId}`, { method: 'DELETE' }),
  getSalesmanDashboard: (userId, branchId) => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return apiRequest(`/employees/salesman-dashboard${qs ? `?${qs}` : ''}`);
  },
  setTarget: (targetData) => apiRequest('/employees/targets', { method: 'POST', body: JSON.stringify(targetData) }),
  getIncentivesOverview: (monthYear, branchId) => {
    const params = new URLSearchParams();
    if (monthYear) params.append('month_year', monthYear);
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return apiRequest(`/employees/incentives/overview${qs ? `?${qs}` : ''}`);
  },
  bulkUpdateIncentives: (data) => apiRequest('/employees/incentives/bulk-update', { method: 'POST', body: JSON.stringify(data) }),
};

export const requisitionApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/requisitions?${query}`);
  },
  create: (reqData) => apiRequest('/requisitions', { method: 'POST', body: JSON.stringify(reqData) }),
  review: (id, reviewData) => apiRequest(`/requisitions/${id}/review`, { method: 'POST', body: JSON.stringify(reviewData) }),
  getTransfers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/requisitions/transfers?${query}`);
  },
  createTransfer: (data) => apiRequest('/requisitions/transfers', { method: 'POST', body: JSON.stringify(data) }),
  receiveTransfer: (transferId) => apiRequest(`/requisitions/transfers/${transferId}/receive`, { method: 'POST' }),
  cancelTransfer: (transferId) => apiRequest(`/requisitions/transfers/${transferId}/cancel`, { method: 'POST' }),
};

export const reportApi = {
  getOverview: (branchId) => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/reports/overview${query}`);
  },
  getDailyDigest: (dateStr, branchId) => {
    const params = new URLSearchParams();
    if (dateStr) params.append('date_str', dateStr);
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return apiRequest(`/reports/daily-digest${qs ? `?${qs}` : ''}`);
  },
  getMonthlyPnL: (monthYear, branchId) => {
    const params = new URLSearchParams();
    if (monthYear) params.append('month_year', monthYear);
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return apiRequest(`/reports/monthly-pnl${qs ? `?${qs}` : ''}`);
  },
  getSalarySheet: (monthYear, branchId) => {
    const params = new URLSearchParams();
    if (monthYear) params.append('month_year', monthYear);
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return apiRequest(`/reports/salary-sheet${qs ? `?${qs}` : ''}`);
  },
  disburseSalary: (data) => apiRequest('/reports/salary-sheet/disburse', { method: 'POST', body: JSON.stringify(data) }),
  getExpenses: (monthYear, category, branchId) => {
    const params = new URLSearchParams();
    if (monthYear) params.append('month_year', monthYear);
    if (category) params.append('category', category);
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return apiRequest(`/reports/expenses${qs ? `?${qs}` : ''}`);
  },
  createExpense: (data) => apiRequest('/reports/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (expenseId) => apiRequest(`/reports/expenses/${expenseId}`, { method: 'DELETE' }),
};

export const ecommerceApi = {
  getStorefront: (slug, domain) => {
    const params = new URLSearchParams();
    if (slug) params.append('slug', slug);
    if (domain) params.append('domain', domain);
    const qs = params.toString();
    return apiRequest(`/ecommerce/storefront${qs ? `?${qs}` : ''}`);
  },
  placeOrder: (orderData) => apiRequest('/ecommerce/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  trackOrder: (query) => apiRequest(`/ecommerce/orders/track?query=${encodeURIComponent(query)}`),
  getAdminOrders: (deliveryStatus) => {
    const query = deliveryStatus ? `?delivery_status=${encodeURIComponent(deliveryStatus)}` : '';
    return apiRequest(`/ecommerce/admin/orders${query}`);
  },
  updateOrderStatus: (orderId, status) => apiRequest(`/ecommerce/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ delivery_status: status })
  }),
  getSettings: () => apiRequest('/ecommerce/settings'),
  updateSettings: (data) => apiRequest('/ecommerce/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

export const hrmApi = {
  getOverview: (branchId) => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    return apiRequest(`/hrm/overview${query}`);
  },
  getEmployees: (branchId, department) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (department) params.append('department', department);
    const qs = params.toString();
    return apiRequest(`/hrm/employees${qs ? `?${qs}` : ''}`);
  },
  updateProfile: (userId, data) => apiRequest(`/hrm/employees/${userId}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
  getLeaves: (status, branchId) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return apiRequest(`/hrm/leaves${qs ? `?${qs}` : ''}`);
  },
  applyLeave: (data) => apiRequest('/hrm/leaves', { method: 'POST', body: JSON.stringify(data) }),
  reviewLeave: (leaveId, data) => apiRequest(`/hrm/leaves/${leaveId}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  getAdvances: (status, monthYear) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (monthYear) params.append('month_year', monthYear);
    const qs = params.toString();
    return apiRequest(`/hrm/advances${qs ? `?${qs}` : ''}`);
  },
  createAdvance: (data) => apiRequest('/hrm/advances', { method: 'POST', body: JSON.stringify(data) }),
  reviewAdvance: (advanceId, data) => apiRequest(`/hrm/advances/${advanceId}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  getPayrollSheet: (monthYear, branchId) => {
    const params = new URLSearchParams();
    if (monthYear) params.append('month_year', monthYear);
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return apiRequest(`/hrm/payroll/sheet${qs ? `?${qs}` : ''}`);
  },
  disbursePayroll: (data) => apiRequest('/hrm/payroll/disburse', { method: 'POST', body: JSON.stringify(data) }),
  getPayslip: (userId, monthYear) => {
    const query = monthYear ? `?month_year=${monthYear}` : '';
    return apiRequest(`/hrm/payroll/payslip/${userId}${query}`);
  },
};

