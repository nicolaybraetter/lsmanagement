import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.put('/api/auth/me', data),
  deleteAccount: () => api.delete('/api/auth/me'),
  heartbeat: () => api.post('/api/auth/heartbeat'),
};

// Farms
export const farmsApi = {
  list: () => api.get('/api/farms'),
  create: (data: any) => api.post('/api/farms', data),
  get: (id: number) => api.get(`/api/farms/${id}`),
  update: (id: number, data: any) => api.put(`/api/farms/${id}`, data),
  members: (id: number) => api.get(`/api/farms/${id}/members`),
  invite: (id: number, data: any) => api.post(`/api/farms/${id}/members/invite`, data),
  removeMember: (farmId: number, userId: number) => api.delete(`/api/farms/${farmId}/members/${userId}`),
  pendingInvitations: () => api.get('/api/farms/invitations/pending'),
  acceptInvitation: (id: number) => api.post(`/api/farms/invitations/${id}/accept`),
  rejectInvitation: (id: number) => api.post(`/api/farms/invitations/${id}/reject`),
};

// Lohnhöfe
export const lohnhoefeApi = {
  list: (farmId: number) => api.get(`/api/farms/${farmId}/lohnhoefe`),
  create: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/lohnhoefe`, data),
  update: (farmId: number, id: number, data: any) => api.put(`/api/farms/${farmId}/lohnhoefe/${id}`, data),
  delete: (farmId: number, id: number) => api.delete(`/api/farms/${farmId}/lohnhoefe/${id}`),
};

// Machines
export const machinesApi = {
  list: (farmId: number) => api.get(`/api/farms/${farmId}/machines`),
  create: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/machines`, data),
  update: (farmId: number, id: number, data: any) => api.put(`/api/farms/${farmId}/machines/${id}`, data),
  delete: (farmId: number, id: number) => api.delete(`/api/farms/${farmId}/machines/${id}`),
  lend: (farmId: number, id: number, lent_to_farm_id: number) => api.post(`/api/farms/${farmId}/machines/${id}/lend`, { lent_to_farm_id }),
  lendLohnhof: (farmId: number, id: number, lohnhof_id: number) => api.post(`/api/farms/${farmId}/machines/${id}/lend-lohnhof`, { lohnhof_id }),
  unlend: (farmId: number, id: number) => api.post(`/api/farms/${farmId}/machines/${id}/unlend`),
  sell: (farmId: number, id: number, sale_price: number) => api.post(`/api/farms/${farmId}/machines/${id}/sell`, { sale_price }),
  createRental: (farmId: number, machineId: number, data: any) => api.post(`/api/farms/${farmId}/machines/${machineId}/rentals`, data),
  listRentals: (farmId: number, machineId: number) => api.get(`/api/farms/${farmId}/machines/${machineId}/rentals`),
  returnRental: (farmId: number, machineId: number, rentalId: number) => api.put(`/api/farms/${farmId}/machines/${machineId}/rentals/${rentalId}/return`),
};

// Fields
export const fieldsApi = {
  list: (farmId: number) => api.get(`/api/farms/${farmId}/fields`),
  create: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/fields`, data),
  update: (farmId: number, id: number, data: any) => api.put(`/api/farms/${farmId}/fields/${id}`, data),
  delete: (farmId: number, id: number) => api.delete(`/api/farms/${farmId}/fields/${id}`),
  getCropRotation: (farmId: number, fieldId: number) => api.get(`/api/farms/${farmId}/fields/${fieldId}/crop-rotation`),
  addCropRotation: (farmId: number, fieldId: number, data: any) => api.post(`/api/farms/${farmId}/fields/${fieldId}/crop-rotation`, data),
};

// Finances
export const financesApi = {
  list: (farmId: number, year?: number) => api.get(`/api/farms/${farmId}/finances`, { params: year ? { year } : {} }),
  create: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/finances`, data),
  update: (farmId: number, id: number, data: any) => api.put(`/api/farms/${farmId}/finances/${id}`, data),
  delete: (farmId: number, id: number) => api.delete(`/api/farms/${farmId}/finances/${id}`),
  summary: (farmId: number, year?: number) => api.get(`/api/farms/${farmId}/finances/summary`, { params: year ? { year } : {} }),
};

// Storage
export const storageApi = {
  list: (farmId: number) => api.get(`/api/farms/${farmId}/storage`),
  create: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/storage`, data),
  update: (farmId: number, id: number, data: any) => api.put(`/api/farms/${farmId}/storage/${id}`, data),
  delete: (farmId: number, id: number) => api.delete(`/api/farms/${farmId}/storage/${id}`),
  addTransaction: (farmId: number, itemId: number, data: any) => api.post(`/api/farms/${farmId}/storage/${itemId}/transactions`, data),
  listTransactions: (farmId: number, itemId: number) => api.get(`/api/farms/${farmId}/storage/${itemId}/transactions`),
};

// Animals
export const animalsApi = {
  listStables: (farmId: number) => api.get(`/api/farms/${farmId}/animals/stables`),
  createStable: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/animals/stables`, data),
  updateStable: (farmId: number, id: number, data: any) => api.put(`/api/farms/${farmId}/animals/stables/${id}`, data),
  deleteStable: (farmId: number, id: number) => api.delete(`/api/farms/${farmId}/animals/stables/${id}`),
  listAnimals: (farmId: number, stableId: number) => api.get(`/api/farms/${farmId}/animals/stables/${stableId}/animals`),
  createAnimal: (farmId: number, stableId: number, data: any) => api.post(`/api/farms/${farmId}/animals/stables/${stableId}/animals`, data),
  deleteAnimal: (farmId: number, stableId: number, animalId: number) => api.delete(`/api/farms/${farmId}/animals/stables/${stableId}/animals/${animalId}`),
};

