// import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

// // Create axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Request interceptor to add auth token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('access_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor to handle token refresh
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const refreshToken = localStorage.getItem('refresh_token');
//         const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
//           refresh: refreshToken,
//         });

//         const { access } = response.data;
//         localStorage.setItem('access_token', access);

//         return api(originalRequest);
//       } catch (refreshError) {
//         localStorage.removeItem('access_token');
//         localStorage.removeItem('refresh_token');
//         localStorage.removeItem('user');
//         window.location.href = '/login';
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// // Authentication API
// export const authAPI = {
//   login: (credentials) => api.post('/auth/login/', credentials),
//   register: (userData) => api.post('/auth/register/', userData),
//   getProfile: () => api.get('/auth/profile/'),
//   updateProfile: (data) => api.patch('/auth/profile/', data),
//   refreshToken: (refreshToken) => api.post('/auth/token/refresh/', { refresh: refreshToken }),
// };

// // Employee API
// export const employeeAPI = {
//   getEmployees: (params) => api.get('/employees/', { params }),
//   getEmployee: (id) => api.get(`/employees/${id}/`),
//   createEmployee: (data) => api.post('/employees/', data),
//   updateEmployee: (id, data) => api.patch(`/employees/${id}/`, data),
//   deleteEmployee: (id) => api.delete(`/employees/${id}/`),
//   getDepartments: () => api.get('/employees/departments/'),
//   createDepartment: (data) => api.post('/employees/departments/', data),
//   getOnboardingTasks: () => api.get('/employees/onboarding/'),
//   completeOnboardingTask: (taskId) => api.patch(`/employees/onboarding/${taskId}/complete/`),


//   getUsers: () => api.get('/employees/users/'),  // Users without employee records
// };

// // Attendance API
// // export const attendanceAPI = {
// //   getAttendanceRecords: (params) => api.get('/attendance/records/', { params }),
// //   markAttendance: (data) => api.post('/attendance/manual/', data),
// //   getBiometricDevices: () => api.get('/attendance/devices/'),
// //   createBiometricDevice: (data) => api.post('/attendance/devices/', data),
// //   syncBiometricData: (data) => api.post('/attendance/biometric-sync/', data),
// // };
// // // Attendance API
// export const attendanceAPI = {
//   // Attendance Records
//   getAttendanceRecords: (params) => api.get('/attendance/records/', { params }),
//   markManualAttendance: (data) => api.post('/attendance/manual/', data),

//   // Biometric Integration
//   getBiometricDevices: () => api.get('/attendance/devices/'),
//   createBiometricDevice: (data) => api.post('/attendance/devices/', data),
//   updateBiometricDevice: (id, data) => api.patch(`/attendance/devices/${id}/`, data),
//   deleteBiometricDevice: (id) => api.delete(`/attendance/devices/${id}/`),
//   syncBiometricData: (data) => api.post('/attendance/biometric-sync/', data),// ADD THESE NEW METHODS for approval workflow
//  // Add these new methods:
//   // getPendingEdits: () => api.get('/attendance/pending-edits/'),
//   approveEdit: (recordId, data) => api.post(`/attendance/approve-edit/${recordId}/`, data),

// };


// // In your services/api.js file, add these WFH-related functions:

// export const workFromHomeAPI = {
//   applyWFH: (data) => api.post('/attendance/wfh/apply/', data),
//   checkWFHStatus: (date = null) => {
//     const params = date ? `?date=${date}` : '';
//     return api.get(`/attendance/wfh/status/${params}`);
//   },
//   getWFHRequests: (status = null) => {
//     const params = status ? `?status=${status}` : '';
//     return api.get(`/attendance/wfh/requests/${params}`);
//   },
//   approveWFHRequest: (requestId, data) => 
//     api.post(`/attendance/wfh/requests/${requestId}/approve/`, data)
// };
// // // In your services/api.js - this should already be there from our earlier fix
// // export const notificationAPI = {
// //   getNotifications: (params) => api.get('/notifications/', { params }),
// //   getUnreadCount: () => api.get('/notifications/unread-count/'),
// //   markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read/`),
// //   markAllAsRead: () => api.post('/notifications/mark-all-read/'),
// //   deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}/delete/`),
// //   createSystemNotification: (data) => api.post('/notifications/system/create/', data),
// // };
// // // Leave API
// // export const leaveAPI = {
// //   getLeaveTypes: () => api.get('/leave/types/'),
// //   createLeaveType: (data) => api.post('/leave/types/', data),
// //   updateLeaveType: (id, data) => api.patch(`/leave/types/${id}/`, data),
// //   deleteLeaveType: (id) => api.delete(`/leave/types/${id}/`),

