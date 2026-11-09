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
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/useAuthStore';
import { dashboardApi } from '../../api/dashboard.api';
import type { DashboardStats, DashboardTaskItem } from '../../api/dashboard.api';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    myTasks: [],
  });

  useEffect(() => {
    fetchStats();
  }, []);

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
            <Card bordered={false} style={{ background: '#f8fafc', borderRadius: 12 }}>
              <Statistic
                title="Tổng số dự án"
                value={stats.totalProjects}
                prefix={<ProjectOutlined style={{ color: '#4f46e5' }} />}
                valueStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: '#f8fafc', borderRadius: 12 }}>
              <Statistic
                title="Đang thực hiện"
                value={stats.inProgressTasks}
                prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: '#f8fafc', borderRadius: 12 }}>
              <Statistic
                title="Đã hoàn thành"
                value={stats.completedTasks}
                prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: '#f8fafc', borderRadius: 12 }}>
              <Statistic
                title="Công việc quá hạn"
                value={stats.overdueTasks}
                prefix={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}
                valueStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          bordered={false}
          style={{ borderRadius: 12, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
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
            pagination={stats.myTasks.length > 5 ? { pageSize: 5 } : false}
            locale={{
              emptyText: <Empty description="Bạn chưa có công việc nào được giao" />,
            }}
          />
        </Card>
      </Spin>
    </div>
  );
};
