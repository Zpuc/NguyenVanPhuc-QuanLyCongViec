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

export interface ActivityLogItem {
  id: string;
  action: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
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
  attachments: AttachmentItem[];
  activityLogs?: ActivityLogItem[];
  checklists?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  positionOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MyTaskItem {
  id: string;
  projectId: string;
  columnId: string;
  taskNumber: number;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  positionOrder: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    key: string;
  };
  column: {
    id: string;
    title: string;
    color?: string;
    positionOrder?: number;
  };
  _count: {
    comments: number;
    attachments: number;
  };
}

export const tasksApi = {
  getMyTasks: (): Promise<MyTaskItem[]> => {
    return axiosClient.get('/tasks/my-tasks');
  },

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

  updateComment: (commentId: string, content: string): Promise<CommentItem> => {
    return axiosClient.patch(`/comments/${commentId}`, { content });
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

  createChecklist: (taskId: string, title: string): Promise<ChecklistItem> => {
    return axiosClient.post(`/tasks/${taskId}/checklists`, { title });
  },

  updateChecklist: (checklistId: string, data: { title?: string; isCompleted?: boolean }): Promise<ChecklistItem> => {
    return axiosClient.patch(`/tasks/checklists/${checklistId}`, data);
  },

  deleteChecklist: (checklistId: string) => {
    return axiosClient.delete(`/tasks/checklists/${checklistId}`);
  },
};
