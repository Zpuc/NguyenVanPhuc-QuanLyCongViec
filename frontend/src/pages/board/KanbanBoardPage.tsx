import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
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
  DatePicker,
  message,
  Spin,
  Avatar,
  Dropdown,
  Drawer,
  Divider,
  List,
  Popconfirm,
  Tooltip,
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
  TeamOutlined,
  UserAddOutlined,
  CrownOutlined,
  FilterOutlined,
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

const roleLabels: Record<string, { label: string; color: string }> = {
  OWNER: { label: 'Chủ dự án', color: 'gold' },
  ADMIN: { label: 'Quản trị viên', color: 'blue' },
  MEMBER: { label: 'Thành viên', color: 'green' },
  VIEWER: { label: 'Chỉ xem', color: 'default' },
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

  const [isMembersDrawerOpen, setIsMembersDrawerOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');

  const [filterSearch, setFilterSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterOnlyMyTasks, setFilterOnlyMyTasks] = useState(false);

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
    form.setFieldsValue({ columnId, priority: 'MEDIUM', assigneeId: currentUser?.id });
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
        assigneeId: values.assigneeId,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
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

  const handleUpdateDueDate = async (date: dayjs.Dayjs | null) => {
    if (!taskDetail) return;
    try {
      const newDueDate = date ? date.toISOString() : undefined;
      await tasksApi.updateTask(taskDetail.id, { dueDate: newDueDate });
      setTaskDetail({ ...taskDetail, dueDate: newDueDate });
      message.success('Đã cập nhật hạn chót');
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Cập nhật hạn chót thất bại');
    }
  };

  const handleInviteMember = async () => {
    if (!project) return;
    if (!inviteEmail.trim()) {
      message.warning('Vui lòng nhập email của thành viên!');
      return;
    }
    try {
      setInviting(true);
      await projectsApi.addMember(project.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      message.success('Đã thêm thành viên vào dự án');
      setInviteEmail('');
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Không thể thêm thành viên');
    } finally {
      setInviting(false);
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

  const currentMember = project.members.find((m) => m.user.id === currentUser?.id);
  const isOwner = currentMember?.role === 'OWNER';
  const isOwnerOrAdmin = isOwner || currentMember?.role === 'ADMIN';

  const ownerMembers = project.members.filter((m) => m.role === 'OWNER');
  const invitedMembers = project.members.filter((m) => m.role !== 'OWNER');

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isOwner ? '/projects' : '/team-projects');
    }
  };

  const isFiltered = Boolean(filterSearch.trim() || filterPriority !== 'ALL' || filterOnlyMyTasks);

  const getFilteredTasks = (tasks: TaskItem[]) => {
    return tasks.filter((task) => {
      if (filterOnlyMyTasks) {
        if (task.assignee) {
          if (task.assignee.id !== currentUser?.id) {
            return false;
          }
        } else {
          if (!isOwner && task.reporterId !== currentUser?.id) {
            return false;
          }
        }
      }
      if (filterPriority !== 'ALL' && task.priority !== filterPriority) {
        return false;
      }
      if (filterSearch.trim()) {
        const q = filterSearch.trim().toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesKey = `${project.key}-${task.taskNumber}`.toLowerCase().includes(q);
        const matchesAssignee = task.assignee?.fullName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesKey && !matchesAssignee) {
          return false;
        }
      }
      return true;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space size={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Quay lại
          </Button>
          <Space align="center">
            <Title level={3} style={{ margin: 0 }}>
              {project.name}
            </Title>
            <Tag color="purple" style={{ fontWeight: 'bold' }}>
              {project.key}
            </Tag>
          </Space>
        </Space>

        <Space size={12}>
          <Avatar.Group max={{ count: 4, style: { color: '#f56a00', backgroundColor: '#fde3cf' } }}>
            {project.members.map((m) => (
              <Tooltip key={m.id} title={`${m.user.fullName} (${roleLabels[m.role]?.label || m.role})`}>
                <Avatar
                  src={m.user.avatarUrl}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: m.role === 'OWNER' ? '#eab308' : '#4f46e5' }}
                />
              </Tooltip>
            ))}
          </Avatar.Group>

          <Button
            icon={<TeamOutlined />}
            onClick={() => setIsMembersDrawerOpen(true)}
          >
            Thành viên ({project.members.length})
          </Button>
        </Space>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
          padding: '10px 16px',
          background: '#ffffff',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
        }}
      >
        <Space size={12} wrap align="center">
          <Input.Search
            placeholder="Tìm theo tên việc hoặc mã..."
            allowClear
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            style={{ width: 240 }}
          />

          <Select
            value={filterPriority}
            onChange={(val) => setFilterPriority(val)}
            style={{ width: 170 }}
            options={[
              { value: 'ALL', label: 'Tất cả mức ưu tiên' },
              { value: 'URGENT', label: 'Khẩn cấp (Urgent)' },
              { value: 'HIGH', label: 'Cao (High)' },
              { value: 'MEDIUM', label: 'Trung bình (Medium)' },
              { value: 'LOW', label: 'Thấp (Low)' },
            ]}
          />

          <Button
            type={filterOnlyMyTasks ? 'primary' : 'default'}
            icon={<UserOutlined />}
            onClick={() => setFilterOnlyMyTasks(!filterOnlyMyTasks)}
          >
            Chỉ việc của tôi
          </Button>

          {isFiltered && (
            <Button
              type="link"
              onClick={() => {
                setFilterSearch('');
                setFilterPriority('ALL');
                setFilterOnlyMyTasks(false);
              }}
              style={{ padding: 0 }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Space>

        {isFiltered && (
          <Tag color="blue" icon={<FilterOutlined />}>
            Đang lọc kết quả
          </Tag>
        )}
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
          {project.columns.map((column: ColumnItem) => {
            const displayTasks = getFilteredTasks(column.tasks);
            return (
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
                  maxHeight: 'calc(100vh - 270px)',
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
                    <Tag style={{ borderRadius: 10 }}>
                      {displayTasks.length === column.tasks.length
                        ? column.tasks.length
                        : `${displayTasks.length}/${column.tasks.length}`}
                    </Tag>
                  </Space>

                  {isOwnerOrAdmin && (
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenCreateTask(column.id)}
                    />
                  )}
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
                      {displayTasks.length === 0 && column.tasks.length > 0 && (
                        <div style={{ textAlign: 'center', padding: '24px 8px', color: '#94a3b8', fontSize: 13 }}>
                          Không có thẻ phù hợp
                        </div>
                      )}
                      {displayTasks.map((task: TaskItem, index: number) => {
                        const canDrag = !isFiltered && (isOwnerOrAdmin || task.assignee?.id === currentUser?.id);
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
                        <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canDrag}>
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
                                  cursor: canDrag ? 'grab' : 'pointer',
                                  opacity: canDrag ? 1 : 0.88,
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

                                {task.dueDate && (
                                  <div style={{ marginBottom: 8 }}>
                                    <Tag icon={<CalendarOutlined />} color="default" style={{ fontSize: 11 }}>
                                      {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                    </Tag>
                                  </div>
                                )}

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

                    {isOwnerOrAdmin && (
                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenCreateTask(column.id)}
                        style={{ marginTop: 4 }}
                      >
                        Thêm công việc
                      </Button>
                    )}
                  </div>
                )}
              </Droppable>
              </div>
            );
          })}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="priority" label="Độ ưu tiên" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="LOW">Thấp</Select.Option>
                <Select.Option value="MEDIUM">Trung bình</Select.Option>
                <Select.Option value="HIGH">Cao</Select.Option>
                <Select.Option value="URGENT">Khẩn cấp</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="dueDate" label="Hạn chót">
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Chọn ngày hết hạn"
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </div>

          <Form.Item name="assigneeId" label="Người thực hiện">
            <Select placeholder="Chọn thành viên thực hiện (không bắt buộc)" allowClear>
              {project.members.map((m) => (
                <Select.Option key={m.user.id} value={m.user.id}>
                  <Space>
                    <Avatar size={18} icon={<UserOutlined />} src={m.user.avatarUrl} />
                    <span>{m.user.fullName}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 8 }}>
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
                gridTemplateColumns: '130px 1fr',
                rowGap: 14,
                alignItems: 'center',
                fontSize: 13,
                background: '#f8fafc',
                padding: 14,
                borderRadius: 8,
              }}
            >
              <Text type="secondary">Cột trạng thái:</Text>
              <div>
                <Tag color={taskDetail.column.color || 'blue'} style={{ margin: 0 }}>
                  {taskDetail.column.title}
                </Tag>
              </div>

              <Text type="secondary">Mức độ ưu tiên:</Text>
              <div>
                <Tag color={priorityColors[taskDetail.priority]} style={{ margin: 0 }}>
                  {priorityLabels[taskDetail.priority]}
                </Tag>
              </div>

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

              <Text type="secondary">Hạn chót:</Text>
              <div>
                <DatePicker
                  allowClear
                  placeholder="Chọn hạn chót"
                  format="DD/MM/YYYY"
                  value={taskDetail.dueDate ? dayjs(taskDetail.dueDate) : null}
                  onChange={handleUpdateDueDate}
                  style={{ width: 180 }}
                  size="small"
                />
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

      <Drawer
        title={
          <Space>
            <Tag color="purple">{project.key}</Tag>
            <Text strong style={{ fontSize: 16 }}>Thành viên dự án</Text>
          </Space>
        }
        placement="right"
        width={460}
        open={isMembersDrawerOpen}
        onClose={() => setIsMembersDrawerOpen(false)}
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <Space align="center" style={{ marginBottom: 10 }}>
              <CrownOutlined style={{ color: '#eab308', fontSize: 16 }} />
              <Text strong style={{ fontSize: 14 }}>
                Chủ dự án (Owner)
              </Text>
            </Space>

            {ownerMembers.map((owner) => (
              <div
                key={owner.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  borderRadius: 8,
                }}
              >
                <Space size={12}>
                  <Avatar
                    size={38}
                    icon={<UserOutlined />}
                    src={owner.user.avatarUrl}
                    style={{ backgroundColor: '#eab308' }}
                  />
                  <div>
                    <Text strong style={{ display: 'block', fontSize: 14 }}>
                      {owner.user.fullName}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {owner.user.email}
                    </Text>
                  </div>
                </Space>
                <Tag color="gold" style={{ fontWeight: 600 }}>
                  Chủ dự án
                </Tag>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text strong style={{ fontSize: 14 }}>
                Thành viên tham gia ({invitedMembers.length})
              </Text>
            </div>

            {invitedMembers.length === 0 ? (
              <div
                style={{
                  padding: '24px 0',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 8,
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                Chưa có thành viên nào khác trong dự án
              </div>
            ) : (
              <List
                dataSource={invitedMembers}
                renderItem={(member) => {
                  const roleInfo = roleLabels[member.role] || { label: member.role, color: 'default' };

                  return (
                    <List.Item
                      key={member.id}
                      style={{
                        padding: '10px 12px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        marginBottom: 8,
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={34}
                            icon={<UserOutlined />}
                            src={member.user.avatarUrl}
                            style={{ backgroundColor: '#4f46e5' }}
                          />
                        }
                        title={
                          <Text strong style={{ fontSize: 13 }}>
                            {member.user.fullName}
                          </Text>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {member.user.email}
                          </Text>
                        }
                      />

                      <Space size={8}>
                        {isOwner ? (
                          <Select
                            size="small"
                            value={member.role as 'ADMIN' | 'MEMBER' | 'VIEWER'}
                            style={{ width: 130 }}
                            onChange={async (newRole: 'ADMIN' | 'MEMBER' | 'VIEWER') => {
                              try {
                                await projectsApi.updateMemberRole(project.id, member.user.id, newRole);
                                message.success('Đã cập nhật vai trò');
                                fetchProjectDetail();
                              } catch (err: any) {
                                message.error(err.message || 'Cập nhật vai trò thất bại');
                              }
                            }}
                          >
                            <Select.Option value="ADMIN">Quản trị viên</Select.Option>
                            <Select.Option value="MEMBER">Thành viên</Select.Option>
                            <Select.Option value="VIEWER">Chỉ xem</Select.Option>
                          </Select>
                        ) : (
                          <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
                        )}

                        {isOwner && (
                          <Popconfirm
                            title="Xóa thành viên"
                            description={`Bạn có chắc muốn xóa ${member.user.fullName} khỏi dự án?`}
                            onConfirm={async () => {
                              try {
                                await projectsApi.removeMember(project.id, member.user.id);
                                message.success('Đã xóa thành viên khỏi dự án');
                                fetchProjectDetail();
                              } catch (err: any) {
                                message.error(err.message || 'Xóa thành viên thất bại');
                              }
                            }}
                            okText="Xóa"
                            cancelText="Hủy"
                          >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        )}
                      </Space>
                    </List.Item>
                  );
                }}
              />
            )}
          </div>

          {isOwnerOrAdmin && (
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                Mời thành viên mới vào dự án
              </Text>
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                <Input
                  placeholder="Nhập email tài khoản cần mời..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onPressEnter={handleInviteMember}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Select
                    value={inviteRole}
                    onChange={(val) => setInviteRole(val)}
                    style={{ width: 140 }}
                  >
                    <Select.Option value="MEMBER">Thành viên</Select.Option>
                    <Select.Option value="ADMIN">Quản trị viên</Select.Option>
                    <Select.Option value="VIEWER">Chỉ xem</Select.Option>
                  </Select>
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    loading={inviting}
                    onClick={handleInviteMember}
                    style={{ flex: 1 }}
                  >
                    Mời vào dự án
                  </Button>
                </div>
              </Space>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};