// //   getLeavePolicies: () => api.get('/leave/policies/'),
// //   createLeavePolicy: (data) => api.post('/leave/policies/', data),
// //   updateLeavePolicy: (id, data) => api.patch(`/leave/policies/${id}/`, data),
// //   deleteLeavePolicy: (id) => api.delete(`/leave/policies/${id}/`),

// //   getLeaveRequests: (params) => api.get('/leave/requests/', { params }),
// //   createLeaveRequest: (data) => api.post('/leave/requests/', data),
// //   getLeaveRequest: (id) => api.get(`/leave/requests/${id}/`),
// //   updateLeaveRequest: (id, data) => api.patch(`/leave/requests/${id}/`, data),
// //   approveLeaveRequest: (requestId, data) => api.patch(`/leave/requests/${requestId}/approve/`, data),
// //   cancelLeaveRequest: (requestId) => api.patch(`/leave/requests/${requestId}/cancel/`),

// //   getLeaveBalances: (params) => api.get('/leave/balances/', { params }),
// //   getLeaveSummary: () => api.get('/leave/summary/'),
// //   getLeaveAnalytics: () => api.get('/leave/analytics/'),
// //   initializeYearlyBalances: (data) => api.post('/leave/initialize-balances/', data),
// // };

// // Leave Management API
// export const leaveAPI = {
//   // Leave Types
//   getLeaveTypes: () => api.get('/leave/types/'),
//   createLeaveType: (data) => api.post('/leave/types/', data),
//   updateLeaveType: (id, data) => api.patch(`/leave/types/${id}/`, data),
//   deleteLeaveType: (id) => api.delete(`/leave/types/${id}/`),

//   // Leave Policies
//   getLeavePolicies: () => api.get('/leave/policies/'),
//   createLeavePolicy: (data) => api.post('/leave/policies/', data),
//   updateLeavePolicy: (id, data) => api.patch(`/leave/policies/${id}/`, data),
//   deleteLeavePolicy: (id) => api.delete(`/leave/policies/${id}/`),

//   // Leave Requests
//   getLeaveRequests: (params) => api.get('/leave/requests/', { params }),
//   getLeaveRequest: (id) => api.get(`/leave/requests/${id}/`),
//   createLeaveRequest: (data) => {
//     // Handle FormData for file uploads
//     const config = {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     };
//     return api.post('/leave/requests/', data, config);
//   },
//   updateLeaveRequest: (id, data) => api.patch(`/leave/requests/${id}/`, data),
//   deleteLeaveRequest: (id) => api.delete(`/leave/requests/${id}/`),

//   // Leave Request Actions
//   approveLeaveRequest: (id, data) => api.post(`/leave/requests/${id}/approve/`, data),
//   rejectLeaveRequest: (id, data) => api.post(`/leave/requests/${id}/reject/`, data),
//   cancelLeaveRequest: (id, data = {}) => api.post(`/leave/requests/${id}/cancel/`, data),

//   // Leave Balances
//   getLeaveBalances: (params) => api.get('/leave/balances/', { params }),
//   getLeaveSummary: () => api.get('/leave/summary/'),

//   // Notifications
//   getNotifications: () => api.get('/leave/notifications/'),
//   markNotificationRead: (id) => api.patch(`/leave/notifications/${id}/mark-read/`),

//   // Analytics (HR only)
//   getLeaveAnalytics: () => api.get('/leave/analytics/'),
//   initializeYearlyBalances: (data) => api.post('/leave/initialize-balances/', data),
//   initializeMyBalances: (data) => api.post('/leave/balances/initialize/', data),
// };


// export default api;



import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API - ENHANCED with profile support
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  employeeRegister: (userData) => api.post('/auth/employee-register/', userData),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  refreshToken: (refreshToken) => api.post('/auth/token/refresh/', { refresh: refreshToken }),
  changePassword: (data) => api.post('/auth/profile/change-password/', data),
  getMyPermissions: () => api.get('/auth/me/permissions/'),
};

