import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Row,
  Col,
  Tabs,
  Badge,
  Tag,
  Input,
  Select,
  Button,
  Space,
  List,
  Empty,
  Spin,
  Statistic,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ProjectOutlined,
  CalendarOutlined,
  CommentOutlined,
  PaperClipOutlined,
  ArrowRightOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { tasksApi } from '../../api/tasks.api';
import type { MyTaskItem } from '../../api/tasks.api';

const { Title, Text, Paragraph } = Typography;

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Thấp', color: 'default' },
  MEDIUM: { label: 'Trung bình', color: 'blue' },
  HIGH: { label: 'Cao', color: 'orange' },
  URGENT: { label: 'Khẩn cấp', color: 'red' },
};

export const MyTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<MyTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getMyTasks();
      setTasks(data);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const isDoneColumn = (colTitle: string) => {
    const lower = colTitle.toLowerCase();
    return lower.includes('done') || lower.includes('hoàn thành') || lower.includes('xong');
  };

  const isOverdue = (task: MyTaskItem) => {
    if (isDoneColumn(task.column.title)) return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate).getTime() < Date.now();
  };

  const isDueSoon = (task: MyTaskItem) => {
    if (isDoneColumn(task.column.title)) return false;
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate).getTime();
    const diffHours = (due - Date.now()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 48;
  };

  const isInProgress = (task: MyTaskItem) => {
    if (isDoneColumn(task.column.title)) return false;
    return !isOverdue(task);
  };

  const isCompleted = (task: MyTaskItem) => {
    return isDoneColumn(task.column.title);
  };

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      map.set(t.project.id, t.project.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [tasks]);

  const counts = useMemo(() => {
    let inProgress = 0;
    let dueSoon = 0;
    let overdue = 0;
    let completed = 0;

    tasks.forEach((task) => {
      if (isCompleted(task)) {
        completed++;
      } else {
        if (isOverdue(task)) overdue++;
        if (isDueSoon(task)) dueSoon++;
        if (isInProgress(task)) inProgress++;
      }
    });

    return {
      all: tasks.length,
      inProgress,
      dueSoon,
      overdue,
      completed,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeTab === 'in_progress' && !isInProgress(task)) return false;
      if (activeTab === 'due_soon' && !isDueSoon(task)) return false;
      if (activeTab === 'overdue' && !isOverdue(task)) return false;
      if (activeTab === 'completed' && !isCompleted(task)) return false;

      if (selectedProject !== 'ALL' && task.project.id !== selectedProject) return false;
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) return false;

      if (searchText.trim()) {
        const query = searchText.trim().toLowerCase();
        const code = `${task.project.key}-${task.taskNumber}`.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(query);
        const codeMatch = code.includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const projMatch = task.project.name.toLowerCase().includes(query);
        if (!titleMatch && !codeMatch && !descMatch && !projMatch) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, activeTab, selectedProject, selectedPriority, searchText]);

  const tabItems = [
    {
      key: 'all',
      label: (
        <Space size={6}>
          <UnorderedListOutlined />
          <span>Tất cả</span>
          <Badge
            count={counts.all}
            overflowCount={99}
            style={{ backgroundColor: '#64748b' }}
          />
        </Space>
      ),
    },
    {
      key: 'in_progress',
      label: (
        <Space size={6}>
          <ClockCircleOutlined />
          <span>Đang thực hiện</span>
          <Badge
            count={counts.inProgress}
            overflowCount={99}
            style={{ backgroundColor: '#3b82f6' }}
          />
        </Space>
      ),
    },
    {
      key: 'due_soon',
      label: (
        <Space size={6}>
          <FieldTimeOutlined style={{ color: '#d97706' }} />
          <span>Sắp tới hạn</span>
          <Badge
            count={counts.dueSoon}
            overflowCount={99}
            style={{ backgroundColor: '#f59e0b' }}
          />
        </Space>
      ),
    },
    {
      key: 'overdue',
      label: (
        <Space size={6}>
          <ExclamationCircleOutlined style={{ color: '#ef4444' }} />
          <span>Đã quá hạn</span>
          <Badge
            count={counts.overdue}
            overflowCount={99}
            style={{ backgroundColor: '#ef4444' }}
          />
        </Space>
      ),
    },
    {
      key: 'completed',
      label: (
        <Space size={6}>
          <CheckCircleOutlined style={{ color: '#10b981' }} />
          <span>Đã hoàn thành</span>
          <Badge
            count={counts.completed}
            overflowCount={99}
            style={{ backgroundColor: '#10b981' }}
          />
        </Space>
      ),
    },
  ];

  const formatDueDate = (task: MyTaskItem) => {
    if (!task.dueDate) {
      return <Text type="secondary" style={{ fontSize: 12 }}>Không có hạn chót</Text>;
    }

    const due = new Date(task.dueDate);
    const overdue = isOverdue(task);
    const dueSoon = isDueSoon(task);

    let textColor = '#64748b';
    let label = due.toLocaleDateString('vi-VN');

    if (overdue) {
      textColor = '#ef4444';
      label = `Quá hạn (${due.toLocaleDateString('vi-VN')})`;
    } else if (dueSoon) {
      textColor = '#f59e0b';
      label = `Sắp tới hạn (${due.toLocaleDateString('vi-VN')})`;
    }

    return (
      <Space size={4} style={{ color: textColor, fontWeight: overdue || dueSoon ? 600 : 400 }}>
        <CalendarOutlined />
        <span style={{ fontSize: 12 }}>{label}</span>
      </Space>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Việc của tôi
            </Title>
            <Text type="secondary">
              Theo dõi và quản lý toàn bộ công việc được giao cho bạn trên tất cả dự án
            </Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchTasks} loading={loading}>
            Làm mới
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" style={{ background: '#eff6ff', borderRadius: 10 }}>
            <Statistic
              title={<span style={{ color: '#1e40af', fontSize: 13 }}>Đang thực hiện</span>}
              value={counts.inProgress}
              prefix={<ClockCircleOutlined style={{ color: '#3b82f6', marginRight: 6 }} />}
              styles={{ content: { color: '#1e3a8a', fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" style={{ background: '#fffbeb', borderRadius: 10 }}>
            <Statistic
              title={<span style={{ color: '#92400e', fontSize: 13 }}>Sắp tới hạn (48h)</span>}
              value={counts.dueSoon}
              prefix={<FieldTimeOutlined style={{ color: '#f59e0b', marginRight: 6 }} />}
              styles={{ content: { color: '#b45309', fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" style={{ background: '#fef2f2', borderRadius: 10 }}>
            <Statistic
              title={<span style={{ color: '#991b1b', fontSize: 13 }}>Đã quá hạn</span>}
              value={counts.overdue}
              prefix={<ExclamationCircleOutlined style={{ color: '#ef4444', marginRight: 6 }} />}
              styles={{ content: { color: '#b91c1c', fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" style={{ background: '#f0fdf4', borderRadius: 10 }}>
            <Statistic
              title={<span style={{ color: '#166534', fontSize: 13 }}>Đã hoàn thành</span>}
              value={counts.completed}
              prefix={<CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }} />}
              styles={{ content: { color: '#15803d', fontWeight: 700 } }}
            />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" style={{ borderRadius: 12 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={10}>
            <Input
              placeholder="Tìm theo mã công việc, tiêu đề hoặc nội dung..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={7}>
            <Select
              style={{ width: '100%' }}
              value={selectedProject}
              onChange={setSelectedProject}
              options={[
                { value: 'ALL', label: 'Tất cả dự án' },
                ...projectOptions,
              ]}
            />
          </Col>
          <Col xs={12} md={7}>
            <Select
              style={{ width: '100%' }}
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={[
                { value: 'ALL', label: 'Tất cả độ ưu tiên' },
                { value: 'URGENT', label: 'Khẩn cấp' },
                { value: 'HIGH', label: 'Cao' },
                { value: 'MEDIUM', label: 'Trung bình' },
                { value: 'LOW', label: 'Thấp' },
              ]}
            />
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Empty
            description={
              searchText || selectedProject !== 'ALL' || selectedPriority !== 'ALL'
                ? 'Không tìm thấy công việc nào phù hợp với bộ lọc'
                : 'Bạn không có công việc nào trong danh mục này'
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={filteredTasks}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Tổng cộng ${total} công việc`,
            }}
            renderItem={(task) => {
              const priorityInfo = priorityConfig[task.priority] || { label: task.priority, color: 'default' };
              const code = `${task.project.key}-${task.taskNumber}`;

              return (
                <List.Item
                  style={{
                    padding: '16px',
                    borderRadius: 8,
                    marginBottom: 10,
                    border: '1px solid #f1f5f9',
                    background: '#ffffff',
                    transition: 'all 0.2s',
                  }}
                  actions={[
                    <Button
                      type="link"
                      icon={<ArrowRightOutlined />}
                      onClick={() => navigate(`/projects/${task.project.id}`)}
                      style={{ padding: 0 }}
                    >
                      Mở bảng
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                        <Tag color="cyan" style={{ margin: 0, fontWeight: 600 }}>
                          {code}
                        </Tag>
                        <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                          {task.title}
                        </Text>
                        <Tag
                          color={priorityInfo.color}
                          style={{ margin: 0, fontSize: 11, borderRadius: 4 }}
                        >
                          {priorityInfo.label}
                        </Tag>
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 4,
                            background: '#f8fafc',
                            borderColor: task.column.color || '#cbd5e1',
                            color: task.column.color || '#475569',
                            fontWeight: 500,
                          }}
                        >
                          {task.column.title}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        {task.description && (
                          <Paragraph
                            ellipsis={{ rows: 2 }}
                            type="secondary"
                            style={{ margin: '4px 0 8px', fontSize: 13 }}
                          >
                            {task.description}
                          </Paragraph>
                        )}
                        <Space size={16} wrap style={{ marginTop: 4 }}>
                          <Space size={4} style={{ color: '#4f46e5' }}>
                            <ProjectOutlined />
                            <Text strong style={{ fontSize: 12, color: '#4f46e5' }}>
                              {task.project.name}
                            </Text>
                          </Space>
                          {formatDueDate(task)}
                          {task._count.comments > 0 && (
                            <Space size={4} style={{ color: '#64748b', fontSize: 12 }}>
                              <CommentOutlined />
                              <span>{task._count.comments}</span>
                            </Space>
                          )}
                          {task._count.attachments > 0 && (
                            <Space size={4} style={{ color: '#64748b', fontSize: 12 }}>
                              <PaperClipOutlined />
                              <span>{task._count.attachments}</span>
                            </Space>
                          )}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
};
