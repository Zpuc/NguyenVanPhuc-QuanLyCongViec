import { PrismaClient, SystemRole, ProjectRole, TaskPriority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const defaultPassword = 'Password123@';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@taskmaster.vn' },
        update: {
            fullName: 'Quản Trị Viên (Admin)',
            systemRole: SystemRole.ADMIN,
            passwordHash,
            isActive: true,
        },
        create: {
            email: 'admin@taskmaster.vn',
            fullName: 'Quản Trị Viên (Admin)',
            systemRole: SystemRole.ADMIN,
            passwordHash,
            isActive: true,
        },
    });

    const phuc = await prisma.user.upsert({
        where: { email: 'phuc.nv@taskmaster.vn' },
        update: {
            fullName: 'Nguyễn Văn Phúc (Leader)',
            systemRole: SystemRole.USER,
            passwordHash,
            isActive: true,
        },
        create: {
            email: 'phuc.nv@taskmaster.vn',
            fullName: 'Nguyễn Văn Phúc (Leader)',
            systemRole: SystemRole.USER,
            passwordHash,
            isActive: true,
        },
    });

    const hoang = await prisma.user.upsert({
        where: { email: 'hoang.nm@taskmaster.vn' },
        update: {
            fullName: 'Nguyễn Minh Hoàng (Senior Dev)',
            systemRole: SystemRole.USER,
            passwordHash,
            isActive: true,
        },
        create: {
            email: 'hoang.nm@taskmaster.vn',
            fullName: 'Nguyễn Minh Hoàng (Senior Dev)',
            systemRole: SystemRole.USER,
            passwordHash,
            isActive: true,
        },
    });

    const linh = await prisma.user.upsert({
        where: { email: 'linh.tt@taskmaster.vn' },
        update: {
            fullName: 'Trần Thùy Linh (QA / Tester)',
            systemRole: SystemRole.USER,
            passwordHash,
            isActive: true,
        },
        create: {
            email: 'linh.tt@taskmaster.vn',
            fullName: 'Trần Thùy Linh (QA / Tester)',
            systemRole: SystemRole.USER,
            passwordHash,
            isActive: true,
        },
    });

    const nam = await prisma.user.upsert({
        where: { email: 'nam.vd@taskmaster.vn' },
        update: {
            fullName: 'Vũ Đình Nam (Frontend Dev)',
            systemRole: SystemRole.USER,
            passwordHash,
            isActive: true,
        },
        create: {
            email: 'nam.vd@taskmaster.vn',
            fullName: 'Vũ Đình Nam (Frontend Dev)',
            systemRole: SystemRole.USER,
            passwordHash,
            isActive: true,
        },
    });

    await prisma.project.deleteMany({
        where: {
            key: { in: ['ERP', 'ECOMM'] },
        },
    });

    const projectErp = await prisma.project.create({
        data: {
            name: 'Hệ Thống Quản Lý Doanh Nghiệp (ERP)',
            key: 'ERP',
            description: 'Dự án số hóa quy trình quản lý nhân sự, dự án và tài chính nội bộ công ty.',
            ownerId: phuc.id,
            members: {
                create: [
                    { userId: phuc.id, role: ProjectRole.OWNER },
                    { userId: hoang.id, role: ProjectRole.ADMIN },
                    { userId: linh.id, role: ProjectRole.MEMBER },
                    { userId: nam.id, role: ProjectRole.MEMBER },
                ],
            },
            columns: {
                create: [
                    { title: 'Cần làm (TODO)', color: '#64748b', positionOrder: 1000 },
                    { title: 'Đang thực hiện', color: '#3b82f6', positionOrder: 2000 },
                    { title: 'Đang kiểm tra (Review)', color: '#eab308', positionOrder: 3000 },
                    { title: 'Hoàn thành (Done)', color: '#22c55e', positionOrder: 4000 },
                ],
            },
        },
        include: {
            columns: true,
        },
    });

    const erpColumnsMap = new Map<string, string>();
    projectErp.columns.forEach((col) => {
        erpColumnsMap.set(col.title, col.id);
    });

    const erpTodoId = erpColumnsMap.get('Cần làm (TODO)')!;
    const erpInProgressId = erpColumnsMap.get('Đang thực hiện')!;
    const erpReviewId = erpColumnsMap.get('Đang kiểm tra (Review)')!;
    const erpDoneId = erpColumnsMap.get('Hoàn thành (Done)')!;

    const now = Date.now();
    const oneDay = 86400000;

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpDoneId,
            taskNumber: 1,
            title: 'Khảo sát yêu cầu và phân tích quy trình quản lý nhân sự',
            description: 'Thu thập biểu mẫu chấm công, tính lương và hồ sơ nhân sự các phòng ban.',
            priority: TaskPriority.HIGH,
            positionOrder: 1000,
            assigneeId: phuc.id,
            reporterId: phuc.id,
            dueDate: new Date(now - 7 * oneDay),
            checklists: {
                create: [
                    { title: 'Gặp gỡ phòng nhân sự thu thập biểu mẫu', isCompleted: true, positionOrder: 1000 },
                    { title: 'Tổng hợp bảng lương mẫu các khối phòng ban', isCompleted: true, positionOrder: 2000 },
                    { title: 'Viết tài liệu đặc tả chức năng SRS', isCompleted: true, positionOrder: 3000 },
                ],
            },
            comments: {
                create: [
                    { userId: linh.id, content: 'Đã nhận được đầy đủ tài liệu đặc tả chức năng từ anh Phúc.' },
                ],
            },
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpDoneId,
            taskNumber: 2,
            title: 'Thiết kế cơ sở dữ liệu PostgreSQL cho phân hệ Dự án và Chấm công',
            description: 'Thiết kế sơ đồ quan hệ ERD, tối ưu khóa ngoại, chỉ mục index và kiểu JSONB cho lịch sử hoạt động.',
            priority: TaskPriority.HIGH,
            positionOrder: 2000,
            assigneeId: hoang.id,
            reporterId: phuc.id,
            dueDate: new Date(now - 4 * oneDay),
            checklists: {
                create: [
                    { title: 'Thiết kế bảng Nhân sự và Phòng ban', isCompleted: true, positionOrder: 1000 },
                    { title: 'Thiết kế bảng Dự án, Thành viên và Phân quyền', isCompleted: true, positionOrder: 2000 },
                    { title: 'Tối ưu Index truy vấn nhanh theo mã dự án và người làm', isCompleted: true, positionOrder: 3000 },
                ],
            },
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpDoneId,
            taskNumber: 3,
            title: 'Xây dựng module xác thực phân quyền JWT và Guards trong NestJS',
            description: 'Cung cấp API đăng nhập, cấp Access Token, Refresh Token và bảo vệ các endpoint theo vai trò.',
            priority: TaskPriority.URGENT,
            positionOrder: 3000,
            assigneeId: hoang.id,
            reporterId: phuc.id,
            dueDate: new Date(now - 2 * oneDay),
            comments: {
                create: [
                    { userId: nam.id, content: 'Backend đã trả về token chuẩn, bên frontend đã nối interceptor gọi refresh token tự động rồi nhé.' },
                ],
            },
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpReviewId,
            taskNumber: 4,
            title: 'Phát triển API quản lý công việc và kéo thả Kanban Board',
            description: 'Cung cấp API CRUD công việc, cập nhật cột và vị trí kéo thả Drag & Drop giữa các cột.',
            priority: TaskPriority.URGENT,
            positionOrder: 1000,
            assigneeId: hoang.id,
            reporterId: phuc.id,
            dueDate: new Date(now + 1 * oneDay),
            checklists: {
                create: [
                    { title: 'Viết API CRUD task và cập nhật trạng thái', isCompleted: true, positionOrder: 1000 },
                    { title: 'Viết API di chuyển task giữa các cột và đổi thứ tự', isCompleted: true, positionOrder: 2000 },
                    { title: 'Unit test kiểm tra vị trí kéo thả float position', isCompleted: false, positionOrder: 3000 },
                ],
            },
            comments: {
                create: [
                    { userId: linh.id, content: 'Em đang kiểm thử luồng kéo thả giữa 2 cột có nhiều task, chức năng chạy ổn định.' },
                ],
            },
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpReviewId,
            taskNumber: 5,
            title: 'Dựng giao diện Bảng Kanban kéo thả bằng Ant Design',
            description: 'Thiết kế giao diện bảng trực quan, hỗ trợ kéo thả mượt mà và hiển thị thẻ công việc chuyên nghiệp.',
            priority: TaskPriority.HIGH,
            positionOrder: 2000,
            assigneeId: nam.id,
            reporterId: phuc.id,
            dueDate: new Date(now + 2 * oneDay),
            checklists: {
                create: [
                    { title: 'Tích hợp thư viện kéo thả dnd', isCompleted: true, positionOrder: 1000 },
                    { title: 'Thiết kế thẻ task theo mẫu Ant Design', isCompleted: true, positionOrder: 2000 },
                    { title: 'Tối ưu hiển thị responsive trên thiết bị di động', isCompleted: false, positionOrder: 3000 },
                ],
            },
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpInProgressId,
            taskNumber: 6,
            title: 'Tích hợp Socket.io thông báo thời gian thực khi được giao task',
            description: 'Kết nối WebSocket giữa NestJS Gateway và React client để nhận thông báo chuông tức thì.',
            priority: TaskPriority.MEDIUM,
            positionOrder: 1000,
            assigneeId: hoang.id,
            reporterId: phuc.id,
            dueDate: new Date(now + 3 * oneDay),
            checklists: {
                create: [
                    { title: 'Cấu hình Socket.io Gateway ở Backend', isCompleted: true, positionOrder: 1000 },
                    { title: 'Lắng nghe sự kiện thông báo ở Header Frontend', isCompleted: true, positionOrder: 2000 },
                    { title: 'Phát âm thanh chuông khi có thông báo mới', isCompleted: false, positionOrder: 3000 },
                ],
            },
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpInProgressId,
            taskNumber: 7,
            title: 'Xây dựng trang Dashboard thống kê tiến độ dự án và biểu đồ',
            description: 'Thống kê tổng số task theo trạng thái, tỷ lệ hoàn thành và biểu đồ theo dõi công việc quá hạn.',
            priority: TaskPriority.HIGH,
            positionOrder: 2000,
            assigneeId: nam.id,
            reporterId: phuc.id,
            dueDate: new Date(now + 4 * oneDay),
            checklists: {
                create: [
                    { title: 'Thống kê tổng số lượng task và tỷ lệ hoàn thành', isCompleted: true, positionOrder: 1000 },
                    { title: 'Vẽ biểu đồ phân bố công việc theo mức ưu tiên', isCompleted: true, positionOrder: 2000 },
                    { title: 'Biểu đồ tròn tỷ lệ hoàn thành theo thành viên', isCompleted: false, positionOrder: 3000 },
                ],
            },
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpTodoId,
            taskNumber: 8,
            title: 'Cài đặt Cron Job tự động nhắc nhở công việc sắp đến hạn chót',
            description: 'Chạy tác vụ định kỳ mỗi sáng quét các task còn dưới 24h để gửi thông báo cho người làm.',
            priority: TaskPriority.MEDIUM,
            positionOrder: 1000,
            assigneeId: hoang.id,
            reporterId: phuc.id,
            dueDate: new Date(now + 5 * oneDay),
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpTodoId,
            taskNumber: 9,
            title: 'Tối ưu tìm kiếm nhanh toàn cục với phím tắt Ctrl + K',
            description: 'Command Palette cho phép tìm kiếm tức thì cả dự án lẫn công việc trên toàn hệ thống.',
            priority: TaskPriority.LOW,
            positionOrder: 2000,
            assigneeId: nam.id,
            reporterId: phuc.id,
            dueDate: new Date(now + 6 * oneDay),
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectErp.id,
            columnId: erpTodoId,
            taskNumber: 10,
            title: 'Đóng gói hệ thống bằng Docker Compose cho Backend, Frontend và Database',
            description: 'Viết Dockerfile nhiều tầng và file docker-compose.yml khởi động toàn bộ môi trường với 1 câu lệnh.',
            priority: TaskPriority.URGENT,
            positionOrder: 3000,
            assigneeId: phuc.id,
            reporterId: phuc.id,
            dueDate: new Date(now - 1 * oneDay),
        },
    });

    const projectEcomm = await prisma.project.create({
        data: {
            name: 'Sàn Thương Mại Điện Tử (E-Commerce Platform)',
            key: 'ECOMM',
            description: 'Website bán lẻ trực tuyến tích hợp thanh toán VNPAY, đồng bộ giỏ hàng và theo dõi đơn hàng.',
            ownerId: hoang.id,
            members: {
                create: [
                    { userId: hoang.id, role: ProjectRole.OWNER },
                    { userId: phuc.id, role: ProjectRole.ADMIN },
                    { userId: linh.id, role: ProjectRole.MEMBER },
                    { userId: nam.id, role: ProjectRole.MEMBER },
                ],
            },
            columns: {
                create: [
                    { title: 'Yêu cầu mới (Backlog)', color: '#94a3b8', positionOrder: 1000 },
                    { title: 'Đang phát triển', color: '#0284c7', positionOrder: 2000 },
                    { title: 'Đang kiểm thử (QA)', color: '#f59e0b', positionOrder: 3000 },
                    { title: 'Sẵn sàng phát hành (Done)', color: '#10b981', positionOrder: 4000 },
                ],
            },
        },
        include: {
            columns: true,
        },
    });

    const ecommColumnsMap = new Map<string, string>();
    projectEcomm.columns.forEach((col) => {
        ecommColumnsMap.set(col.title, col.id);
    });

    const ecommBacklogId = ecommColumnsMap.get('Yêu cầu mới (Backlog)')!;
    const ecommDevId = ecommColumnsMap.get('Đang phát triển')!;
    const ecommQaId = ecommColumnsMap.get('Đang kiểm thử (QA)')!;
    const ecommDoneId = ecommColumnsMap.get('Sẵn sàng phát hành (Done)')!;

    await prisma.task.create({
        data: {
            projectId: projectEcomm.id,
            columnId: ecommDoneId,
            taskNumber: 1,
            title: 'Thiết kế cơ sở dữ liệu Sản phẩm, Danh mục và Đơn hàng',
            description: 'Quản lý thông tin mã SKU, các biến thể màu sắc, kích thước và bảng chi tiết đơn hàng.',
            priority: TaskPriority.HIGH,
            positionOrder: 1000,
            assigneeId: hoang.id,
            reporterId: hoang.id,
            dueDate: new Date(now - 6 * oneDay),
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectEcomm.id,
            columnId: ecommDoneId,
            taskNumber: 2,
            title: 'Xây dựng API đăng ký tài khoản khách hàng và gửi mã OTP',
            description: 'Đăng ký tài khoản qua số điện thoại hoặc email kèm luồng xác thực mã OTP.',
            priority: TaskPriority.HIGH,
            positionOrder: 2000,
            assigneeId: hoang.id,
            reporterId: hoang.id,
            dueDate: new Date(now - 3 * oneDay),
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectEcomm.id,
            columnId: ecommQaId,
            taskNumber: 3,
            title: 'Tích hợp cổng thanh toán trực tuyến VNPAY',
            description: 'Tạo URL chuyển hướng thanh toán sandbox và webhook xử lý IPN cập nhật kết quả giao dịch.',
            priority: TaskPriority.URGENT,
            positionOrder: 1000,
            assigneeId: phuc.id,
            reporterId: hoang.id,
            dueDate: new Date(now + 1 * oneDay),
            checklists: {
                create: [
                    { title: 'Tạo tài khoản thử nghiệm merchant trên VNPAY Sandbox', isCompleted: true, positionOrder: 1000 },
                    { title: 'Tạo chữ ký bảo mật checksum SHA512', isCompleted: true, positionOrder: 2000 },
                    { title: 'Xử lý hoàn tiền khi khách hàng hủy đơn', isCompleted: false, positionOrder: 3000 },
                ],
            },
            comments: {
                create: [
                    { userId: linh.id, content: 'Đã test thành công luồng thanh toán bằng thẻ ATM nội địa test trên sandbox.' },
                ],
            },
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectEcomm.id,
            columnId: ecommDevId,
            taskNumber: 4,
            title: 'Thiết kế giao diện giỏ hàng và trang thanh toán Checkout',
            description: 'Giao diện chọn địa chỉ nhận hàng, chọn phương thức vận chuyển và nhập mã giảm giá voucher.',
            priority: TaskPriority.HIGH,
            positionOrder: 1000,
            assigneeId: nam.id,
            reporterId: hoang.id,
            dueDate: new Date(now + 2 * oneDay),
            checklists: {
                create: [
                    { title: 'Hiển thị danh sách sản phẩm trong giỏ hàng', isCompleted: true, positionOrder: 1000 },
                    { title: 'Chọn địa chỉ giao hàng và tính phí ship', isCompleted: false, positionOrder: 2000 },
                    { title: 'Nút đặt hàng và chọn hình thức thanh toán', isCompleted: false, positionOrder: 3000 },
                ],
            },
        },
    });

    await prisma.task.create({
        data: {
            projectId: projectEcomm.id,
            columnId: ecommBacklogId,
            taskNumber: 5,
            title: 'Kiểm thử hiệu năng tải trang và bảo mật SQL Injection',
            description: 'Sử dụng k6 kiểm thử khả năng chịu tải 500 yêu cầu đồng thời vào khung giờ khuyến mãi.',
            priority: TaskPriority.MEDIUM,
            positionOrder: 1000,
            assigneeId: linh.id,
            reporterId: hoang.id,
            dueDate: new Date(now + 5 * oneDay),
        },
    });

    await prisma.notification.createMany({
        data: [
            {
                recipientId: phuc.id,
                title: 'Công việc mới được giao',
                content: 'Nguyễn Minh Hoàng đã giao cho bạn công việc: Tích hợp cổng thanh toán trực tuyến VNPAY.',
                type: 'TASK_ASSIGNED',
                isRead: false,
                metadata: { projectKey: 'ECOMM', taskNumber: 3 },
            },
            {
                recipientId: nam.id,
                title: 'Bình luận mới trong công việc',
                content: 'Trần Thùy Linh đã bình luận trong: Dựng giao diện Bảng Kanban kéo thả bằng Ant Design.',
                type: 'COMMENT_ADDED',
                isRead: false,
                metadata: { projectKey: 'ERP', taskNumber: 5 },
            },
            {
                recipientId: hoang.id,
                title: 'Cảnh báo sắp đến hạn chót',
                content: 'Công việc: Phát triển API quản lý công việc và kéo thả Kanban Board sắp hết hạn vào ngày mai.',
                type: 'DEADLINE_REMINDER',
                isRead: false,
                metadata: { projectKey: 'ERP', taskNumber: 4 },
            },
        ],
    });

    console.log('Seed completed successfully!');
    console.log('Accounts created (Password: Password123@):');
    console.log('1. admin@taskmaster.vn (Quản Trị Viên - ADMIN)');
    console.log('2. phuc.nv@taskmaster.vn (Nguyễn Văn Phúc - Leader/Manager)');
    console.log('3. hoang.nm@taskmaster.vn (Nguyễn Minh Hoàng - Senior Dev)');
    console.log('4. linh.tt@taskmaster.vn (Trần Thùy Linh - QA / Tester)');
    console.log('5. nam.vd@taskmaster.vn (Vũ Đình Nam - Frontend Dev)');
    console.log('Projects created: ERP (10 tasks), ECOMM (5 tasks).');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
