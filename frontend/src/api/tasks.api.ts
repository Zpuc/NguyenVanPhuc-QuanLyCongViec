import axiosClient from './axiosClient';

export interface CreateTaskDto {
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface MoveTaskDto {
  columnId: string;
  newPositionOrder: number;
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface TaskDetail {
  id: string;
  taskNumber: number;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  createdAt: string;
  column: {
    id: string;
    title: string;
    color?: string;
  };
  assignee?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  reporter: {
    id: string;
    fullName: string;
  };
  comments: CommentItem[];
}

export const tasksApi = {
  createTask: (data: CreateTaskDto) => {
    return axiosClient.post('/tasks', data);
  },

  moveTask: (taskId: string, data: MoveTaskDto) => {
    return axiosClient.patch(`/tasks/${taskId}/move`, data);
  },

  deleteTask: (taskId: string) => {
    return axiosClient.delete(`/tasks/${taskId}`);
  },

  getTaskDetail: (taskId: string): Promise<TaskDetail> => {
    return axiosClient.get(`/tasks/${taskId}`);
  },

  addComment: (taskId: string, content: string): Promise<CommentItem> => {
    return axiosClient.post(`/tasks/${taskId}/comments`, { content });
  },

  deleteComment: (commentId: string) => {
    return axiosClient.delete(`/comments/${commentId}`);
  },
};
