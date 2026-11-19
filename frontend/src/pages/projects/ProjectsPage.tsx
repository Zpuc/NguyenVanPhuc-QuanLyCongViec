import React, { useEffect, useState } from 'react';
import {
  Typography,
  Button,
  Row,
  Col,
  Card,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Empty,
  Popconfirm,
  Tooltip,
} from 'antd';
import { PlusOutlined, TeamOutlined, CheckSquareOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { projectsApi } from '../../api/projects.api';
import type { ProjectItem, CreateProjectDto } from '../../api/projects.api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text, Paragraph } = Typography;

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
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

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: ProjectItem) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      key: project.key,
      description: project.description,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: CreateProjectDto) => {
    try {
      setSubmitting(true);
      if (editingProject) {
        await projectsApi.updateProject(editingProject.id, {
          name: values.name,
          description: values.description,
        });
        message.success('Cập nhật dự án thành công!');
      } else {
        await projectsApi.createProject({
          ...values,
          key: values.key.toUpperCase().trim(),
        });
        message.success('Tạo dự án mới thành công!');
      }
      setIsModalOpen(false);
      setEditingProject(null);
      form.resetFields();
      fetchProjects();
    } catch (err: any) {
      message.error(err.message || (editingProject ? 'Cập nhật dự án thất bại!' : 'Tạo dự án thất bại. Mã Key có thể đã tồn tại!'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectsApi.deleteProject(projectId);
      message.success('Đã xóa dự án thành công');
      fetchProjects();
    } catch (err: any) {
      message.error(err.message || 'Không thể xóa dự án');
    }
  };

  const myProjects = projects.filter((p) => p.owner.id === currentUser?.id);
  const filteredProjects = myProjects.filter((p) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.key.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Dự án của tôi</Title>
          <Text type="secondary">Các dự án do bạn làm chủ sở hữu</Text>
        </div>
        <Space size={12} wrap>
          <Input.Search
            placeholder="Tìm theo tên hoặc mã key..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
            size="large"
          />
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleOpenCreateModal}>
            Tạo dự án mới
          </Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : myProjects.length === 0 ? (
        <Empty description="Bạn chưa làm chủ dự án nào" style={{ padding: '40px 0' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
            Tạo dự án đầu tiên
          </Button>
        </Empty>
      ) : filteredProjects.length === 0 ? (
        <Empty description="Không tìm thấy dự án phù hợp với từ khóa" style={{ padding: '40px 0' }} />
      ) : (
        <Row gutter={[20, 20]}>
          {filteredProjects.map((p) => (
            <Col xs={24} sm={12} lg={8} key={p.id}>
              <Card
                hoverable
                style={{ borderRadius: 12, cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Tag color="blue" style={{ fontWeight: 'bold' }}>{p.key}</Tag>
                  <Space size={4} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Sửa dự án">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEditModal(p)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Xóa dự án"
                      description="Tất cả cột và công việc trong dự án sẽ bị xóa vĩnh viễn. Tiếp tục?"
                      onConfirm={() => handleDeleteProject(p.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </div>
                <Title level={4} style={{ margin: '8px 0' }}>{p.name}</Title>
                <Paragraph type="secondary" ellipsis={{ rows: 2 }}>{p.description || 'Chưa có mô tả'}</Paragraph>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space size={16}>
                    <Text type="secondary"><TeamOutlined /> {p._count.members} thành viên</Text>
                    <Text type="secondary"><CheckSquareOutlined /> {p._count.tasks} công việc</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>Chủ: {p.owner.fullName}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingProject ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên dự án" rules={[{ required: true, message: 'Nhập tên dự án!' }]}>
            <Input placeholder="Ví dụ: Ứng dụng Quản lý Bán hàng" size="large" />
          </Form.Item>
          <Form.Item name="key" label="Mã viết tắt (Key)" rules={[{ required: true, message: 'Nhập mã key!' }]}>
            <Input placeholder="Ví dụ: WEB, APP, ERP" size="large" disabled={!!editingProject} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về dự án..." />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProject(null);
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingProject ? 'Lưu thay đổi' : 'Tạo dự án'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
