import axiosClient from './axiosClient';

export interface ProjectItem {
  id: string;
  name: string;
  key: string;
  description?: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
  };
  _count: {
    members: number;
    tasks: number;
  };
}

export interface TaskItem {
  id: string;
  taskNumber: number;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  positionOrder: number;
  assignee?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  _count: {
    comments: number;
    attachments: number;
  };
}

export interface ColumnItem {
  id: string;
  title: string;
  color?: string;
  positionOrder: number;
  tasks: TaskItem[];
}

export interface ProjectDetail {
  id: string;
  name: string;
  key: string;
  description?: string;
  columns: ColumnItem[];
  members: {
    id: string;
    role: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl?: string;
    };
  }[];
}

export interface CreateProjectDto {
  name: string;
  key: string;
  description?: string;
}

export const projectsApi = {
  getAllMyProjects: (): Promise<ProjectItem[]> => {
    return axiosClient.get('/projects');
  },

  getProjectDetail: (id: string): Promise<ProjectDetail> => {
    return axiosClient.get(`/projects/${id}`);
  },

  createProject: (data: CreateProjectDto): Promise<ProjectItem> => {
    return axiosClient.post('/projects', data);
  },
};