// Biogas
export const biogasApi = {
  get: (farmId: number) => api.get(`/api/farms/${farmId}/biogas`),
  create: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/biogas`, data),
  update: (farmId: number, plantId: number, data: any) => api.put(`/api/farms/${farmId}/biogas/${plantId}`, data),
  addFeed: (farmId: number, plantId: number, data: any) => api.post(`/api/farms/${farmId}/biogas/${plantId}/feed`, data),
  listFeed: (farmId: number, plantId: number) => api.get(`/api/farms/${farmId}/biogas/${plantId}/feed`),
};

// Invoices & Capital
export const invoicesApi = {
  // Capital
  getCapital: (farmId: number) => api.get(`/api/invoices/capital/${farmId}`),
  setCapital: (farmId: number, data: any) => api.put(`/api/invoices/capital/${farmId}`, data),
  // Invoices
  createFromFarm: (farmId: number, data: any) => api.post(`/api/invoices/from-farm/${farmId}`, data),
  listSent: (farmId: number) => api.get(`/api/invoices/sent/${farmId}`),
  listReceived: (farmId: number) => api.get(`/api/invoices/received/${farmId}`),
  get: (id: number) => api.get(`/api/invoices/${id}`),
  send: (id: number) => api.post(`/api/invoices/${id}/send`),
  pay: (id: number) => api.post(`/api/invoices/${id}/pay`),
  cancel: (id: number) => api.post(`/api/invoices/${id}/cancel`),
  allFarms: () => api.get('/api/invoices/farms/all'),
};

// Admin
const adminAxios = axios.create({ baseURL: '', headers: { 'Content-Type': 'application/json' } });
adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminApi = {
  login: (password: string) => adminAxios.post('/api/admin/auth', { password }),
  listUsers: () => adminAxios.get('/api/admin/users'),
  deleteUser: (id: number) => adminAxios.delete(`/api/admin/users/${id}`),
  resetPassword: (id: number, new_password: string) => adminAxios.put(`/api/admin/users/${id}/password`, { new_password }),
  updateCredentials: (id: number, new_username: string, new_email?: string) =>
    adminAxios.put(`/api/admin/users/${id}/credentials`, { new_username, new_email }),
  toggleActive: (id: number) => adminAxios.put(`/api/admin/users/${id}/toggle-active`),
  getEmailConfig: () => adminAxios.get('/api/admin/email-config'),
  updateEmailConfig: (data: any) => adminAxios.put('/api/admin/email-config', data),
  deleteMessage: (id: number) => adminAxios.delete(`/api/support/${id}`),
  deleteComment: (id: number) => adminAxios.delete(`/api/support/comments/${id}`),
};

// Support
export const supportApi = {
  submit: (data: any) => api.post('/api/support', data),
  list: () => api.get('/api/support'),
  markReviewed: (id: number) => api.patch(`/api/support/${id}/review`),
  listPublic: () => api.get('/api/support/public'),
  postComment: (id: number, data: any) => api.post(`/api/support/${id}/comments`, data),
};

// Notifications
export const notificationsApi = {
  list: () => api.get('/api/notifications'),
  unreadCount: () => api.get('/api/notifications/unread-count'),
  markRead: (id: number) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/notifications/read-all'),
  delete: (id: number) => api.delete(`/api/notifications/${id}`),
};

// Crop Rotation Plans
export const cropPlansApi = {
  list: (farmId: number) => api.get(`/api/farms/${farmId}/crop-plans`),
  create: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/crop-plans`, data),
  delete: (farmId: number, planId: number) => api.delete(`/api/farms/${farmId}/crop-plans/${planId}`),
};

// Todos
export const todosApi = {
  listBoards: (farmId: number) => api.get(`/api/farms/${farmId}/todos/boards`),
  createBoard: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/todos/boards`, data),
  listTasks: (farmId: number, boardId: number) => api.get(`/api/farms/${farmId}/todos/boards/${boardId}/tasks`),
  createTask: (farmId: number, boardId: number, data: any) => api.post(`/api/farms/${farmId}/todos/boards/${boardId}/tasks`, data),
  updateTask: (farmId: number, boardId: number, taskId: number, data: any) => api.put(`/api/farms/${farmId}/todos/boards/${boardId}/tasks/${taskId}`, data),
  deleteTask: (farmId: number, boardId: number, taskId: number) => api.delete(`/api/farms/${farmId}/todos/boards/${boardId}/tasks/${taskId}`),
};
