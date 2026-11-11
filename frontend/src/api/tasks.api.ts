import axiosClient from './axiosClient';

export interface CreateTaskDto {
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string | null;
  dueDate?: string | null;
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

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    fullName: string;
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
  attachments: AttachmentItem[];
}

export const tasksApi = {
  createTask: (data: CreateTaskDto) => {
    return axiosClient.post('/tasks', data);
  },

  updateTask: (taskId: string, data: UpdateTaskDto): Promise<TaskDetail> => {
    return axiosClient.patch(`/tasks/${taskId}`, data);
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

  uploadAttachment: (taskId: string, file: File): Promise<AttachmentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteAttachment: (attachmentId: string) => {
    return axiosClient.delete(`/tasks/attachments/${attachmentId}`);
  },
};
