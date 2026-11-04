generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}



enum SystemRole {
  ADMIN
  USER
}

enum ProjectRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}


// Bảng Người dùng
model User {
  id           String     @id @default(uuid()) @db.Uuid
  email        String     @unique
  passwordHash String     @map("password_hash")
  fullName     String     @map("full_name")
  avatarUrl    String?    @map("avatar_url")
  systemRole   SystemRole @default(USER) @map("system_role")
  isActive     Boolean    @default(true) @map("is_active")
  refreshToken String?    @map("refresh_token")
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime   @updatedAt @map("updated_at") @db.Timestamptz()

  // Quan hệ (Relations)
  ownedProjects   Project[]        @relation("ProjectOwner")
  projectMembers  ProjectMember[]
  assignedTasks   Task[]           @relation("TaskAssignee")
  reportedTasks   Task[]           @relation("TaskReporter")
  comments        TaskComment[]
  attachments     TaskAttachment[]
  notifications   Notification[]
  activityLogs    ActivityLog[]

  @@map("users")
}

// Bảng Dự án (Không gian làm việc)
model Project {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  key         String   @unique // Mã dự án viết tắt (VD: WEB, ERP) để đánh mã Task: WEB-1, WEB-2
  description String?  @db.Text
  ownerId     String   @map("owner_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  // Quan hệ
  owner        User            @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members      ProjectMember[]
  columns      BoardColumn[]
  tasks        Task[]
  activityLogs ActivityLog[]

  @@index([ownerId])
  @@map("projects")
}

// Bảng Thành viên trong Dự án (Bảng trung gian N-N giữa User và Project)
model ProjectMember {
  id        String      @id @default(uuid()) @db.Uuid
  projectId String      @map("project_id") @db.Uuid
  userId    String      @map("user_id") @db.Uuid
  role      ProjectRole @default(MEMBER)
  joinedAt  DateTime    @default(now()) @map("joined_at") @db.Timestamptz()

  // Quan hệ
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Ràng buộc: 1 User chỉ xuất hiện 1 lần trong 1 Project
  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
  @@map("project_members")
}

// Bảng Cột trạng thái trên bảng Kanban (VD: TODO, IN PROGRESS, REVIEW, DONE)
model BoardColumn {
  id            String   @id @default(uuid()) @db.Uuid
  projectId     String   @map("project_id") @db.Uuid
  title         String
  color         String?  @default("#64748b")
  positionOrder Float    @default(0) @map("position_order") // Dùng Float để chèn giữa 2 cột dễ dàng khi kéo thả
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  // Quan hệ
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks   Task[]

  @@index([projectId])
  @@map("board_columns")
}

// Bảng Công việc (Task)
model Task {
  id            String       @id @default(uuid()) @db.Uuid
  projectId     String       @map("project_id") @db.Uuid
  columnId      String       @map("column_id") @db.Uuid
  taskNumber    Int          @map("task_number") // Số thứ tự task trong project (VD: 1, 2, 3 -> ghép với key thành WEB-1)
  title         String
  description   String?      @db.Text
  priority      TaskPriority @default(MEDIUM)
  positionOrder Float        @default(0) @map("position_order") // Dùng Float để kéo thả đổi vị trí Task mượt mà
  assigneeId    String?      @map("assignee_id") @db.Uuid
  reporterId    String       @map("reporter_id") @db.Uuid
  dueDate       DateTime?    @map("due_date") @db.Timestamptz()
  createdAt     DateTime     @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime     @updatedAt @map("updated_at") @db.Timestamptz()

  // Quan hệ
  project      Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  column       BoardColumn      @relation(fields: [columnId], references: [id], onDelete: Cascade)
  assignee     User?            @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  reporter     User             @relation("TaskReporter", fields: [reporterId], references: [id], onDelete: Restrict)
  comments     TaskComment[]
  attachments  TaskAttachment[]
  activityLogs ActivityLog[]

  @@unique([projectId, taskNumber])
  @@index([projectId])
  @@index([columnId])
  @@index([assigneeId])
  @@map("tasks")
}

// Bảng Bình luận trong Công việc
model TaskComment {
  id        String   @id @default(uuid()) @db.Uuid
  taskId    String   @map("task_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  // Quan hệ
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@map("task_comments")
}

// Bảng Tệp đính kèm trong Công việc
model TaskAttachment {
  id           String   @id @default(uuid()) @db.Uuid
  taskId       String   @map("task_id") @db.Uuid
  uploadedById String   @map("uploaded_by_id") @db.Uuid
  fileName     String   @map("file_name")
  fileUrl      String   @map("file_url")
  fileSize     Int      @map("file_size") // Đơn vị: bytes
  mimeType     String   @map("mime_type")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz()

  // Quan hệ
  task       Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploadedBy User @relation(fields: [uploadedById], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@map("task_attachments")
}

// Bảng Thông báo (Real-time Notification)
model Notification {
  id          String   @id @default(uuid()) @db.Uuid
  recipientId String   @map("recipient_id") @db.Uuid
  title       String
  content     String
  type        String   // VD: TASK_ASSIGNED, COMMENT_ADDED, PROJECT_INVITED
  isRead      Boolean  @default(false) @map("is_read")
  metadata    Json?    // Lưu JSONB (VD: { projectId, taskId } để click vào thông báo nhảy tới đúng task)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()

  // Quan hệ
  recipient User @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  @@index([recipientId, isRead])
  @@map("notifications")
}

// Bảng Lịch sử hoạt động (Audit / Activity Log)
model ActivityLog {
  id        String   @id @default(uuid()) @db.Uuid
  projectId String   @map("project_id") @db.Uuid
  taskId    String?  @map("task_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  action    String   // VD: CREATED_TASK, MOVED_COLUMN, CHANGED_PRIORITY
  oldValue  Json?    @map("old_value") // Lưu JSONB trạng thái cũ
  newValue  Json?    @map("new_value") // Lưu JSONB trạng thái mới
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()

  // Quan hệ
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task    Task?   @relation(fields: [taskId], references: [id], onDelete: SetNull)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([taskId])
  @@map("activity_logs")
}