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
};

// Machines
export const machinesApi = {
  list: (farmId: number) => api.get(`/api/farms/${farmId}/machines`),
  lendTargets: (farmId: number) => api.get(`/api/farms/${farmId}/machines/lend-targets`),
  create: (farmId: number, data: any) => api.post(`/api/farms/${farmId}/machines`, data),
  update: (farmId: number, id: number, data: any) => api.put(`/api/farms/${farmId}/machines/${id}`, data),
  delete: (farmId: number, id: number) => api.delete(`/api/farms/${farmId}/machines/${id}`),
  createRental: (farmId: number, machineId: number, data: any) => api.post(`/api/farms/${farmId}/machines/${machineId}/rentals`, data),
  listRentals: (farmId: number, machineId: number) => api.get(`/api/farms/${farmId}/machines/${machineId}/rentals`),
  returnRental: (farmId: number, machineId: number, rentalId: number) => api.put(`/api/farms/${farmId}/machines/${machineId}/rentals/${rentalId}/return`),
  listServices: (farmId: number, machineId: number) => api.get(`/api/farms/${farmId}/machines/${machineId}/services`),
  createService: (farmId: number, machineId: number, data: any) => api.post(`/api/farms/${farmId}/machines/${machineId}/services`, data),
  deleteService: (farmId: number, machineId: number, entryId: number) => api.delete(`/api/farms/${farmId}/machines/${machineId}/services/${entryId}`),
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

// Support
export const supportApi = {
  submit: (data: any) => api.post('/api/support', data),
  list: () => api.get('/api/support'),
  markReviewed: (id: number) => api.patch(`/api/support/${id}/review`),
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
