import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button, theme, Badge, Popover, List, Spin, Empty } from 'antd';
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
  BellOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/useAuthStore';
import { notificationsApi } from '../api/notifications.api';
import type { NotificationItem } from '../api/notifications.api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
    const [popoverOpen, setPopoverOpen] = useState<boolean>(false);

    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const fetchUnreadCount = async () => {
        try {
            const res = await notificationsApi.getUnreadCount();
            setUnreadCount(res.count);
        } catch {
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoadingNotifications(true);
            const data = await notificationsApi.getMyNotifications();
            setNotifications(data);
        } catch {
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleOpenPopover = (open: boolean) => {
        setPopoverOpen(open);
        if (open) {
            fetchNotifications();
        }
    };

    const handleNotificationClick = async (item: NotificationItem) => {
        if (!item.isRead) {
            try {
                await notificationsApi.markAsRead(item.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch {
            }
        }
        setPopoverOpen(false);
        if (item.metadata?.projectId) {
            navigate(`/projects/${item.metadata.projectId}`);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
        }
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
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Hồ sơ cá nhân',
            onClick: () => navigate('/profile'),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: handleLogout,
        },
    ];

    const notificationContent = (
        <div style={{ width: 360, maxHeight: 420, display: 'flex', flexDirection: 'column' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 10,
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: 8,
                }}
            >
                <span style={{ fontWeight: 600, fontSize: 15 }}>Thông báo</span>
                {unreadCount > 0 && (
                    <Button
                        type="link"
                        size="small"
                        onClick={handleMarkAllAsRead}
                        style={{ padding: 0, fontSize: 12 }}
                    >
                        Đánh dấu đã đọc tất cả
                    </Button>
                )}
            </div>

            <div style={{ overflowY: 'auto', maxHeight: 340, paddingRight: 4 }}>
                {loadingNotifications ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <Spin size="small" />
                    </div>
                ) : notifications.length === 0 ? (
                    <Empty description="Chưa có thông báo nào" style={{ padding: '30px 0' }} />
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={notifications}
                        renderItem={(item) => (
                            <List.Item
                                onClick={() => handleNotificationClick(item)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    marginBottom: 6,
                                    cursor: 'pointer',
                                    backgroundColor: item.isRead ? '#ffffff' : '#f0f5ff',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                <List.Item.Meta
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: item.isRead ? 500 : 700, fontSize: 13, color: '#1e293b' }}>
                                                {item.title}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                                {dayjs(item.createdAt).format('HH:mm DD/MM')}
                                            </span>
                                        </div>
                                    }
                                    description={
                                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                                            {item.content}
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </div>
        </div>
    );

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

                    <Space size={20}>
                        <Popover
                            content={notificationContent}
                            trigger="click"
                            placement="bottomRight"
                            open={popoverOpen}
                            onOpenChange={handleOpenPopover}
                        >
                            <Badge count={unreadCount} overflowCount={99} size="small">
                                <Button
                                    type="text"
                                    shape="circle"
                                    icon={<BellOutlined style={{ fontSize: 18, color: '#475569' }} />}
                                    style={{ width: 40, height: 40 }}
                                />
                            </Badge>
                        </Popover>

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
                    </Space>
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
