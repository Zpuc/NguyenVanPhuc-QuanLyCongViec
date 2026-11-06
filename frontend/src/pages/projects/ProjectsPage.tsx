import React, { useEffect, useState } from 'react';
import { Typography, Button, Row, Col, Card, Tag, Space, Modal, Form, Input, message, Spin, Empty } from 'antd';
import { PlusOutlined, TeamOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { projectsApi } from '../../api/projects.api';
import type { ProjectItem, CreateProjectDto } from '../../api/projects.api';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();


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

  const handleCreate = async (values: CreateProjectDto) => {
    try {
      setSubmitting(true);
      await projectsApi.createProject({
        ...values,
        key: values.key.toUpperCase().trim(),
      });
      message.success('Tạo dự án mới thành công!');
      setIsModalOpen(false);
      form.resetFields();
      fetchProjects();
    } catch (err: any) {
      message.error(err.message || 'Tạo dự án thất bại. Mã Key có thể đã tồn tại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Dự án của tôi</Title>
          <Text type="secondary">Quản lý và theo dõi tiến độ các dự án</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
          Tạo dự án mới
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : projects.length === 0 ? (
        <Empty description="Bạn chưa có dự án nào" style={{ padding: '40px 0' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Tạo dự án đầu tiên
          </Button>
        </Empty>
      ) : (
        <Row gutter={[20, 20]}>
          {projects.map((p) => (
            <Col xs={24} sm={12} lg={8} key={p.id}>
              <Card
                hoverable
                style={{ borderRadius: 12, cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Tag color="blue" style={{ fontWeight: 'bold' }}>{p.key}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>Chủ dự án: {p.owner.fullName}</Text>
                </div>
                <Title level={4} style={{ margin: '8px 0' }}>{p.name}</Title>
                <Paragraph type="secondary" ellipsis={{ rows: 2 }}>{p.description || 'Chưa có mô tả'}</Paragraph>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', gap: 16 }}>
                  <Text type="secondary"><TeamOutlined /> {p._count.members} thành viên</Text>
                  <Text type="secondary"><CheckSquareOutlined /> {p._count.tasks} công việc</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="Tạo dự án mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên dự án" rules={[{ required: true, message: 'Nhập tên dự án!' }]}>
            <Input placeholder="Ví dụ: Ứng dụng Quản lý Bán hàng" size="large" />
          </Form.Item>
          <Form.Item name="key" label="Mã viết tắt (Key)" rules={[{ required: true, message: 'Nhập mã key!' }]}>
            <Input placeholder="Ví dụ: WEB, APP, ERP" size="large" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về dự án..." />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Tạo dự án</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};