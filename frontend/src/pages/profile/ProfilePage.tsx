import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Form, Input, Button, Avatar, Space, Tag, Upload, message } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined, MailOutlined, CameraOutlined } from '@ant-design/icons';
import { authApi, formatAvatarUrl } from '../../api/auth.api';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  const handleUploadAvatar = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Vui lòng chọn tệp hình ảnh!');
      return;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Kích thước ảnh tối đa là 5MB!');
      return;
    }

    try {
      setUploadingAvatar(true);
      const updatedUser = await authApi.uploadAvatar(file);
      updateUser(updatedUser);
      message.success('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      message.error(err.message || 'Không thể tải lên ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

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
            <Space size={16} align="center" style={{ marginBottom: 24 }}>
              <Avatar
                size={72}
                icon={<UserOutlined />}
                src={formatAvatarUrl(user?.avatarUrl)}
                style={{ backgroundColor: '#4f46e5' }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {user?.fullName}
                </Title>
                <Space size={8} style={{ marginTop: 4, marginBottom: 8 }} wrap>
                  <Text type="secondary">{user?.email}</Text>
                  <Tag color="blue">{user?.systemRole || 'USER'}</Tag>
                </Space>
                <div>
                  <Upload
                    beforeUpload={(file) => {
                      handleUploadAvatar(file);
                      return false;
                    }}
                    showUploadList={false}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  >
                    <Button icon={<CameraOutlined />} size="small" loading={uploadingAvatar}>
                      Tải ảnh đại diện
                    </Button>
                  </Upload>
                </div>
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

