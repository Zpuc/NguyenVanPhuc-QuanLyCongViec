import React, { useEffect, useState, useMemo } from 'react';
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
  Upload,
  Image,
  Tabs,
  Timeline,
  Empty,
  Table,
  Segmented,
  Checkbox,
  Progress,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
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
  EditOutlined,
  UploadOutlined,
  FileOutlined,
  FileImageOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TableOutlined,
  EyeOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { projectsApi } from '../../api/projects.api';
import type { ProjectDetail, ColumnItem, TaskItem } from '../../api/projects.api';
import { tasksApi } from '../../api/tasks.api';
import type { TaskDetail, UpdateTaskDto, ActivityLogItem } from '../../api/tasks.api';
import { formatAvatarUrl } from '../../api/auth.api';
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

const columnColors = [
  '#64748b',
  '#3b82f6',
  '#f59e0b',
  '#22c55e',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#06b6d4',
];

interface TableTaskRow extends TaskItem {
  columnId: string;
  columnTitle: string;
  columnColor?: string;
}

export const KanbanBoardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [addingChecklist, setAddingChecklist] = useState(false);

  const [isMembersDrawerOpen, setIsMembersDrawerOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');

  const [filterSearch, setFilterSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterOnlyMyTasks, setFilterOnlyMyTasks] = useState(false);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnItem | null>(null);
  const [columnTitleInput, setColumnTitleInput] = useState('');
  const [columnColorInput, setColumnColorInput] = useState('#64748b');
  const [savingColumn, setSavingColumn] = useState(false);

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setEditingDescription(false);
    try {
      const data = await tasksApi.getTaskDetail(taskId);
      setTaskDetail(data);
      setDescriptionDraft(data.description || '');
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
    setEditingDescription(false);
    setEditingCommentId(null);
    setEditingCommentText('');
    setNewChecklistTitle('');
  };

  const handleStartEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim() || !taskDetail) return;
    try {
      setSavingComment(true);
      const updated = await tasksApi.updateComment(commentId, editingCommentText.trim());
      setTaskDetail({
        ...taskDetail,
        comments: taskDetail.comments.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c)),
      });
      setEditingCommentId(null);
      setEditingCommentText('');
      message.success('Đã cập nhật bình luận');
    } catch (err: any) {
      message.error(err.message || 'Không thể cập nhật bình luận');
    } finally {
      setSavingComment(false);
    }
  };

  const handleAddComment = async () => {
    if (!taskDetail || !commentText.trim()) return;
    try {
      setCommentSubmitting(true);
      await tasksApi.addComment(taskDetail.id, commentText.trim());
      setCommentText('');
      message.success('Đã gửi bình luận');
      const refreshed = await tasksApi.getTaskDetail(taskDetail.id);
      setTaskDetail(refreshed);
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

  const handleUpdateTaskField = async (payload: UpdateTaskDto, successMessage: string) => {
    if (!taskDetail) return;
    try {
      setSavingTask(true);
      await tasksApi.updateTask(taskDetail.id, payload);
      message.success(successMessage);
      const refreshed = await tasksApi.getTaskDetail(taskDetail.id);
      setTaskDetail(refreshed);
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Cập nhật công việc thất bại');
    } finally {
      setSavingTask(false);
    }
  };

  const handleUpdateDueDate = async (date: dayjs.Dayjs | null) => {
    const newDueDate = date ? date.toISOString() : null;
    await handleUpdateTaskField({ dueDate: newDueDate }, 'Đã cập nhật hạn chót');
  };

  const handleUploadAttachment = async (file: File) => {
    if (!taskDetail) return;
    try {
      setUploadingFile(true);
      await tasksApi.uploadAttachment(taskDetail.id, file);
      message.success('Tải lên tệp đính kèm thành công');
      const refreshed = await tasksApi.getTaskDetail(taskDetail.id);
      setTaskDetail(refreshed);
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Tải lên tệp thất bại');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!taskDetail) return;
    try {
      await tasksApi.deleteAttachment(attachmentId);
      setTaskDetail({
        ...taskDetail,
        attachments: taskDetail.attachments.filter((a) => a.id !== attachmentId),
      });
      message.success('Đã xóa tệp đính kèm');
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Xóa tệp đính kèm thất bại');
    }
  };

  const handleCreateChecklist = async () => {
    if (!taskDetail || !newChecklistTitle.trim()) return;
    try {
      setAddingChecklist(true);
      const created = await tasksApi.createChecklist(taskDetail.id, newChecklistTitle.trim());
      setTaskDetail({
        ...taskDetail,
        checklists: [...(taskDetail.checklists || []), created],
      });
      setNewChecklistTitle('');
      message.success('Đã thêm việc cần làm');
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Không thể thêm việc cần làm');
    } finally {
      setAddingChecklist(false);
    }
  };

  const handleToggleChecklist = async (checklistId: string, isCompleted: boolean) => {
    if (!taskDetail) return;
    try {
      const updated = await tasksApi.updateChecklist(checklistId, { isCompleted });
      setTaskDetail({
        ...taskDetail,
        checklists: (taskDetail.checklists || []).map((c) => (c.id === checklistId ? updated : c)),
      });
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Không thể cập nhật việc cần làm');
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!taskDetail) return;
    try {
      await tasksApi.deleteChecklist(checklistId);
      setTaskDetail({
        ...taskDetail,
        checklists: (taskDetail.checklists || []).filter((c) => c.id !== checklistId),
      });
      message.success('Đã xóa việc cần làm');
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Không thể xóa việc cần làm');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatActivityText = (log: ActivityLogItem) => {
    switch (log.action) {
      case 'CREATED_TASK':
        return 'đã tạo công việc này';
      case 'MOVED_COLUMN': {
        const oldTitle =
          log.oldValue?.columnTitle ||
          project?.columns.find((c) => c.id === log.oldValue?.columnId)?.title ||
          'cột cũ';
        const newTitle =
          log.newValue?.columnTitle ||
          project?.columns.find((c) => c.id === log.newValue?.columnId)?.title ||
          'cột mới';
        return `đã chuyển trạng thái từ "${oldTitle}" sang "${newTitle}"`;
      }
      case 'ATTACHED_FILE':
        return `đã đính kèm tệp "${log.newValue?.fileName || 'tài liệu'}"`;
      case 'COMMENTED':
        return 'đã thêm một bình luận';
      case 'UPDATED_TASK': {
        const fields = Array.isArray(log.newValue?.fields) ? log.newValue.fields.join(', ') : 'thông tin';
        return `đã cập nhật ${fields}`;
      }
      default:
        return log.action;
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

  const handleOpenCreateColumn = () => {
    setEditingColumn(null);
    setColumnTitleInput('');
    setColumnColorInput('#64748b');
    setIsColumnModalOpen(true);
  };

  const handleOpenEditColumn = (column: ColumnItem) => {
    setEditingColumn(column);
    setColumnTitleInput(column.title);
    setColumnColorInput(column.color || '#64748b');
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = async () => {
    if (!project) return;
    if (!columnTitleInput.trim()) {
      message.warning('Vui lòng nhập tên cột');
      return;
    }
    try {
      setSavingColumn(true);
      if (editingColumn) {
        await projectsApi.updateColumn(project.id, editingColumn.id, {
          title: columnTitleInput.trim(),
          color: columnColorInput,
        });
        message.success('Đã cập nhật cột trạng thái');
      } else {
        await projectsApi.createColumn(project.id, {
          title: columnTitleInput.trim(),
          color: columnColorInput,
        });
        message.success('Đã thêm cột trạng thái mới');
      }
      setIsColumnModalOpen(false);
      fetchProjectDetail();
    } catch (err: any) {
      message.error(err.message || 'Không thể lưu cột trạng thái');
    } finally {
      setSavingColumn(false);
    }
  };

  const handleDeleteColumn = (column: ColumnItem) => {
    if (!project) return;
    if (project.columns.length <= 1) {
      message.warning('Dự án phải giữ lại ít nhất 1 cột trạng thái');
      return;
    }
    if (column.tasks.length > 0) {
      message.warning('Vui lòng di chuyển hết công việc sang cột khác trước khi xóa cột này');
      return;
    }

    Modal.confirm({
      title: `Xóa cột "${column.title}"?`,
      content: 'Thao tác này sẽ xóa cột trạng thái khỏi bảng Kanban.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await projectsApi.deleteColumn(project.id, column.id);
          message.success('Đã xóa cột trạng thái');
          fetchProjectDetail();
        } catch (err: any) {
          message.error(err.message || 'Không thể xóa cột trạng thái');
        }
      },
    });
  };

  const currentMember = project?.members.find((m) => m.user.id === currentUser?.id);
  const isOwner = currentMember?.role === 'OWNER';
  const isOwnerOrAdmin = isOwner || currentMember?.role === 'ADMIN';
  const canEditTask = currentMember?.role !== 'VIEWER';

  const ownerMembers = project?.members.filter((m) => m.role === 'OWNER') || [];
  const invitedMembers = project?.members.filter((m) => m.role !== 'OWNER') || [];

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
        const matchesKey = project ? `${project.key}-${task.taskNumber}`.toLowerCase().includes(q) : false;
        const matchesAssignee = task.assignee?.fullName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesKey && !matchesAssignee) {
          return false;
        }
      }
      return true;
    });
  };

  const allProjectTasks = useMemo(() => {
    if (!project) return [];
    const rows: TableTaskRow[] = [];
    project.columns.forEach((col) => {
      col.tasks.forEach((t) => {
        rows.push({
          ...t,
          columnId: col.id,
          columnTitle: col.title,
          columnColor: col.color,
        });
      });
    });
    return rows;
  }, [project]);

  const filteredTableTasks = useMemo(() => {
    return getFilteredTasks(allProjectTasks as any) as TableTaskRow[];
  }, [allProjectTasks, filterSearch, filterPriority, filterOnlyMyTasks]);

  const tableColumns: TableColumnsType<TableTaskRow> = useMemo(() => {
    if (!project) return [];
    return [
      {
        title: 'Mã & Tên công việc',
        dataIndex: 'title',
        key: 'title',
        sorter: (a, b) => a.taskNumber - b.taskNumber,
        render: (title: string, record: TableTaskRow) => {
          const code = `${project.key}-${record.taskNumber}`;
          return (
            <Space direction="vertical" size={2}>
              <Space size={8} wrap>
                <Tag color="purple" style={{ fontWeight: 600, margin: 0 }}>
                  {code}
                </Tag>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                  {title}
                </Text>
              </Space>
              {record.description && (
                <Text
                  type="secondary"
                  ellipsis={{ tooltip: record.description }}
                  style={{ margin: 0, fontSize: 12, maxWidth: 360, display: 'block' }}
                >
                  {record.description}
                </Text>
              )}
            </Space>
          );
        },
      },
      {
        title: 'Trạng thái',
        dataIndex: 'columnTitle',
        key: 'columnTitle',
        filters: project.columns.map((c) => ({ text: c.title, value: c.id })),
        onFilter: (value, record) => record.columnId === value,
        render: (_, record: TableTaskRow) => (
          <Tag
            style={{
              fontWeight: 600,
              borderRadius: 4,
              background: '#f8fafc',
              borderColor: record.columnColor || '#cbd5e1',
              color: record.columnColor || '#475569',
            }}
          >
            {record.columnTitle}
          </Tag>
        ),
      },
      {
        title: 'Mức ưu tiên',
        dataIndex: 'priority',
        key: 'priority',
        filters: [
          { text: 'Khẩn cấp', value: 'URGENT' },
          { text: 'Cao', value: 'HIGH' },
          { text: 'Trung bình', value: 'MEDIUM' },
          { text: 'Thấp', value: 'LOW' },
        ],
        onFilter: (value, record) => record.priority === value,
        sorter: (a, b) => {
          const weight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (weight[a.priority] || 0) - (weight[b.priority] || 0);
        },
        render: (priority: string) => {
          const label = priorityLabels[priority] || priority;
          const color = priorityColors[priority] || 'default';
          return <Tag color={color}>{label}</Tag>;
        },
      },
      {
        title: 'Người thực hiện',
        dataIndex: 'assignee',
        key: 'assignee',
        filters: [
          { text: 'Chưa phân công', value: 'UNASSIGNED' },
          ...project.members.map((m) => ({ text: m.user.fullName, value: m.user.id })),
        ],
        onFilter: (value, record) => {
          if (value === 'UNASSIGNED') return !record.assignee;
          return record.assignee?.id === value;
        },
        render: (_, record: TableTaskRow) => {
          if (!record.assignee) {
            return <Tag style={{ color: '#94a3b8' }}>Chưa phân công</Tag>;
          }
          return (
            <Space size={8}>
              <Avatar
                size={24}
                icon={<UserOutlined />}
                src={formatAvatarUrl(record.assignee.avatarUrl)}
                style={{ backgroundColor: '#4f46e5' }}
              />
              <span style={{ fontSize: 13 }}>{record.assignee.fullName}</span>
            </Space>
          );
        },
      },
      {
        title: 'Hạn chót',
        dataIndex: 'dueDate',
        key: 'dueDate',
        sorter: (a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        },
        render: (dueDate: string | undefined, record: TableTaskRow) => {
          if (!dueDate) {
            return <Text type="secondary" style={{ fontSize: 12 }}>Chưa đặt</Text>;
          }
          const due = new Date(dueDate);
          const lower = record.columnTitle.toLowerCase();
          const isDone = lower.includes('done') || lower.includes('hoàn thành') || lower.includes('xong');
          const isOverdue = !isDone && due.getTime() < Date.now();
          return (
            <Space size={4} style={{ color: isOverdue ? '#ef4444' : '#64748b', fontWeight: isOverdue ? 600 : 400 }}>
              <CalendarOutlined />
              <span style={{ fontSize: 13 }}>{due.toLocaleDateString('vi-VN')}</span>
              {isOverdue && <Tag color="red" style={{ fontSize: 10, margin: 0 }}>Quá hạn</Tag>}
            </Space>
          );
        },
      },
      {
        title: 'Tương tác',
        key: 'interactions',
        width: 130,
        render: (_, record: TableTaskRow) => {
          const totalSub = record.checklists?.length || 0;
          const doneSub = record.checklists?.filter((c) => c.isCompleted).length || 0;
          return (
            <Space size={10} style={{ color: '#64748b', fontSize: 12 }}>
              {totalSub > 0 && (
                <Space size={4} style={{ color: doneSub === totalSub ? '#10b981' : '#4f46e5', fontWeight: 500 }}>
                  <CheckSquareOutlined />
                  <span>{doneSub}/{totalSub}</span>
                </Space>
              )}
              <Space size={4}>
                <CommentOutlined />
                <span>{record._count?.comments || 0}</span>
              </Space>
              <Space size={4}>
                <PaperClipOutlined />
                <span>{record._count?.attachments || 0}</span>
              </Space>
            </Space>
          );
        },
      },
      {
        title: '',
        key: 'actions',
        width: 90,
        render: (_, record: TableTaskRow) => (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenTaskDetail(record.id);
            }}
          >
            Chi tiết
          </Button>
        ),
      },
    ];
  }, [project]);

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? 12 : 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space size={isMobile ? 8 : 16} wrap align="center">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Quay lại
          </Button>
          <Space align="center">
            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              {project.name}
            </Title>
            <Tag color="purple" style={{ fontWeight: 'bold' }}>
              {project.key}
            </Tag>
          </Space>
        </Space>

        <Space size={isMobile ? 8 : 12} wrap align="center">
          <Avatar.Group max={{ count: isMobile ? 2 : 4, style: { color: '#f56a00', backgroundColor: '#fde3cf' } }}>
            {project.members.map((m) => (
              <Tooltip key={m.id} title={`${m.user.fullName} (${roleLabels[m.role]?.label || m.role})`}>
                <Avatar
                  src={formatAvatarUrl(m.user.avatarUrl)}
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

          {isOwnerOrAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateColumn}
            >
              Thêm cột
            </Button>
          )}
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
        <Space size={12} wrap align="center" style={isMobile ? { width: '100%' } : undefined}>
          <Input.Search
            placeholder="Tìm theo tên việc hoặc mã..."
            allowClear
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            style={{ width: isMobile ? '100%' : 240 }}
          />

          <Select
            value={filterPriority}
            onChange={(val) => setFilterPriority(val)}
            style={{ width: isMobile ? '100%' : 170 }}
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
            style={isMobile ? { width: '100%' } : undefined}
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

        <Space size={12} align="center" style={isMobile ? { width: '100%', justifyContent: 'space-between' } : undefined}>
          {isFiltered && (
            <Tag color="blue" icon={<FilterOutlined />} style={{ margin: 0 }}>
              Đang lọc kết quả
            </Tag>
          )}

          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'kanban' | 'table')}
            options={[
              { label: 'Bảng Kanban', value: 'kanban', icon: <AppstoreOutlined /> },
              { label: 'Dạng bảng', value: 'table', icon: <TableOutlined /> },
            ]}
          />
        </Space>
      </div>

      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
        <div
          style={{
            display: 'flex',
            gap: 16,
            width: '100%',
            alignItems: 'flex-start',
            overflowX: 'auto',
            paddingBottom: 12,
          }}
        >
          {project.columns.map((column: ColumnItem) => {
            const displayTasks = getFilteredTasks(column.tasks);
            const columnMenuItems: MenuProps['items'] = [
              {
                key: 'edit',
                label: 'Chỉnh sửa cột',
                icon: <EditOutlined />,
                onClick: () => handleOpenEditColumn(column),
              },
              {
                key: 'delete',
                label: 'Xóa cột',
                danger: true,
                icon: <DeleteOutlined />,
                onClick: () => handleDeleteColumn(column),
              },
            ];

            return (
              <div
                key={column.id}
                style={{
                  flex: '1 0 230px',
                  minWidth: 230,
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
                    gap: 8,
                    borderBottom: '1px solid #e2e8f0',
                    background: '#ffffff',
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: column.color || '#3b82f6',
                      }}
                    />
                    <Text strong ellipsis={{ tooltip: column.title }}>
                      {column.title}
                    </Text>
                    <Tag style={{ borderRadius: 10, marginInlineEnd: 0, flexShrink: 0 }}>
                      {displayTasks.length === column.tasks.length
                        ? column.tasks.length
                        : `${displayTasks.length}/${column.tasks.length}`}
                    </Tag>
                  </div>

                  {isOwnerOrAdmin && (
                    <Space size={2} style={{ flexShrink: 0 }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenCreateTask(column.id)}
                      />
                      <Dropdown menu={{ items: columnMenuItems }} trigger={['click']}>
                        <Button type="text" size="small" icon={<MoreOutlined />} />
                      </Dropdown>
                    </Space>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <Tag
                                    bordered={false}
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      background: '#f1f5f9',
                                      color: '#475569',
                                      borderRadius: 4,
                                      margin: 0,
                                      padding: '1px 6px',
                                      lineHeight: '18px',
                                    }}
                                  >
                                    {project.key}-{task.taskNumber}
                                  </Tag>

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

                                {task.checklists && task.checklists.length > 0 && (() => {
                                  const total = task.checklists.length;
                                  const completed = task.checklists.filter((c) => c.isCompleted).length;
                                  const percent = Math.round((completed / total) * 100);
                                  const allDone = completed === total;
                                  return (
                                    <div style={{ marginBottom: 8 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 2 }}>
                                        <Space size={4} style={{ color: allDone ? '#10b981' : '#64748b' }}>
                                          <CheckSquareOutlined />
                                          <span>{completed}/{total} việc con</span>
                                        </Space>
                                        <Text type="secondary" style={{ fontSize: 10 }}>{percent}%</Text>
                                      </div>
                                      <Progress percent={percent} size="small" showInfo={false} strokeColor={allDone ? '#10b981' : '#4f46e5'} style={{ margin: 0 }} />
                                    </div>
                                  );
                                })()}

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
                                      src={formatAvatarUrl(task.assignee?.avatarUrl)}
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
      ) : (
        <Card
          variant="borderless"
          style={{ borderRadius: 10, background: '#ffffff', overflow: 'hidden' }}
          styles={{ body: { padding: 0 } }}
        >
          <Table<TableTaskRow>
            rowKey="id"
            columns={tableColumns}
            dataSource={filteredTableTasks}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `Tổng cộng ${total} công việc`,
            }}
            onRow={(record) => ({
              onClick: () => handleOpenTaskDetail(record.id),
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: 850 }}
            locale={{
              emptyText: (
                <Empty
                  description={isFiltered ? 'Không có công việc nào khớp với bộ lọc' : 'Dự án chưa có công việc nào'}
                  style={{ padding: '32px 0' }}
                />
              ),
            }}
          />
        </Card>
      )}

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
                    <Avatar size={18} icon={<UserOutlined />} src={formatAvatarUrl(m.user.avatarUrl)} />
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
        width={isMobile ? '100%' : 560}
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
              <Title
                level={4}
                style={{ marginBottom: 8 }}
                editable={
                  canEditTask
                    ? {
                        onChange: (newTitle) => {
                          const trimmed = newTitle.trim();
                          if (trimmed && trimmed !== taskDetail.title) {
                            handleUpdateTaskField({ title: trimmed }, 'Đã cập nhật tiêu đề công việc');
                          }
                        },
                      }
                    : false
                }
              >
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
                <Select
                  size="small"
                  value={taskDetail.priority}
                  disabled={!canEditTask || savingTask}
                  style={{ width: 180 }}
                  onChange={(value) => handleUpdateTaskField({ priority: value }, 'Đã cập nhật mức độ ưu tiên')}
                >
                  <Select.Option value="LOW">Thấp</Select.Option>
                  <Select.Option value="MEDIUM">Trung bình</Select.Option>
                  <Select.Option value="HIGH">Cao</Select.Option>
                  <Select.Option value="URGENT">Khẩn cấp</Select.Option>
                </Select>
              </div>

              <Text type="secondary">Người thực hiện:</Text>
              <div>
                <Select
                  size="small"
                  allowClear
                  placeholder="Chưa phân công"
                  value={taskDetail.assignee?.id}
                  disabled={!canEditTask || savingTask}
                  style={{ width: 220 }}
                  onChange={(value) =>
                    handleUpdateTaskField({ assigneeId: value || null }, 'Đã cập nhật người thực hiện')
                  }
                >
                  {project.members.map((m) => (
                    <Select.Option key={m.user.id} value={m.user.id}>
                      <Space size={6}>
                        <Avatar size={16} icon={<UserOutlined />} src={formatAvatarUrl(m.user.avatarUrl)} />
                        <span>{m.user.fullName}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <Text type="secondary">Hạn chót:</Text>
              <div>
                <DatePicker
                  allowClear
                  placeholder="Chọn hạn chót"
                  format="DD/MM/YYYY"
                  value={taskDetail.dueDate ? dayjs(taskDetail.dueDate) : null}
                  onChange={handleUpdateDueDate}
                  disabled={!canEditTask || savingTask}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text strong>Mô tả</Text>
                {canEditTask && !editingDescription && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setDescriptionDraft(taskDetail.description || '');
                      setEditingDescription(true);
                    }}
                  >
                    Sửa
                  </Button>
                )}
              </div>

              {editingDescription ? (
                <div>
                  <Input.TextArea
                    rows={4}
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    placeholder="Nhập mô tả chi tiết công việc..."
                  />
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <Space>
                      <Button size="small" onClick={() => setEditingDescription(false)}>
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        loading={savingTask}
                        onClick={async () => {
                          await handleUpdateTaskField({ description: descriptionDraft }, 'Đã cập nhật mô tả');
                          setEditingDescription(false);
                        }}
                      >
                        Lưu
                      </Button>
                    </Space>
                  </div>
                </div>
              ) : (
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
              )}
            </div>

            <Divider style={{ margin: '4px 0' }} />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Space size={8}>
                  <CheckSquareOutlined style={{ color: '#4f46e5' }} />
                  <Title level={5} style={{ margin: 0 }}>
                    Việc cần làm ({taskDetail.checklists?.filter((c) => c.isCompleted).length || 0}/
                    {taskDetail.checklists?.length || 0})
                  </Title>
                </Space>
              </div>

              {taskDetail.checklists && taskDetail.checklists.length > 0 && (() => {
                const total = taskDetail.checklists.length;
                const completed = taskDetail.checklists.filter((c) => c.isCompleted).length;
                const percent = Math.round((completed / total) * 100);
                return (
                  <div style={{ marginBottom: 12 }}>
                    <Progress
                      percent={percent}
                      status={percent === 100 ? 'success' : 'active'}
                      strokeColor={percent === 100 ? '#10b981' : '#4f46e5'}
                    />
                  </div>
                );
              })()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {taskDetail.checklists?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: item.isCompleted ? '#f8fafc' : '#ffffff',
                      border: '1px solid #f1f5f9',
                      borderRadius: 6,
                    }}
                  >
                    <Checkbox
                      checked={item.isCompleted}
                      disabled={!canEditTask}
                      onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                      style={{ flex: 1 }}
                    >
                      <span
                        style={{
                          textDecoration: item.isCompleted ? 'line-through' : 'none',
                          color: item.isCompleted ? '#94a3b8' : '#1e293b',
                          fontSize: 14,
                        }}
                      >
                        {item.title}
                      </span>
                    </Checkbox>

                    {canEditTask && (
                      <Popconfirm
                        title="Xóa việc con này?"
                        onConfirm={() => handleDeleteChecklist(item.id)}
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
                ))}
              </div>

              {canEditTask && (
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="Thêm việc cần làm (nhấn Enter để thêm)..."
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onPressEnter={handleCreateChecklist}
                    disabled={addingChecklist}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateChecklist}
                    loading={addingChecklist}
                    disabled={!newChecklistTitle.trim()}
                  >
                    Thêm
                  </Button>
                </Space.Compact>
              )}
            </div>

            <Divider style={{ margin: '4px 0' }} />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Title level={5} style={{ margin: 0 }}>
                  Tệp đính kèm ({taskDetail.attachments?.length || 0})
                </Title>
                {canEditTask && (
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleUploadAttachment(file);
                      return false;
                    }}
                  >
                    <Button size="small" icon={<UploadOutlined />} loading={uploadingFile}>
                      Tải tệp lên
                    </Button>
                  </Upload>
                )}
              </div>

              {!taskDetail.attachments || taskDetail.attachments.length === 0 ? (
                <div
                  style={{
                    padding: '14px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: 13,
                  }}
                >
                  Chưa có tệp đính kèm nào
                </div>
              ) : (
                <List
                  size="small"
                  dataSource={taskDetail.attachments}
                  renderItem={(file) => {
                    const isImage = file.mimeType?.startsWith('image/');
                    const fullUrl = `http://localhost:3000${file.fileUrl}`;
                    const canDeleteFile = currentUser?.id === file.uploadedBy.id || isOwnerOrAdmin;

                    return (
                      <List.Item
                        key={file.id}
                        style={{
                          padding: '8px 12px',
                          background: '#f8fafc',
                          borderRadius: 8,
                          marginBottom: 8,
                          border: '1px solid #f1f5f9',
                        }}
                        actions={[
                          ...(canDeleteFile
                            ? [
                                <Popconfirm
                                  key="delete"
                                  title="Xóa tệp đính kèm"
                                  description="Bạn có chắc chắn muốn xóa tệp này?"
                                  onConfirm={() => handleDeleteAttachment(file.id)}
                                  okText="Xóa"
                                  cancelText="Hủy"
                                >
                                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>,
                              ]
                            : []),
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            isImage ? (
                              <Image
                                width={40}
                                height={40}
                                src={fullUrl}
                                style={{ objectFit: 'cover', borderRadius: 6 }}
                              />
                            ) : (
                              <Avatar
                                shape="square"
                                size={40}
                                icon={isImage ? <FileImageOutlined /> : <FileOutlined />}
                                style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}
                              />
                            )
                          }
                          title={
                            <a href={fullUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 500 }}>
                              {file.fileName}
                            </a>
                          }
                          description={
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {formatFileSize(file.fileSize)} • {file.uploadedBy.fullName} •{' '}
                              {new Date(file.createdAt).toLocaleString('vi-VN')}
                            </Text>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </div>

            <Divider style={{ margin: '4px 0' }} />

            <Tabs
              defaultActiveKey="comments"
              items={[
                {
                  key: 'comments',
                  label: (
                    <Space size={6}>
                      <CommentOutlined />
                      <span>Bình luận ({taskDetail.comments.length})</span>
                    </Space>
                  ),
                  children: (
                    <div>
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
                                  src={formatAvatarUrl(item.user.avatarUrl)}
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
                                    <Space size={4}>
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => handleStartEditComment(item.id, item.content)}
                                      />
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
                                    </Space>
                                  )}
                                </div>
                              }
                              description={
                                editingCommentId === item.id ? (
                                  <div style={{ marginTop: 8 }}>
                                    <Input.TextArea
                                      rows={2}
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      autoFocus
                                    />
                                    <Space size={8} style={{ marginTop: 8 }}>
                                      <Button
                                        type="primary"
                                        size="small"
                                        loading={savingComment}
                                        disabled={!editingCommentText.trim()}
                                        onClick={() => handleSaveEditComment(item.id)}
                                      >
                                        Lưu
                                      </Button>
                                      <Button size="small" onClick={handleCancelEditComment} disabled={savingComment}>
                                        Hủy
                                      </Button>
                                    </Space>
                                  </div>
                                ) : (
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
                                )
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  ),
                },
                {
                  key: 'activity',
                  label: (
                    <Space size={6}>
                      <HistoryOutlined />
                      <span>Lịch sử hoạt động ({taskDetail.activityLogs?.length || 0})</span>
                    </Space>
                  ),
                  children:
                    !taskDetail.activityLogs || taskDetail.activityLogs.length === 0 ? (
                      <Empty description="Chưa có lịch sử hoạt động" style={{ padding: '24px 0' }} />
                    ) : (
                      <Timeline
                        style={{ marginTop: 8 }}
                        items={taskDetail.activityLogs.map((log) => ({
                          key: log.id,
                          children: (
                            <div>
                              <Text strong style={{ fontSize: 13 }}>
                                {log.user.fullName}
                              </Text>{' '}
                              <Text style={{ fontSize: 13 }}>{formatActivityText(log)}</Text>
                              <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                                </Text>
                              </div>
                            </div>
                          ),
                        }))}
                      />
                    ),
                },
              ]}
            />
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
        width={isMobile ? '100%' : 460}
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
                    src={formatAvatarUrl(owner.user.avatarUrl)}
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
                            src={formatAvatarUrl(member.user.avatarUrl)}
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

      <Modal
        title={editingColumn ? 'Chỉnh sửa cột trạng thái' : 'Thêm cột trạng thái mới'}
        open={isColumnModalOpen}
        onCancel={() => setIsColumnModalOpen(false)}
        onOk={handleSaveColumn}
        confirmLoading={savingColumn}
        okText={editingColumn ? 'Lưu thay đổi' : 'Thêm cột'}
        cancelText="Hủy"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              Tên cột
            </Text>
            <Input
              placeholder="Ví dụ: Đang kiểm thử (QA)"
              value={columnTitleInput}
              onChange={(e) => setColumnTitleInput(e.target.value)}
              onPressEnter={handleSaveColumn}
              maxLength={100}
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Màu nhận diện
            </Text>
            <Space size={10} wrap>
              {columnColors.map((hex) => (
                <div
                  key={hex}
                  onClick={() => setColumnColorInput(hex)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: hex,
                    cursor: 'pointer',
                    border: columnColorInput === hex ? '3px solid #0f172a' : '2px solid transparent',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                />
              ))}
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};
