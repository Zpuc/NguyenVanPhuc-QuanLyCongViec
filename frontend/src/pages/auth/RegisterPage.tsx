import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, UserAddOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import type { RegisterDto } from '../../api/auth.api';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text } = Typography;

export const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const onFinish = async (values: RegisterDto) => {
    try {
      setLoading(true);
      const res = await authApi.register(values);
      setAuth(res.user, res.accessToken);
      message.success('Đăng ký tài khoản thành công!');
      navigate('/login');
    } catch (err: any) {
      message.error(err.message || 'Đăng ký thất bại. Email có thể đã tồn tại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f1f5f9',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <CheckCircleFilled style={{ fontSize: 40, color: '#4f46e5', marginBottom: 12 }} />
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            TaskMaster Pro
          </Title>
          <Text type="secondary">Tạo tài khoản mới</Text>
        </div>

        <Form
          name="register_form"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên của bạn!' }]}
          >
            <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Địa chỉ Email không đúng định dạng!' },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="ten@congty.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Tối thiểu 6 ký tự" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<UserAddOutlined />}
              style={{ height: 46, fontSize: 16, fontWeight: 600 }}
            >
              Đăng ký tài khoản
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">Đã có tài khoản? </Text>
            <Link to="/login" style={{ color: '#4f46e5', fontWeight: 600 }}>
              Đăng nhập
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};