import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend deployed on Render
const API_BASE_URL = 'https://spelling-backend.onrender.com/api';

// Create axios instance with longer timeout for mobile networks
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // Increased to 90 seconds for Render cold starts and slow networks
  headers: {
    'Content-Type': 'application/json',
  },
});

// Navigation reference for handling auth errors
let navigationRef = null;

export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle timeout errors with retry
    if (error.code === 'ECONNABORTED' && !originalRequest._retryCount) {
      originalRequest._retryCount = 1;
      console.log('Request timed out, retrying...');
      return api(originalRequest);
    }

    // Handle network errors with retry
    if (!error.response && !originalRequest._retryCount) {
      originalRequest._retryCount = 1;
      // Wait 1 second and retry once for network errors
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(originalRequest);
    }

    // Handle 401 (Unauthorized) - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const currentToken = await AsyncStorage.getItem('authToken');
        if (currentToken) {
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { token: currentToken },
            { timeout: 30000 } // Increased to 30 seconds
          );

          if (refreshResponse.data.token) {
            // Save new token
            await AsyncStorage.setItem('authToken', refreshResponse.data.token);
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Token refresh failed - clear auth and redirect to login
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('currentUser');
        
        if (navigationRef?.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
        
        return Promise.reject(refreshError);
      }
    }


    return Promise.reject(error);
  }
);

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const authAPI = {
  register: (email, password) => 
    api.post('/auth/register', { email, password }),

  login: (email, password) => 
    api.post('/auth/login', { email, password }),

  subUserLogin: (subUserId, pin) => 
    api.post('/auth/sub-user/login', { subUserId, pin }),

  getSubUserList: (parentEmail) => 
    api.get('/auth/sub-users', { params: { parentEmail } }),

  refreshToken: (token) => 
    api.post('/auth/refresh', { token }),
};

// ============================================================================
// SUB-USER MANAGEMENT
// ============================================================================

export const subUserAPI = {
  create: (name, pin, avatarColor) => 
    api.post('/sub-users', { name, pin, avatarColor }),

  getAll: () => 
    api.get('/sub-users'),

  update: (subUserId, data) => 
    api.put(`/sub-users/${subUserId}`, data),

  delete: (subUserId) => 
    api.delete(`/sub-users/${subUserId}`),

  reorder: (orderedIds) => 
    api.post('/sub-users/reorder', { orderedIds }),
};

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

export const taskAPI = {
  assign: (assignmentData) => {
    // assignmentData can be either:
    // 1. Simple format (legacy): { listId, subUserIds, dueDate, notes }
    // 2. Enhanced format (Phase 2): { listId, subUserIds, taskType, testInputMode, scheduleType, dueDate, dailySchedule, notes, soundEnabled, rewardApp }
    return api.post('/tasks/assign', assignmentData);
  },

  remove: (taskId, subUserIds) => 
    api.post('/tasks/remove', { taskId, subUserIds }),

  getParentTasks: (status = null, listId = null) => 
    api.get('/tasks', { params: { status, listId } }),

  getTaskDetails: (taskId) => 
    api.get(`/tasks/${taskId}`),

  getSubUserTasks: (subUserId) => 
    api.get(`/sub-users/${subUserId}/tasks`),

  updateStatus: (assignmentId, status) => 
    api.put(`/tasks/assignments/${assignmentId}/status`, { status }),
};

// ============================================================================
// PRACTICE SESSIONS
// ============================================================================

export const practiceAPI = {
  startSession: (taskAssignmentId) => 
    api.post('/practice/start', { taskAssignmentId }),

  submitAttempt: (sessionId, wordId, userInput, inputMethod, definitionInput = null) => 
    api.post('/practice/attempt', { 
      sessionId, 
      wordId, 
      userInput, 
      inputMethod, 
      definitionInput 
    }),

  completeSession: (sessionId) => 
    api.post(`/practice/sessions/${sessionId}/complete`),

  getSessionHistory: (subUserId, limit = 20, offset = 0) => 
    api.get(`/sub-users/${subUserId}/sessions`, { params: { limit, offset } }),

  getWordMastery: (subUserId, listId = null) => 
    api.get(`/sub-users/${subUserId}/mastery`, { params: { listId } }),
};

