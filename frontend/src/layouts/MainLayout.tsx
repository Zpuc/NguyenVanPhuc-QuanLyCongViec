import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Button,
  theme,
  Badge,
  Popover,
  List,
  Spin,
  Empty,
  Modal,
  Input,
  Tag,
  Tooltip,
  notification,
} from 'antd';
import type { MenuProps } from 'antd';
import { io } from 'socket.io-client';
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
  CheckSquareOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { formatAvatarUrl } from '../api/auth.api';
import { notificationsApi } from '../api/notifications.api';
import type { NotificationItem } from '../api/notifications.api';
import { searchApi } from '../api/search.api';
import type { SearchResponse } from '../api/search.api';
import { SOCKET_ORIGIN } from '../config/env';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
    const { themeMode, toggleTheme } = useThemeStore();
    const isDark = themeMode === 'dark';
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
    const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResponse>({ projects: [], tasks: [] });

    const { user, token, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSearchModalOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!searchModalOpen) {
            setSearchQuery('');
            setSearchResults({ projects: [], tasks: [] });
            return;
        }
    }, [searchModalOpen]);

    useEffect(() => {
        const trimmed = searchQuery.trim();
        if (!trimmed) {
            setSearchResults({ projects: [], tasks: [] });
            setSearchLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchLoading(true);
                const res = await searchApi.search(trimmed);
                setSearchResults(res);
            } catch {
            } finally {
                setSearchLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectProject = (projectId: string) => {
        setSearchModalOpen(false);
        navigate(`/projects/${projectId}`);
    };

    const handleSelectTask = (projectId: string) => {
        setSearchModalOpen(false);
        navigate(`/projects/${projectId}`);
    };

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setCollapsed(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        if (!isAuthenticated || !token) return;

        fetchUnreadCount();

        const socket = io(SOCKET_ORIGIN, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            fetchUnreadCount();
        });

        socket.on('notification:new', (incoming: NotificationItem) => {
            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => {
                if (prev.some((n) => n.id === incoming.id)) {
                    return prev;
                }
                return [incoming, ...prev].slice(0, 20);
            });

            notification.info({
                message: incoming.title,
                description: incoming.content,
                placement: 'topRight',
                duration: 4,
                onClick: () => {
                    if (incoming.metadata?.projectId) {
                        navigate(`/projects/${incoming.metadata.projectId}`);
                    }
                },
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [isAuthenticated, token]);

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
            key: '/my-tasks',
            icon: <CheckSquareOutlined />,
            label: 'Việc của tôi',
            onClick: () => navigate('/my-tasks'),
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
        <div style={{ width: isMobile ? 'min(330px, 92vw)' : 360, maxHeight: 420, display: 'flex', flexDirection: 'column' }}>
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
                                    backgroundColor: item.isRead
                                        ? isDark ? '#141414' : '#ffffff'
                                        : isDark ? '#1e1b4b' : '#f0f5ff',
                                    border: isDark ? '1px solid #303030' : '1px solid #f1f5f9',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                <List.Item.Meta
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: item.isRead ? 500 : 700, fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b' }}>
                                                {item.title}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                                {dayjs(item.createdAt).format('HH:mm DD/MM')}
                                            </span>
                                        </div>
                                    }
                                    description={
                                        <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#475569', marginTop: 2 }}>
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
        <Layout style={{ minHeight: '100vh', position: 'relative', background: isDark ? '#09090b' : '#f1f5f9' }}>
            {isMobile && !collapsed && (
                <div
                    onClick={() => setCollapsed(true)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.45)',
                        zIndex: 999,
                    }}
                />
            )}

            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                collapsedWidth={isMobile ? 0 : 80}
                theme={isDark ? 'dark' : 'light'}
                style={{
                    borderRight: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
                    position: isMobile && !collapsed ? 'fixed' : 'relative',
                    zIndex: isMobile && !collapsed ? 1000 : 'auto',
                    height: isMobile && !collapsed ? '100vh' : 'auto',
                    top: 0,
                    left: 0,
                    background: isDark ? '#18181b' : colorBgContainer,
                }}
            >
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '0' : '0 20px',
                        borderBottom: isDark ? '1px solid #27272a' : '1px solid #f1f5f9',
                        fontWeight: 700,
                        fontSize: 18,
                        color: isDark ? '#818cf8' : '#4f46e5',
                        gap: 10,
                    }}
                >
                    <CheckCircleFilled style={{ fontSize: 24 }} />
                    {!collapsed && <span>TaskMaster</span>}
                </div>
                <Menu
                    theme={isDark ? 'dark' : 'light'}
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{ borderRight: 0, marginTop: 12, background: isDark ? '#18181b' : colorBgContainer }}
                />
            </Sider>

            <Layout style={{ minWidth: 0, background: isDark ? '#09090b' : '#f1f5f9' }}>
                <Header
                    style={{
                        padding: isMobile ? '0 12px' : '0 24px',
                        background: colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
                        height: 64,
                        lineHeight: 'normal',
                    }}
                >
                    <Space size={12} align="center">
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: 16, width: 44, height: 44 }}
                        />

                        <div
                            onClick={() => setSearchModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: isDark ? '#27272a' : '#f8fafc',
                                border: isDark ? '1px solid #3f3f46' : '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: isMobile ? '0 10px' : '0 14px',
                                height: 36,
                                lineHeight: '36px',
                                cursor: 'pointer',
                                width: isMobile ? 140 : 250,
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box',
                            }}
                        >
                            <Space size={8} style={{ color: isDark ? '#a1a1aa' : '#94a3b8', lineHeight: 'normal' }}>
                                <SearchOutlined style={{ fontSize: 14 }} />
                                <span style={{ fontSize: 13, userSelect: 'none' }}>
                                    {isMobile ? 'Tìm...' : 'Tìm kiếm nhanh...'}
                                </span>
                            </Space>
                            {!isMobile && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: isDark ? '#a1a1aa' : '#64748b',
                                        background: isDark ? '#18181b' : '#ffffff',
                                        border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1',
                                        borderRadius: 4,
                                        padding: '1px 5px',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Ctrl K
                                </span>
                            )}
                        </div>
                    </Space>

                    <Space size={isMobile ? 10 : 16} align="center">
                        <Tooltip title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
                            <Button
                                type="text"
                                shape="circle"
                                icon={
                                    isDark ? (
                                        <SunOutlined style={{ fontSize: 18, color: '#f59e0b' }} />
                                    ) : (
                                        <MoonOutlined style={{ fontSize: 18, color: '#475569' }} />
                                    )
                                }
                                onClick={toggleTheme}
                                style={{ width: 40, height: 40 }}
                            />
                        </Tooltip>

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
                                    icon={<BellOutlined style={{ fontSize: 18, color: isDark ? '#94a3b8' : '#475569' }} />}
                                    style={{ width: 40, height: 40 }}
                                />
                            </Badge>
                        </Popover>

                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                            <Space style={{ cursor: 'pointer' }}>
                                <Avatar
                                    style={{ backgroundColor: '#4f46e5' }}
                                    icon={<UserOutlined />}
                                    src={formatAvatarUrl(user?.avatarUrl)}
                                />
                                {!isMobile && <Text strong>{user?.fullName || 'Người dùng'}</Text>}
                            </Space>
                        </Dropdown>
                    </Space>
                </Header>

                <Content
                    style={{
                        margin: isMobile ? 10 : 24,
                        padding: isMobile ? 12 : 24,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        minHeight: 280,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>

            <Modal
                open={searchModalOpen}
                onCancel={() => setSearchModalOpen(false)}
                footer={null}
                closable={false}
                width={isMobile ? '92vw' : 620}
                style={{ top: 70 }}
                styles={{
                    body: { padding: 0 },
                }}
            >
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                    <Input
                        autoFocus
                        size="large"
                        variant="borderless"
                        prefix={<SearchOutlined style={{ fontSize: 18, color: '#6366f1', marginRight: 8 }} />}
                        placeholder="Tìm kiếm dự án, công việc theo tên hoặc mã..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        allowClear
                        style={{ padding: 0, fontSize: 15 }}
                    />
                </div>

                <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px 16px' }}>
                    {searchLoading ? (
                        <div style={{ textAlign: 'center', padding: '36px 0' }}>
                            <Spin />
                        </div>
                    ) : !searchQuery.trim() ? (
                        <div style={{ padding: '32px 12px', textAlign: 'center', color: '#94a3b8' }}>
                            <SearchOutlined style={{ fontSize: 28, marginBottom: 10, display: 'block', color: '#cbd5e1' }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Nhập từ khóa để tìm kiếm nhanh dự án hoặc công việc
                            </Text>
                        </div>
                    ) : searchResults.projects.length === 0 && searchResults.tasks.length === 0 ? (
                        <Empty
                            description="Không tìm thấy dự án hoặc công việc nào phù hợp"
                            style={{ padding: '24px 0' }}
                        />
                    ) : (
                        <div>
                            {searchResults.projects.length > 0 && (
                                <div style={{ marginBottom: 14 }}>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            display: 'block',
                                            marginBottom: 6,
                                            paddingLeft: 4,
                                        }}
                                    >
                                        Dự án ({searchResults.projects.length})
                                    </Text>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {searchResults.projects.map((p) => (
                                            <div
                                                key={p.id}
                                                onClick={() => handleSelectProject(p.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    cursor: 'pointer',
                                                    background: isDark ? '#18181b' : '#ffffff',
                                                    border: isDark ? '1px solid #27272a' : '1px solid #f1f5f9',
                                                    transition: 'all 0.15s ease',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? '#27272a' : '#f8fafc')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? '#18181b' : '#ffffff')}
                                            >
                                                <Space size={10} style={{ minWidth: 0, flex: 1 }}>
                                                    <ProjectOutlined style={{ fontSize: 16, color: '#6366f1' }} />
                                                    <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>
                                                        {p.key}
                                                    </Tag>
                                                    <Text strong style={{ fontSize: 14 }}>
                                                        {p.name}
                                                    </Text>
                                                    {p.description && (
                                                        <Text
                                                            type="secondary"
                                                            ellipsis
                                                            style={{ fontSize: 12, maxWidth: 200 }}
                                                        >
                                                            {p.description}
                                                        </Text>
                                                    )}
                                                </Space>
                                                <ArrowRightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {searchResults.tasks.length > 0 && (
                                <div>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            display: 'block',
                                            marginBottom: 6,
                                            paddingLeft: 4,
                                        }}
                                    >
                                        Công việc ({searchResults.tasks.length})
                                    </Text>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {searchResults.tasks.map((t) => (
                                            <div
                                                key={t.id}
                                                onClick={() => handleSelectTask(t.project.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    cursor: 'pointer',
                                                    background: isDark ? '#18181b' : '#ffffff',
                                                    border: isDark ? '1px solid #27272a' : '1px solid #f1f5f9',
                                                    transition: 'all 0.15s ease',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? '#27272a' : '#f8fafc')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? '#18181b' : '#ffffff')}
                                            >
                                                <Space size={8} wrap style={{ minWidth: 0, flex: 1 }}>
                                                    <Tag color="cyan" style={{ margin: 0, fontWeight: 600 }}>
                                                        {t.project.key}-{t.taskNumber}
                                                    </Tag>
                                                    <Text strong style={{ fontSize: 14 }}>
                                                        {t.title}
                                                    </Text>
                                                    <Tag
                                                        style={{
                                                            margin: 0,
                                                            borderRadius: 4,
                                                            fontSize: 11,
                                                            background: isDark ? '#27272a' : '#f8fafc',
                                                            borderColor: t.column.color || '#cbd5e1',
                                                            color: t.column.color || '#475569',
                                                        }}
                                                    >
                                                        {t.column.title}
                                                    </Tag>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        <ProjectOutlined style={{ marginRight: 4 }} />
                                                        {t.project.name}
                                                    </Text>
                                                </Space>
                                                <ArrowRightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: '8px 16px',
                        background: isDark ? '#18181b' : '#f8fafc',
                        borderTop: isDark ? '1px solid #27272a' : '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12,
                        color: isDark ? '#71717a' : '#94a3b8',
                    }}
                >
                    <span>Bấm vào kết quả để chuyển thẳng đến dự án</span>
                    <Space size={4}>
                        <kbd
                            style={{
                                background: isDark ? '#27272a' : '#ffffff',
                                border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1',
                                borderRadius: 3,
                                padding: '1px 5px',
                                fontSize: 11,
                                color: isDark ? '#a1a1aa' : '#64748b',
                            }}
                        >
                            Esc
                        </kbd>
                        <span>để đóng</span>
                    </Space>
                </div>
            </Modal>
        </Layout>
    );
};