// Admin/HR user management API
export const adminUserAPI = {
  getUsers: () => api.get('/auth/users/'),
  getUser: (id) => api.get(`/auth/users/${id}/`),
  updateUser: (id, data) => api.patch(`/auth/users/${id}/`, data),
  setPassword: (id, data) => api.post(`/auth/users/${id}/set-password/`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}/`),
  // Role access
  getUserRoleAccess: (id, role) =>
    api.get(`/auth/users/${id}/role-access/`, { params: role ? { role } : {} }),
  setUserExtraPermissions: (id, permissionIds) =>
    api.patch(`/auth/users/${id}/extra-permissions/`, { permission_ids: permissionIds }),
};

export const adminGroupAPI = {
  getGroups: (params) => api.get('/auth/groups/', { params }),
  getGroup: (id) => api.get(`/auth/groups/${id}/`),
  createGroup: (data) => api.post('/auth/groups/create/', data),
  updateGroup: (id, data) => api.patch(`/auth/groups/${id}/`, data),
  deleteGroup: (id) => api.delete(`/auth/groups/${id}/`),
};

export const adminPermissionAPI = {
  getPermissions: (params) => api.get('/auth/permissions/', { params }),
  getPermission: (id) => api.get(`/auth/permissions/${id}/`),
  updatePermission: (id, data) => api.patch(`/auth/permissions/${id}/`, data),
};

// Employee API - ENHANCED with profile data support
export const employeeAPI = {
  getEmployees: (params) => api.get('/employees/', { params }),
  getEmployee: (id) => api.get(`/employees/${id}/`),
  createEmployee: (data) => api.post('/employees/', data),
  updateEmployee: (id, data) => api.patch(`/employees/${id}/`, data),
  deleteEmployee: (id) => api.delete(`/employees/${id}/`),
  getDepartments: () => api.get('/employees/departments/'),
  createDepartment: (data) => api.post('/employees/departments/', data),
  getOnboardingTasks: () => api.get('/employees/onboarding/'),
  completeOnboardingTask: (taskId) => api.patch(`/employees/onboarding/${taskId}/complete/`),
  getUsers: () => api.get('/employees/users/'),

  // NEW: Profile-related endpoints
  getEmployeeProfileData: () => api.get('/employees/profile-data/'),
  getBirthdayFestivalData: () => api.get('/employees/birthday-festival/'),
  getBirthdays: () => api.get('/employees/birthdays/'),
  getFestivals: () => api.get('/employees/festivals/'),
};

// Profile API - ENHANCED with better team management
export const profileAPI = {
  // Get current user profile with all details
  getCurrentProfile: () => api.get('/auth/profile/'),

  // Update user profile (personal information)
  updateProfile: (data) => api.patch('/auth/profile/', data),

  // Get employee-specific profile data (team, manager, employment details)
  getEmployeeProfileData: () => api.get('/employees/profile-data/'),

  // Get team members by manager ID
  getTeamMembersByManagerId: (managerId) => api.get(`/employees/team/${managerId}/`),

  // Get all managers with their teams (HR only)
  getAllManagersWithTeams: () => api.get('/employees/managers/'),

  // Debug employee relationships (for troubleshooting)
  debugEmployeeRelationships: () => api.get('/employees/debug-relationships/'),

  // Upload profile picture (if you want to add this feature later)
  uploadProfilePicture: (formData) => {
    return api.post('/auth/profile/upload-picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Attendance API
export const attendanceAPI = {
  // Attendance Records
  getAttendanceRecords: (params) => api.get('/attendance/records/', { params }),
  markManualAttendance: (data) => api.post('/attendance/manual/', data),

  // Biometric Integration
  getBiometricDevices: () => api.get('/attendance/devices/'),
  createBiometricDevice: (data) => api.post('/attendance/devices/', data),
  updateBiometricDevice: (id, data) => api.patch(`/attendance/devices/${id}/`, data),
  deleteBiometricDevice: (id) => api.delete(`/attendance/devices/${id}/`),
  syncBiometricData: (data) => api.post('/attendance/biometric-sync/', data),
  pingLocation: (data) => api.post('/attendance/location/ping/', data),

  // Approval workflow
  approveEdit: (recordId, data) => api.post(`/attendance/approve-edit/${recordId}/`, data),
};

// Work From Home API
export const workFromHomeAPI = {
  applyWFH: (data) => api.post('/attendance/wfh/apply/', data),
  // Alias used by WorkFromHomeRequests component
  createWFHRequest: (data) => api.post('/attendance/wfh/apply/', data),
  checkWFHStatus: (date = null) => {
    const params = date ? `?date=${date}` : '';
    return api.get(`/attendance/wfh/status/${params}`);
  },
  getWFHRequests: (params = {}) => {
    return api.get('/attendance/wfh/requests/', { params });
  },
  approveWFHRequest: (requestId, data) =>
    api.post(`/attendance/wfh/requests/${requestId}/approve/`, data)
};

// Leave Management API
export const leaveAPI = {
  // Leave Types
  getLeaveTypes: () => api.get('/leave/types/'),
  createLeaveType: (data) => api.post('/leave/types/', data),
  updateLeaveType: (id, data) => api.patch(`/leave/types/${id}/`, data),
  deleteLeaveType: (id) => api.delete(`/leave/types/${id}/`),

  // Leave Policies
  getLeavePolicies: () => api.get('/leave/policies/'),
  createLeavePolicy: (data) => api.post('/leave/policies/', data),
  updateLeavePolicy: (id, data) => api.patch(`/leave/policies/${id}/`, data),
  deleteLeavePolicy: (id) => api.delete(`/leave/policies/${id}/`),

  // Leave Requests
  getLeaveRequests: (params) => api.get('/leave/requests/', { params }),
  getLeaveRequest: (id) => api.get(`/leave/requests/${id}/`),
  createLeaveRequest: (data) => {
    // Handle FormData for file uploads
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.post('/leave/requests/', data, config);
  },
  updateLeaveRequest: (id, data) => api.patch(`/leave/requests/${id}/`, data),
  deleteLeaveRequest: (id) => api.delete(`/leave/requests/${id}/`),

  // Leave Request Actions
  approveLeaveRequest: (id, data) => api.post(`/leave/requests/${id}/approve/`, data),
  rejectLeaveRequest: (id, data) => api.post(`/leave/requests/${id}/reject/`, data),
  cancelLeaveRequest: (id, data = {}) => api.post(`/leave/requests/${id}/cancel/`, data),

  // Leave Balances
  getLeaveBalances: (params) => api.get('/leave/balances/', { params }),
  getLeaveSummary: () => api.get('/leave/summary/'),

  // Notifications
  getNotifications: () => api.get('/leave/notifications/'),
  markNotificationRead: (id) => api.patch(`/leave/notifications/${id}/mark-read/`),

  // Analytics (HR only)
  getLeaveAnalytics: () => api.get('/leave/analytics/'),
  initializeYearlyBalances: (data) => api.post('/leave/initialize-balances/', data),
  initializeMyBalances: (data) => api.post('/leave/balances/initialize/', data),
};

// Notification API - NEW (if you want to add notifications later)
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications/', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
  markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read/`),
  markAllAsRead: () => api.post('/notifications/mark-all-read/'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}/delete/`),
  createSystemNotification: (data) => api.post('/notifications/system/create/', data),
};

// Department API - NEW (extracted for better organization)
export const departmentAPI = {
  getDepartments: () => api.get('/employees/departments/'),
  getDepartment: (id) => api.get(`/employees/departments/${id}/`),
  createDepartment: (data) => api.post('/employees/departments/', data),
  updateDepartment: (id, data) => api.patch(`/employees/departments/${id}/`, data),
  deleteDepartment: (id) => api.delete(`/employees/departments/${id}/`),
  getDepartmentEmployees: (id) => api.get(`/employees/departments/${id}/employees/`),
};

// Analytics API - NEW (for dashboard and reporting)
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard/'),
  getAttendanceAnalytics: (params) => api.get('/analytics/attendance/', { params }),
  getLeaveAnalytics: (params) => api.get('/analytics/leave/', { params }),
  getEmployeeAnalytics: (params) => api.get('/analytics/employees/', { params }),
  getDepartmentAnalytics: (params) => api.get('/analytics/departments/', { params }),
};

// Assets API - for My Assets page
export const assetsAPI = {
  // For non-admin users this returns only their assignments by backend filtering
  getMyAssignments: (params) => api.get('/assets/asset-assignments/', { params }),
  getAsset: (id) => api.get(`/assets/assets/${id}/`),
  getAssetType: (id) => api.get(`/assets/asset-types/${id}/`),
};

export default api;