// ============================================================================
// CONTENT MANAGEMENT
// ============================================================================

export const contentAPI = {
  // Groups
  getGroups: () => api.get('/groups'),
  createGroup: (name, description) => api.post('/groups', { name, description }),

  // Grades
  getGrades: (groupId) => api.get(`/groups/${groupId}/grades`),
  createGrade: (groupId, name, description) => api.post('/grades', { groupId, name, description }),

  // Lists
  createList: (gradeId, name, description) => api.post('/lists', { gradeId, name, description }),
  
  // Words
  addWord: (listId, wordText, definition, pronunciationHint) => 
    api.post('/words', { listId, wordText, definition, pronunciationHint }),
  
  updateWord: (wordId, wordText, definition, pronunciationHint) =>
    api.put(`/words/${wordId}`, { wordText, definition, pronunciationHint }),
  
  deleteWord: (wordId) => api.delete(`/words/${wordId}`),
  
  getWords: (listId) => api.get(`/lists/${listId}/words`),

  // Simplified list creation - auto-creates group/grade if needed (backward compatibility)
  createSimpleList: async (name, description, words) => {
    // First, ensure user has a default group
    let groupId;
    try {
      const groupsRes = await api.get('/groups');
      if (groupsRes.data.groups && groupsRes.data.groups.length === 0) {
        // Create default group
        const newGroup = await api.post('/groups', { 
          name: 'My Lists',
          description: 'Default word lists'
        });
        groupId = newGroup.data.group.id;
      } else {
        groupId = groupsRes.data.groups[0].id;
      }
    } catch (error) {
      // If groups endpoint fails, create a group
      const newGroup = await api.post('/groups', { 
        name: 'My Lists',
        description: 'Default word lists'
      });
      groupId = newGroup.data.group.id;
    }

    // Ensure group has a default grade
    let gradeId;
    try {
      const gradesRes = await api.get(`/groups/${groupId}/grades`);
      if (gradesRes.data.grades && gradesRes.data.grades.length === 0) {
        const newGrade = await api.post('/grades', {
          groupId,
          name: 'General',
          description: 'General word lists'
        });
        gradeId = newGrade.data.grade.id;
      } else {
        gradeId = gradesRes.data.grades[0].id;
      }
    } catch (error) {
      const newGrade = await api.post('/grades', {
        groupId,
        name: 'General',
        description: 'General word lists'
      });
      gradeId = newGrade.data.grade.id;
    }

    // Create the list
    const listRes = await api.post('/lists', {
      gradeId,
      name,
      description
    });

    const listId = listRes.data.list.id;

    // Add words to the list
    for (const word of words) {
      await api.post('/words', {
        listId,
        wordText: word,
        definition: '',
        pronunciationHint: ''
      });
    }

    return listRes.data;
  },

  getAllLists: () => api.get('/lists'),
  
  deleteList: (listId) => api.delete(`/lists/${listId}`),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const setAuthToken = async (token) => {
  await AsyncStorage.setItem('authToken', token);
  // Store token timestamp for expiration checking
  await AsyncStorage.setItem('authTokenTimestamp', Date.now().toString());
};

export const clearAuthToken = async () => {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('authTokenTimestamp');
  await AsyncStorage.removeItem('currentUser');
};

export const getAuthToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

export const isTokenExpired = async () => {
  const timestamp = await AsyncStorage.getItem('authTokenTimestamp');
  if (!timestamp) return true;
  
  const tokenAge = Date.now() - parseInt(timestamp);
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  
  // Return true if token is older than 6.5 days (refresh before 7 day expiry)
  return tokenAge > (sevenDaysInMs - 12 * 60 * 60 * 1000);
};

export const setCurrentUser = async (user) => {
  await AsyncStorage.setItem('currentUser', JSON.stringify(user));
};

export const getCurrentUser = async () => {
  const userJson = await AsyncStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
};

export default api;
