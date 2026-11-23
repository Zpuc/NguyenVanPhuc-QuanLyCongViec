import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { useThemeStore } from './store/useThemeStore';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { TeamProjectsPage } from './pages/projects/TeamProjectsPage';
import { KanbanBoardPage } from './pages/board/KanbanBoardPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { MyTasksPage } from './pages/tasks/MyTasksPage';

function App() {
  const { themeMode } = useThemeStore();

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/team-projects" element={<TeamProjectsPage />} />
            <Route path="/projects/:id" element={<KanbanBoardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
