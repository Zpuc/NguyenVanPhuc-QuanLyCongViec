import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Avatar,
  Dropdown,
  Drawer,
  Divider,
  List,
  Popconfirm,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CommentOutlined,
  PaperClipOutlined,
  UserOutlined,
  MoreOutlined,
  DeleteOutlined,
  SendOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { projectsApi } from '../../api/projects.api';
import type { ProjectDetail, ColumnItem, TaskItem } from '../../api/projects.api';
import { tasksApi } from '../../api/tasks.api';
import type { TaskDetail } from '../../api/tasks.api';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text, Paragraph } = Typography;

const priorityColors: Record<string, string> = {
  LOW: 'default',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

export const KanbanBoardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const fetchProjectDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await projectsApi.getProjectDetail(id);
      setProject(data);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải chi tiết dự án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const handleOpenCreateTask = (columnId: string) => {
    form.setFieldsValue({ columnId, priority: 'MEDIUM' });
    setIsModalOpen(true);
  };

  const handleCreateTask = async (values: any) => {
    if (!project) return;
    try {
      setSubmitting(true);
      await tasksApi.createTask({
        projectId: project.id,
        columnId: values.columnId,
        title: values.title,
        description: values.description,
        priority: values.priority,
      });
      message.success('Thêm công việc thành công!');
      setIsModalOpen(false);
      form.resetFields();
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Không thể tạo công việc');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (!project) return;

    const sourceColIndex = project.columns.findIndex((col) => col.id === source.droppableId);
    const destColIndex = project.columns.findIndex((col) => col.id === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceCol = project.columns[sourceColIndex];
    const destCol = project.columns[destColIndex];

    const sourceTasks = [...sourceCol.tasks];
    const destTasks = sourceColIndex === destColIndex ? sourceTasks : [...destCol.tasks];

    const [movedTask] = sourceTasks.splice(source.index, 1);
    destTasks.splice(destination.index, 0, movedTask);

    let newPositionOrder = 1000;
    if (destTasks.length === 1) {
      newPositionOrder = 1000;
    } else if (destination.index === 0) {
      newPositionOrder = (destTasks[1]?.positionOrder || 2000) / 2;
    } else if (destination.index === destTasks.length - 1) {
      newPositionOrder = (destTasks[destTasks.length - 2]?.positionOrder || 0) + 1000;
    } else {
      const prevOrder = destTasks[destination.index - 1]?.positionOrder || 0;
      const nextOrder = destTasks[destination.index + 1]?.positionOrder || prevOrder + 2000;
      newPositionOrder = (prevOrder + nextOrder) / 2;
    }

    const newColumns = [...project.columns];
    if (sourceColIndex === destColIndex) {
      newColumns[sourceColIndex] = { ...sourceCol, tasks: destTasks };
    } else {
      newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
      newColumns[destColIndex] = { ...destCol, tasks: destTasks };
    }
    setProject({ ...project, columns: newColumns });

    try {
      await tasksApi.moveTask(draggableId, {
        columnId: destination.droppableId,
        newPositionOrder: Math.round(newPositionOrder),
      });
    } catch (err: any) {
      message.error(err.message || 'Không thể lưu vị trí công việc');
      fetchProjectDetail();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksApi.deleteTask(taskId);
      message.success('Đã xóa công việc');
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
        setTaskDetail(null);
      }
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Xóa công việc thất bại');
    }
  };

  const handleOpenTaskDetail = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setDrawerLoading(true);
    try {
      const data = await tasksApi.getTaskDetail(taskId);
      setTaskDetail(data);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải chi tiết công việc');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedTaskId(null);
    setTaskDetail(null);
    setCommentText('');
  };

  const handleAddComment = async () => {
    if (!taskDetail || !commentText.trim()) return;
    try {
      setCommentSubmitting(true);
      const newComment = await tasksApi.addComment(taskDetail.id, commentText.trim());
      setTaskDetail({
        ...taskDetail,
        comments: [newComment, ...taskDetail.comments],
      });
      setCommentText('');
      message.success('Đã gửi bình luận');
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Không thể gửi bình luận');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!taskDetail) return;
    try {
      await tasksApi.deleteComment(commentId);
      setTaskDetail({
        ...taskDetail,
        comments: taskDetail.comments.filter((c) => c.id !== commentId),
      });
      message.success('Đã xóa bình luận');
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Không thể xóa bình luận');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space size={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
            Danh sách
          </Button>
          <div>
            <Space align="center">
              <Title level={3} style={{ margin: 0 }}>
                {project.name}
              </Title>
              <Tag color="purple" style={{ fontWeight: 'bold' }}>
                {project.key}
              </Tag>
            </Space>
          </div>
        </Space>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          style={{
            display: 'flex',
            gap: 16,
            width: '100%',
            alignItems: 'flex-start',
          }}
        >
          {project.columns.map((column: ColumnItem) => (
            <div
              key={column.id}
              style={{
                flex: 1,
                minWidth: 0,
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 220px)',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #e2e8f0',
                  background: '#ffffff',
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                }}
              >
                <Space>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: column.color || '#3b82f6',
                    }}
                  />
                  <Text strong>{column.title}</Text>
                  <Tag style={{ borderRadius: 10 }}>{column.tasks.length}</Tag>
                </Space>

                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenCreateTask(column.id)}
                />
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      padding: 12,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      flex: 1,
                      minHeight: 60,
                      background: snapshot.isDraggingOver ? '#f1f5f9' : 'transparent',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {column.tasks.map((task: TaskItem, index: number) => {
                      const taskMenuItems: MenuProps['items'] = [
                        {
                          key: 'delete',
                          label: 'Xóa công việc',
                          danger: true,
                          icon: <DeleteOutlined />,
                          onClick: () => handleDeleteTask(task.id),
                        },
                      ];

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                            >
                              <Card
                                size="small"
                                hoverable
                                onClick={() => handleOpenTaskDetail(task.id)}
                                style={{
                                  borderRadius: 8,
                                  boxShadow: dragSnapshot.isDragging
                                    ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                                    : '0 1px 3px rgba(0,0,0,0.06)',
                                  cursor: 'pointer',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                                    {project.key}-{task.taskNumber}
                                  </Text>

                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Dropdown menu={{ items: taskMenuItems }} trigger={['click']}>
                                      <Button type="text" size="small" icon={<MoreOutlined />} />
                                    </Dropdown>
                                  </div>
                                </div>

                                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
                                  {task.title}
                                </Text>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Tag color={priorityColors[task.priority]} style={{ margin: 0 }}>
                                    {priorityLabels[task.priority]}
                                  </Tag>

                                  <Space size={12}>
                                    {task._count.comments > 0 && (
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        <CommentOutlined /> {task._count.comments}
                                      </Text>
                                    )}
                                    {task._count.attachments > 0 && (
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        <PaperClipOutlined /> {task._count.attachments}
                                      </Text>
                                    )}
                                    <Avatar
                                      size={22}
                                      icon={<UserOutlined />}
                                      src={task.assignee?.avatarUrl}
                                      style={{ backgroundColor: '#4f46e5' }}
                                    />
                                  </Space>
                                </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenCreateTask(column.id)}
                      style={{ marginTop: 4 }}
                    >
                      Thêm công việc
                    </Button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <Modal
        title="Thêm công việc mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTask} style={{ marginTop: 16 }}>
          <Form.Item name="columnId" label="Cột trạng thái" rules={[{ required: true }]}>
            <Select>
              {project.columns.map((col) => (
                <Select.Option key={col.id} value={col.id}>
                  {col.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề công việc"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Ví dụ: Thiết kế giao diện trang đăng nhập" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả chi tiết">
            <Input.TextArea rows={3} placeholder="Mô tả các yêu cầu cần làm..." />
          </Form.Item>

          <Form.Item name="priority" label="Độ ưu tiên" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="LOW">Thấp</Select.Option>
              <Select.Option value="MEDIUM">Trung bình</Select.Option>
              <Select.Option value="HIGH">Cao</Select.Option>
              <Select.Option value="URGENT">Khẩn cấp</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo công việc
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Drawer
        title={
          taskDetail ? (
            <Space align="center">
              <Tag color="purple" style={{ fontWeight: 600 }}>
                {project.key}-{taskDetail.taskNumber}
              </Tag>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>Chi tiết công việc</Text>
            </Space>
          ) : (
            'Chi tiết công việc'
          )
        }
        placement="right"
        width={560}
        open={!!selectedTaskId}
        onClose={handleCloseDrawer}
        destroyOnHidden
      >
        {drawerLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : taskDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Title level={4} style={{ marginBottom: 8 }}>
                {taskDetail.title}
              </Title>
              <Space wrap size={[8, 8]}>
                <Tag color={taskDetail.column.color || 'blue'}>{taskDetail.column.title}</Tag>
                <Tag color={priorityColors[taskDetail.priority]}>
                  {priorityLabels[taskDetail.priority]}
                </Tag>
                {taskDetail.dueDate && (
                  <Tag icon={<CalendarOutlined />} color="cyan">
                    Hạn: {new Date(taskDetail.dueDate).toLocaleDateString('vi-VN')}
                  </Tag>
                )}
              </Space>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                rowGap: 12,
                fontSize: 13,
                background: '#f8fafc',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Text type="secondary">Người thực hiện:</Text>
              <div>
                {taskDetail.assignee ? (
                  <Space size={8}>
                    <Avatar
                      size={20}
                      icon={<UserOutlined />}
                      src={taskDetail.assignee.avatarUrl}
                      style={{ backgroundColor: '#4f46e5' }}
                    />
                    <Text strong>{taskDetail.assignee.fullName}</Text>
                  </Space>
                ) : (
                  <Text type="secondary">Chưa phân công</Text>
                )}
              </div>

              <Text type="secondary">Người tạo:</Text>
              <div>
                <Space size={8}>
                  <Avatar size={20} icon={<UserOutlined />} style={{ backgroundColor: '#0ea5e9' }} />
                  <Text>{taskDetail.reporter?.fullName || 'Hệ thống'}</Text>
                </Space>
              </div>

              <Text type="secondary">Ngày tạo:</Text>
              <Text>{new Date(taskDetail.createdAt).toLocaleString('vi-VN')}</Text>
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>
                Mô tả
              </Text>
              <div
                style={{
                  background: '#f8fafc',
                  padding: 12,
                  borderRadius: 8,
                  minHeight: 60,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {taskDetail.description ? (
                  <Paragraph style={{ margin: 0 }}>{taskDetail.description}</Paragraph>
                ) : (
                  <Text type="secondary">Chưa có mô tả chi tiết</Text>
                )}
              </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                Bình luận ({taskDetail.comments.length})
              </Title>

              <div style={{ marginBottom: 16 }}>
                <Input.TextArea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết phản hồi hoặc trao đổi công việc..."
                />
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={commentSubmitting}
                    disabled={!commentText.trim()}
                    onClick={handleAddComment}
                  >
                    Gửi bình luận
                  </Button>
                </div>
              </div>

              <List
                dataSource={taskDetail.comments}
                locale={{ emptyText: 'Chưa có bình luận nào' }}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #f1f5f9',
                      alignItems: 'flex-start',
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<UserOutlined />}
                          src={item.user.avatarUrl}
                          style={{ backgroundColor: '#4f46e5' }}
                        />
                      }
                      title={
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Space size={8}>
                            <Text strong style={{ fontSize: 13 }}>
                              {item.user.fullName}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {new Date(item.createdAt).toLocaleString('vi-VN')}
                            </Text>
                          </Space>

                          {currentUser?.id === item.user.id && (
                            <Popconfirm
                              title="Xóa bình luận"
                              description="Bạn có chắc chắn muốn xóa bình luận này?"
                              onConfirm={() => handleDeleteComment(item.id)}
                              okText="Xóa"
                              cancelText="Hủy"
                            >
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                              />
                            </Popconfirm>
                          )}
                        </div>
                      }
                      description={
                        <div
                          style={{
                            marginTop: 4,
                            color: '#334155',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {item.content}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};
