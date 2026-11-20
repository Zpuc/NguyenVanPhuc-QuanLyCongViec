import React, { useEffect, useState } from 'react';
import {
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Table,
  Tag,
  Space,
  Spin,
  Empty,
  Input,
  Checkbox,
  Tooltip,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ProjectOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  RightOutlined,
  PushpinOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { dashboardApi } from '../../api/dashboard.api';
import type { DashboardStats, DashboardTaskItem } from '../../api/dashboard.api';

interface StickyNote {
  id: string;
  text: string;
  isDone: boolean;
  createdAt: number;
}

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { themeMode } = useThemeStore();
  const isDark = themeMode === 'dark';
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    myTasks: [],
  });

  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');

  const storageKey = `dashboard_sticky_notes_${user?.id || 'guest'}`;

  useEffect(() => {
    fetchStats();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setNotes(JSON.parse(raw));
      } else {
        const defaultNotes: StickyNote[] = [
          { id: '1', text: 'Kiểm tra tiến độ sprint tuần này', isDone: false, createdAt: Date.now() },
          { id: '2', text: 'Review code các pull request đang chờ', isDone: true, createdAt: Date.now() - 3600000 },
        ];
        setNotes(defaultNotes);
        localStorage.setItem(storageKey, JSON.stringify(defaultNotes));
      }
    } catch {
      setNotes([]);
    }
  }, [user?.id]);

  const saveNotes = (updated: StickyNote[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
    }
  };

  const handleAddNote = () => {
    const trimmed = newNoteText.trim();
    if (!trimmed) return;
    const newNote: StickyNote = {
      id: Date.now().toString(),
      text: trimmed,
      isDone: false,
      createdAt: Date.now(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setNewNoteText('');
  };

  const handleToggleNote = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isDone: !n.isDone } : n
    );
    setNotes(updated);
    saveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
  };

  const handleClearCompleted = () => {
    const updated = notes.filter((n) => !n.isDone);
    setNotes(updated);
    saveNotes(updated);
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch {
      message.error('Không thể tải dữ liệu thống kê tổng quan');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityTag = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Tag color="error">Khẩn cấp</Tag>;
      case 'HIGH':
        return <Tag color="warning">Cao</Tag>;
      case 'MEDIUM':
        return <Tag color="processing">Trung bình</Tag>;
      case 'LOW':
        return <Tag color="default">Thấp</Tag>;
      default:
        return <Tag>{priority}</Tag>;
    }
  };

  const columns: ColumnsType<DashboardTaskItem> = [
    {
      title: 'Mã',
      key: 'taskKey',
      width: 120,
      render: (_, record) => (
        <Tag color="geekblue" style={{ fontWeight: 600 }}>
          {record.project.key}-{record.taskNumber}
        </Tag>
      ),
    },
    {
      title: 'Tiêu đề công việc',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <a
          onClick={() => navigate(`/projects/${record.project.id}`)}
          style={{ fontWeight: 500, color: '#1e293b' }}
        >
          {title}
        </a>
      ),
    },
    {
      title: 'Dự án',
      key: 'project',
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>{record.project.name}</span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'column',
      render: (_, record) => (
        <Tag color={record.column.color || 'blue'}>{record.column.title}</Tag>
      ),
    },
    {
      title: 'Mức ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: 'Hạn chót',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (dueDate?: string) => {
        if (!dueDate) return <Text type="secondary">Chưa đặt</Text>;
        const isOverdue = dayjs(dueDate).isBefore(dayjs(), 'day');
        return (
          <Tag color={isOverdue ? 'volcano' : 'default'}>
            {dayjs(dueDate).format('DD/MM/YYYY')}
          </Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<RightOutlined />}
          onClick={() => navigate(`/projects/${record.project.id}`)}
        >
          Xem bảng
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Xin chào, {user?.fullName || 'bạn'}! 👋
          </Title>
          <Text type="secondary">
            Chào mừng bạn quay trở lại với bảng điều khiển công việc.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/projects')}
        >
          Quản lý Dự án
        </Button>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: isDark ? '#141414' : '#f8fafc', border: isDark ? '1px solid #27272a' : '1px solid #f1f5f9', borderRadius: 12 }}>
              <Statistic
                title="Tổng số dự án"
                value={stats.totalProjects}
                prefix={<ProjectOutlined style={{ color: '#4f46e5' }} />}
                valueStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: isDark ? '#141414' : '#f8fafc', border: isDark ? '1px solid #27272a' : '1px solid #f1f5f9', borderRadius: 12 }}>
              <Statistic
                title="Đang thực hiện"
                value={stats.inProgressTasks}
                prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: isDark ? '#141414' : '#f8fafc', border: isDark ? '1px solid #27272a' : '1px solid #f1f5f9', borderRadius: 12 }}>
              <Statistic
                title="Đã hoàn thành"
                value={stats.completedTasks}
                prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: isDark ? '#141414' : '#f8fafc', border: isDark ? '1px solid #27272a' : '1px solid #f1f5f9', borderRadius: 12 }}>
              <Statistic
                title="Công việc quá hạn"
                value={stats.overdueTasks}
                prefix={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}
                valueStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[20, 20]}>
          <Col xs={24} xl={15}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                border: isDark ? '1px solid #27272a' : '1px solid #f1f5f9',
                height: '100%',
              }}
              title={
                <Space>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Công việc được giao cho tôi</span>
                  <Tag color="blue">{stats.myTasks.length}</Tag>
                </Space>
              }
            >
              <Table
                rowKey="id"
                dataSource={stats.myTasks}
                columns={columns}
                scroll={{ x: 650 }}
                pagination={stats.myTasks.length > 5 ? { pageSize: 5 } : false}
                locale={{
                  emptyText: <Empty description="Bạn chưa có công việc nào được giao" />,
                }}
              />
            </Card>
          </Col>

          <Col xs={24} xl={9}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                border: isDark ? '1px solid #27272a' : '1px solid #f1f5f9',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space align="center">
                    <PushpinOutlined style={{ color: '#f59e0b', fontSize: 17 }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Ghi chú nhanh</span>
                    <Tag color="gold" style={{ margin: 0 }}>
                      {notes.filter((n) => n.isDone).length}/{notes.length}
                    </Tag>
                  </Space>
                  {notes.some((n) => n.isDone) && (
                    <Button type="link" size="small" onClick={handleClearCompleted} style={{ padding: 0, fontSize: 12 }}>
                      Dọn việc đã xong
                    </Button>
                  )}
                </div>
              }
            >
              <div style={{ marginBottom: 14 }}>
                <Input.Search
                  placeholder="Thêm việc cần nhớ... (Enter)"
                  enterButton={<PlusOutlined />}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onSearch={handleAddNote}
                />
              </div>

              <div style={{ flex: 1, maxHeight: 340, overflowY: 'auto', paddingRight: 2 }}>
                {notes.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có ghi chú nào. Gõ vào ô trên để ghi nhớ nhanh!"
                    style={{ margin: '30px 0' }}
                  />
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 8,
                        marginBottom: 8,
                        background: isDark
                          ? note.isDone ? '#141414' : '#27272a'
                          : note.isDone ? '#f8fafc' : '#fefce8',
                        border: isDark
                          ? '1px solid #3f3f46'
                          : note.isDone ? '1px solid #e2e8f0' : '1px solid #fef08a',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Space align="center" style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                        <Checkbox
                          checked={note.isDone}
                          onChange={() => handleToggleNote(note.id)}
                        />
                        <Text
                          delete={note.isDone}
                          type={note.isDone ? 'secondary' : undefined}
                          style={{
                            fontSize: 13,
                            wordBreak: 'break-word',
                            color: note.isDone ? undefined : isDark ? '#f4f4f5' : '#713f12',
                          }}
                        >
                          {note.text}
                        </Text>
                      </Space>
                      <Tooltip title="Xóa ghi chú">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteNote(note.id)}
                        />
                      </Tooltip>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};
