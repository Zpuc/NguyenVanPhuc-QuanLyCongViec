import axiosClient from './axiosClient';

export interface DashboardTaskItem {
  id: string;
  taskNumber: number;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  createdAt: string;
  project: {
    id: string;
    name: string;
    key: string;
  };
  column: {
    id: string;
    title: string;
    color?: string;
  };
}

export interface DashboardStats {
  totalProjects: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  myTasks: DashboardTaskItem[];
}

export const dashboardApi = {
  getStats: (): Promise<DashboardStats> => {
    return axiosClient.get('/dashboard/stats');
  },
};

