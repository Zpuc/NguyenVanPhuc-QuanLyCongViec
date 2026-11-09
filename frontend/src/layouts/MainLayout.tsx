import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems: MenuProps['items'] = [
        {
            key: '/dashboard',
            icon: <AppstoreOutlined />,
            label: 'Tổng quan',
            onClick: () => navigate('/dashboard'),
        },
        {
            key: '/projects',
            icon: <ProjectOutlined />,
            label: 'Dự án của tôi',
            onClick: () => navigate('/projects'),
        },
        {
            key: '/team-projects',
            icon: <TeamOutlined />,
            label: 'Dự án nhóm',
            onClick: () => navigate('/team-projects'),
        },
    ];

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                theme="light"
                style={{
                    borderRight: '1px solid #e2e8f0',
                }}
            >
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '0' : '0 20px',
                        borderBottom: '1px solid #f1f5f9',
                        fontWeight: 700,
                        fontSize: 18,
                        color: '#4f46e5',
                        gap: 10,
                    }}
                >
                    <CheckCircleFilled style={{ fontSize: 24 }} />
                    {!collapsed && <span>TaskMaster</span>}
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{ borderRight: 0, marginTop: 12 }}
                />
            </Sider>

            <Layout>
                <Header
                    style={{
                        padding: '0 24px',
                        background: colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #e2e8f0',
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: 16, width: 44, height: 44 }}
                    />

                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                        <Space style={{ cursor: 'pointer' }}>
                            <Avatar
                                style={{ backgroundColor: '#4f46e5' }}
                                icon={<UserOutlined />}
                                src={user?.avatarUrl}
                            />
                            <Text strong>{user?.fullName || 'Người dùng'}</Text>
                        </Space>
                    </Dropdown>
                </Header>

                <Content
                    style={{
                        margin: 24,
                        padding: 24,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        minHeight: 280,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};
