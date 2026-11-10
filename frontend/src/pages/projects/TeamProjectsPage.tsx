import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Tag, Input, message, Spin, Empty } from 'antd';
import { TeamOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { projectsApi } from '../../api/projects.api';
import type { ProjectItem } from '../../api/projects.api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text, Paragraph } = Typography;

export const TeamProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getAllMyProjects();
      setProjects(data);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const teamProjects = projects.filter((p) => p.owner.id !== currentUser?.id);
  const filteredProjects = teamProjects.filter((p) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.key.toLowerCase().includes(q) ||
      p.owner.fullName.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Dự án nhóm</Title>
          <Text type="secondary">Các dự án bạn được mời tham gia cộng tác</Text>
        </div>
        <Input.Search
          placeholder="Tìm theo tên, key hoặc chủ dự án..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
          size="large"
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : teamProjects.length === 0 ? (
        <Empty
          description="Bạn chưa được mời vào dự án nhóm nào"
          style={{ padding: '60px 0' }}
        />
      ) : filteredProjects.length === 0 ? (
        <Empty
          description="Không tìm thấy dự án nhóm phù hợp với từ khóa"
          style={{ padding: '60px 0' }}
        />
      ) : (
        <Row gutter={[20, 20]}>
          {filteredProjects.map((p) => (
            <Col xs={24} sm={12} lg={8} key={p.id}>
              <Card
                hoverable
                style={{ borderRadius: 12, cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Tag color="cyan" style={{ fontWeight: 'bold' }}>{p.key}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chủ dự án: {p.owner.fullName}
                  </Text>
                </div>
                <Title level={4} style={{ margin: '8px 0' }}>{p.name}</Title>
                <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                  {p.description || 'Chưa có mô tả'}
                </Paragraph>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', gap: 16 }}>
                  <Text type="secondary">
                    <TeamOutlined /> {p._count.members} thành viên
                  </Text>
                  <Text type="secondary">
                    <CheckSquareOutlined /> {p._count.tasks} công việc
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};
