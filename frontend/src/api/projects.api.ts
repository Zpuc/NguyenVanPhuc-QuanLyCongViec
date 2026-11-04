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

export interface CreateProjectDto {
    name: string;
    key: string;
    description?: string;
}

export const projectsApi = {
    getAllMyProjects: (): Promise<ProjectItem[]> => {
        return axiosClient.get('/projects');
    },

    createProject: (data: CreateProjectDto): Promise<ProjectItem> => {
        return axiosClient.post('/projects', data);
    },
};