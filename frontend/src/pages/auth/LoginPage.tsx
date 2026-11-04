import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import type { LoginDto } from '../../api/auth.api';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const onFinish = async (values: LoginDto) => {
        try {
            setLoading(true);
            const res = await authApi.login(values);
            setAuth(res.user, res.accessToken);
            message.success(`Đăng nhập thành công! Chào mừng ${res.user.fullName}`);
            navigate('/dashboard');
        } catch (err: any) {
            message.error(err.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
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
                    maxWidth: 400,
                    borderRadius: 16,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <CheckCircleFilled style={{ fontSize: 40, color: '#4f46e5', marginBottom: 12 }} />
                    <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                        TaskMaster Pro
                    </Title>
                    <Text type="secondary">Đăng nhập hệ thống Quản lý công việc</Text>
                </div>

                <Form
                    name="login_form"
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập Email của bạn!' },
                            { type: 'email', message: 'Địa chỉ Email không đúng định dạng!' },
                        ]}
                    >
                        <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="ten@congty.com" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="••••••••" />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            icon={<ArrowRightOutlined />}
                            style={{ height: 46, fontSize: 16, fontWeight: 600 }}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Text type="secondary">Chưa có tài khoản? </Text>
                        <Link to="/register" style={{ color: '#4f46e5', fontWeight: 600 }}>
                            Đăng ký ngay
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};