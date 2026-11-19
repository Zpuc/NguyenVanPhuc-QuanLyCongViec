import axiosClient from './axiosClient';

export interface SearchProjectResult {
  id: string;
  name: string;
  key: string;
  description?: string;
}

export interface SearchTaskResult {
  id: string;
  taskNumber: number;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
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

export interface SearchResponse {
  projects: SearchProjectResult[];
  tasks: SearchTaskResult[];
}

export const searchApi = {
  search: (query: string): Promise<SearchResponse> => {
    return axiosClient.get('/search', { params: { q: query } });
  },
};
