import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Form, Input, Button, Avatar, Space, Tag, message } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined, MailOutlined } from '@ant-design/icons';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  const handleUpdateProfile = async (values: { fullName: string }) => {
    try {
      setUpdatingProfile(true);
      const updatedUser = await authApi.updateProfile({ fullName: values.fullName });
      updateUser(updatedUser);
      message.success('Cập nhật thông tin cá nhân thành công!');
    } catch (err: any) {
      message.error(err.message || 'Không thể cập nhật thông tin cá nhân');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string }) => {
    try {
      setChangingPassword(true);
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Đổi mật khẩu thành công!');
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Hồ sơ cá nhân
        </Title>
        <Text type="secondary">Quản lý thông tin tài khoản và bảo mật của bạn</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{ background: '#f8fafc', borderRadius: 12, height: '100%' }}
            title="Thông tin cơ bản"
          >
            <Space size={16} style={{ marginBottom: 24 }}>
              <Avatar
                size={64}
                icon={<UserOutlined />}
                src={user?.avatarUrl}
                style={{ backgroundColor: '#4f46e5' }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {user?.fullName}
                </Title>
                <Space size={8} style={{ marginTop: 4 }}>
                  <Text type="secondary">{user?.email}</Text>
                  <Tag color="blue">{user?.systemRole || 'USER'}</Tag>
                </Space>
              </div>
            </Space>

            <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
              <Form.Item name="email" label="Địa chỉ Email">
                <Input prefix={<MailOutlined />} disabled size="large" />
              </Form.Item>

              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên!' },
                  { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" size="large" />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updatingProfile}
                size="large"
              >
                Lưu thay đổi
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{ background: '#f8fafc', borderRadius: 12, height: '100%' }}
            title="Đổi mật khẩu"
          >
            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
              <Form.Item
                name="currentPassword"
                label="Mật khẩu hiện tại"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu cũ" size="large" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                  { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" size="large" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" size="large" />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<LockOutlined />}
                loading={changingPassword}
                size="large"
              >
                Cập nhật mật khẩu
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

