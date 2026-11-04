import React from 'react';
import { Typography, Row, Col, Card, Statistic, Button } from 'antd';
import { ProjectOutlined, ClockCircleOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

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
          <Text type="secondary">Chào mừng bạn quay trở lại với bảng điều khiển công việc.</Text>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: '#f8fafc', borderRadius: 12 }}>
            <Statistic
              title="Tổng số dự án"
              value={3}
              prefix={<ProjectOutlined style={{ color: '#4f46e5' }} />}
              valueStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: '#f8fafc', borderRadius: 12 }}>
            <Statistic
              title="Công việc đang làm"
              value={12}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: '#f8fafc', borderRadius: 12 }}>
            <Statistic
              title="Công việc hoàn thành"
              value={28}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};