// Centralized API client for NancysGun POS
// All calls proxy through Vite dev server → FastAPI at :8000

const BASE = "/api/v1";

// ----- Types -----
export interface TokenData {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: "admin" | "cashier";
  is_active: boolean;
  branch_id: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface BranchRead {
  id: number;
  name: string;
  created_at: string;
  updated_at: string | null;
}

export interface TableRead {
  id: number;
  num_chairs: number;
  branch_id: number;
  is_available: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface MenuItemExtraRead {
  id: number;
  extra_id: number;
  price: number;
  extra: { id: number; name: string } | null;
}

export interface MenuItemRead {
  id: number;
  branch_id: number;
  product_id: number;
  size_id: number;
  price: number;
  product: { id: number; name: string; image_url: string | null; category_id: number | null } | null;
  size: { id: number; name: string } | null;
  menu_items_extras: MenuItemExtraRead[];
}

export interface OrderItemExtraCreate {
  menu_item_extra_id: number;
  quantity: number;
  price_at_time: number;
}

export interface OrderItemCreate {
  menu_item_id: number;
  quantity: number;
  price_at_time: number;
  extras: OrderItemExtraCreate[];
}

export interface OrderCreate {
  cashier_id: number;
  branch_id: number;
  table_id?: number | null;
  destination?: string | null;
  total_amount: number;
  payment_method?: "cash" | "card" | null;
  items: OrderItemCreate[];
}

export interface OrderCheckout {
  payment_method: "cash" | "card";
}

export interface OrderItemRead {
  id: number;
  menu_item_id: number;
  quantity: number;
  price_at_time: number;
  menu_item?: MenuItemRead | null;
  order_item_extras: {
    id: number;
    menu_item_extra_id: number;
    quantity: number;
    price_at_time: number;
    menu_item_extra?: MenuItemExtraRead | null;
  }[];
}

export interface OrderResponse {
  id: number;
  cashier_id: number;
  branch_id: number;
  table_id: number | null;
  destination: string | null;
  total_amount: number;
  action: "create" | "update" | "pay" | "cancel";
  payment_method: "cash" | "card" | null;
  created_at: string;
  updated_at: string | null;
  order_items: OrderItemRead[];
}

export interface CategoryResponse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string | null;
}

export interface ProductResponse {
  id: number;
  name: string;
  image_url: string | null;
  category_id: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface SizeResponse {
  id: number;
  name: string;
  created_at: string;
}

export interface ExtraResponse {
  id: number;
  name: string;
  created_at: string;
}

// ----- Date parsing utility -----
export function parseApiDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  // Normalize space to T
  let normalized = dateStr.replace(' ', 'T');
  const hasTimezone = normalized.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(normalized);
  return new Date(hasTimezone ? normalized : `${normalized}Z`);
}

// ----- Internal helpers -----
let _token: string | null = null;


export function setToken(token: string | null) {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isForm = false
): Promise<T> {
  const headers: Record<string, string> = {};
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body
      ? isForm
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

async function requestBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const res = await fetch(`${BASE}${path}`, { method: "GET", headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.blob();
}

// ----- Auth -----
export const authApi = {
  login: (username: string, password: string): Promise<TokenData> => {
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);
    return request("POST", "/auth/login", form, true);
  },
  profile: (): Promise<UserResponse> => request("GET", "/auth/profile"),
};

// ----- Branches -----
export const branchApi = {
  list: (): Promise<BranchRead[]> => request("GET", "/branches/"),
  get: (id: number): Promise<BranchRead> => request("GET", `/branches/${id}`),
  create: (data: { name: string }): Promise<BranchRead> => request("POST", "/branches/", data),
  update: (id: number, data: { name?: string }): Promise<BranchRead> =>
    request("PUT", `/branches/${id}`, data),
  delete: (id: number): Promise<void> => request("DELETE", `/branches/${id}`),
};

// ----- Tables -----
export const tableApi = {
  listByBranch: (branchId: number): Promise<TableRead[]> =>
    request("GET", `/tables/branch/${branchId}`),
  availableByBranch: (branchId: number): Promise<TableRead[]> =>
    request("GET", `/tables/branch/${branchId}/available`),
  update: (tableId: number, data: { is_available?: boolean; name?: string }): Promise<TableRead> =>
    request("PATCH", `/tables/${tableId}`, data),
  create: (data: { branch_id: number; num_chairs: number; is_available?: boolean }): Promise<TableRead> =>
    request("POST", "/tables/", data),
  delete: (id: number): Promise<void> => request("DELETE", `/tables/${id}`),
};

// ----- Menu -----
export const menuApi = {
  listByBranch: (branchId: number): Promise<MenuItemRead[]> =>
    request("GET", `/menu-items/branch/${branchId}`),
  listAll: (): Promise<MenuItemRead[]> => request("GET", "/menu-items/"),
  get: (id: number): Promise<MenuItemRead> => request("GET", `/menu-items/${id}`),
  create: (data: unknown): Promise<MenuItemRead> => request("POST", "/menu-items/", data),
  update: (id: number, data: unknown): Promise<MenuItemRead> =>
    request("PUT", `/menu-items/${id}`, data),
  delete: (id: number): Promise<void> => request("DELETE", `/menu-items/${id}`),
};

// ----- Orders -----
export const orderApi = {
  create: (data: OrderCreate): Promise<OrderResponse> => request("POST", "/orders/", data),
  list: (branchId: number): Promise<OrderResponse[]> =>
    request("GET", `/orders/?branch_id=${branchId}`),
  get: (id: number): Promise<OrderResponse> => request("GET", `/orders/${id}`),
  checkout: (id: number, data: OrderCheckout): Promise<OrderResponse> =>
    request("POST", `/orders/${id}/checkout`, data),
  cancel: (id: number): Promise<OrderResponse> =>
    request("POST", `/orders/${id}/cancel`),
  updateTable: (id: number, tableId: number | null): Promise<OrderResponse> =>
    request("PATCH", `/orders/${id}/table`, { table_id: tableId }),
  addItems: (id: number, data: { items: OrderItemCreate[] }): Promise<OrderResponse> =>
    request("POST", `/orders/${id}/items`, data),
  updateItemQuantity: (id: number, itemId: number, data: { quantity: number }): Promise<OrderResponse> =>
    request("PATCH", `/orders/${id}/items/${itemId}`, data),
  removeItem: (id: number, itemId: number): Promise<OrderResponse> =>
    request("DELETE", `/orders/${id}/items/${itemId}`),
  delete: (id: number): Promise<void> => request("DELETE", `/orders/${id}`),
};

// ----- Catalog -----
export const catalogApi = {
  categories: (): Promise<CategoryResponse[]> => request("GET", "/categories/"),
  products: (): Promise<ProductResponse[]> => request("GET", "/products/"),
  sizes: (): Promise<SizeResponse[]> => request("GET", "/sizes/"),
  extras: (): Promise<ExtraResponse[]> => request("GET", "/extras/"),
  createCategory: (data: { name: string }): Promise<CategoryResponse> =>
    request("POST", "/categories/", data),
  updateCategory: (id: number, data: { name: string }): Promise<CategoryResponse> =>
    request("PUT", `/categories/${id}`, data),
  deleteCategory: (id: number): Promise<void> => request("DELETE", `/categories/${id}`),
  createProduct: (data: unknown): Promise<ProductResponse> =>
    request("POST", "/products/", data),
  updateProduct: (id: number, data: unknown): Promise<ProductResponse> =>
    request("PUT", `/products/${id}`, data),
  deleteProduct: (id: number): Promise<void> => request("DELETE", `/products/${id}`),
  createSize: (data: { name: string }): Promise<SizeResponse> =>
    request("POST", "/sizes/", data),
  updateSize: (id: number, data: { name: string }): Promise<SizeResponse> =>
    request("PUT", `/sizes/${id}`, data),
  deleteSize: (id: number): Promise<void> => request("DELETE", `/sizes/${id}`),
  createExtra: (data: { name: string }): Promise<ExtraResponse> =>
    request("POST", "/extras/", data),
  updateExtra: (id: number, data: { name: string }): Promise<ExtraResponse> =>
    request("PUT", `/extras/${id}`, data),
  deleteExtra: (id: number): Promise<void> => request("DELETE", `/extras/${id}`),
};

// ----- Users -----
export const userApi = {
  list: (): Promise<UserResponse[]> => request("GET", "/management/users/"),
  create: (data: unknown): Promise<UserResponse> => request("POST", "/management/users/", data),
  update: (username: string, data: unknown): Promise<UserResponse> =>
    request("PUT", `/management/users/${encodeURIComponent(username)}/`, data),
  delete: (username: string): Promise<void> =>
    request("DELETE", `/management/users/${encodeURIComponent(username)}/soft/`),
};

// ----- Upload -----
export const uploadApi = {
  image: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append("file", file);
    return request("POST", "/upload/image", form, true);
  },
};

// ----- History -----
export const historyApi = {
  exportOrderExcel: (orderId: number) =>
    `${BASE}/history/orders/${orderId}/export-excel`,
  exportBranchExcel: (branchId: number) =>
    `${BASE}/history/branches/${branchId}/export-excel`,
  clearBranchHistory: (branchId: number): Promise<{ count: number; message: string }> =>
    request("DELETE", `/history/branches/${branchId}/clear`),
  downloadOrderExcel: (orderId: number): Promise<Blob> =>
    requestBlob(`/history/orders/${orderId}/export-excel`),
  downloadBranchExcel: (branchId: number): Promise<Blob> =>
    requestBlob(`/history/branches/${branchId}/export-excel`),
};
