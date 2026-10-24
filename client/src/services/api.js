// API client service for Gujjar Milk POS backend

const BASE_URL = '/api';

export async function fetchSettings() {
  const res = await fetch(`${BASE_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings) {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'All') query.append('category', params.category);
  if (params.search) query.append('search', params.search);
  if (params.activeOnly !== undefined) query.append('activeOnly', params.activeOnly);

  const url = `${BASE_URL}/products${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function createProduct(productData) {
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create product');
  }
  return res.json();
}

export async function updateProduct(id, productData) {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function updateStock(id, { delta, setStock }) {
  const res = await fetch(`${BASE_URL}/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta, setStock }),
  });
  if (!res.ok) throw new Error('Failed to update stock');
  return res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to archive product');
  return res.json();
}

export async function fetchSales(params = {}) {
  const query = new URLSearchParams();
  if (params.period) query.append('period', params.period);
  if (params.search) query.append('search', params.search);
  if (params.paymentMethod && params.paymentMethod !== 'All') query.append('paymentMethod', params.paymentMethod);
  if (params.limit) query.append('limit', params.limit);
  if (params.page) query.append('page', params.page);

  const url = `${BASE_URL}/sales${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

export async function fetchSaleById(id) {
  const res = await fetch(`${BASE_URL}/sales/${id}`);
  if (!res.ok) throw new Error('Failed to fetch invoice details');
  return res.json();
}

export async function createSale(saleData) {
  const res = await fetch(`${BASE_URL}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to complete sale');
  }
  return res.json();
}

export async function voidSale(id) {
  const res = await fetch(`${BASE_URL}/sales/${id}/void`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to void invoice');
  }
  return res.json();
}

export async function fetchReportsSummary() {
  const res = await fetch(`${BASE_URL}/reports/summary`);
  if (!res.ok) throw new Error('Failed to fetch reports summary');
  return res.json();
}

// --- SHIFTS API ---
export async function fetchCurrentShift() {
  const res = await fetch(`${BASE_URL}/shifts/current`);
  if (!res.ok) throw new Error('Failed to fetch current shift');
  return res.json();
}

export async function openShift(shiftData) {
  const res = await fetch(`${BASE_URL}/shifts/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftData),
  });
  if (!res.ok) throw new Error('Failed to open shift');
  return res.json();
}

export async function closeShift(data) {
  const res = await fetch(`${BASE_URL}/shifts/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to close shift');
  return res.json();
}

export async function fetchShifts() {
  const res = await fetch(`${BASE_URL}/shifts`);
  if (!res.ok) throw new Error('Failed to fetch shifts');
  return res.json();
}

// --- GAWALA / SUPPLIER PROCUREMENT API ---
export async function fetchSuppliers() {
  const res = await fetch(`${BASE_URL}/suppliers`);
  if (!res.ok) throw new Error('Failed to fetch suppliers');
  return res.json();
}

export async function saveSupplier(supplierData) {
  const res = await fetch(`${BASE_URL}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supplierData),
  });
  if (!res.ok) throw new Error('Failed to save supplier');
  return res.json();
}

export async function fetchProcurement(params = {}) {
  const query = new URLSearchParams();
  if (params.date) query.append('date', params.date);
  if (params.shift_type) query.append('shift_type', params.shift_type);
  const res = await fetch(`${BASE_URL}/procurement${query.toString() ? `?${query.toString()}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch procurement records');
  return res.json();
}

export async function recordProcurement(data) {
  const res = await fetch(`${BASE_URL}/procurement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to record milk procurement');
  }
  return res.json();
}

export async function fetchSupplierLedger(id) {
  const res = await fetch(`${BASE_URL}/suppliers/${id}/ledger`);
  if (!res.ok) throw new Error('Failed to fetch supplier ledger');
  return res.json();
}

export async function recordSupplierPayout(id, data) {
  const res = await fetch(`${BASE_URL}/suppliers/${id}/payout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to record supplier payout');
  return res.json();
}

// --- CUSTOMER SUBSCRIPTIONS & NAGHA API ---
export async function fetchCustomers() {
  const res = await fetch(`${BASE_URL}/customers`);
  if (!res.ok) throw new Error('Failed to fetch subscription customers');
  return res.json();
}

export async function saveCustomer(customerData) {
  const res = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  if (!res.ok) throw new Error('Failed to save customer');
  return res.json();
}

export async function fetchDailySubscriptions(params = {}) {
  const query = new URLSearchParams();
  if (params.date) query.append('date', params.date);
  if (params.shift_type) query.append('shift_type', params.shift_type);
  const res = await fetch(`${BASE_URL}/subscriptions/daily${query.toString() ? `?${query.toString()}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch daily subscriptions');
  return res.json();
}

export async function markSubscriptionDelivery(data) {
  const res = await fetch(`${BASE_URL}/subscriptions/mark-delivery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to mark delivery');
  return res.json();
}

export async function fetchCustomerStatement(id) {
  const res = await fetch(`${BASE_URL}/customers/${id}/statement`);
  if (!res.ok) throw new Error('Failed to fetch customer statement');
  return res.json();
}

export async function recordCustomerPayment(id, data) {
  const res = await fetch(`${BASE_URL}/customers/${id}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to record customer payment');
  return res.json();
}

// --- DAIRY PROCESSING API ---
export async function fetchProcessingBatches() {
  const res = await fetch(`${BASE_URL}/processing/batches`);
  if (!res.ok) throw new Error('Failed to fetch processing batches');
  return res.json();
}

export async function createProcessingBatch(data) {
  const res = await fetch(`${BASE_URL}/processing/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create processing batch');
  }
  return res.json();
}

// --- RECONCILIATION API ---
export async function fetchReconciliationToday() {
  const res = await fetch(`${BASE_URL}/reconciliation/today`);
  if (!res.ok) throw new Error('Failed to fetch today reconciliation');
  return res.json();
}

