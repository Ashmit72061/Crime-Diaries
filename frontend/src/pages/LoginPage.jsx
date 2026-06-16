import React, { useState } from 'react';
import { Form, Input, Button, Card, Alert, Space, Typography, Divider } from 'antd';
import { Shield, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;

export const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await login(values.badge_no, values.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Invalid badge number or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (badgeNo) => {
    form.setFieldsValue({
      badge_no: badgeNo,
      password: 'test123'
    });
    form.submit();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 40%, #1c2333 0%, #090a0f 100%)',
      padding: '24px'
    }}>
      <Card
        className="fade-in-up glass-panel"
        style={{
          width: '100%',
          maxWidth: 425,
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Space align="center" style={{ marginBottom: 16 }}>
            <Shield size={42} color="#e53e3e" fill="#e53e3e" style={{ filter: 'drop-shadow(0 0 10px rgba(229, 62, 62, 0.3))' }} />
            <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '2px', background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PHAROS</span>
          </Space>
          <Title level={4} style={{ margin: 0, color: '#fff', fontWeight: 600, letterSpacing: '0.5px' }}>
            {t('app.subtitle')}
          </Title>
          <Paragraph style={{ color: '#64748b', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
            {t('app.district')}
          </Paragraph>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24, borderRadius: 6, background: '#2d1a1a', border: '1px solid #631717', color: '#ff8585' }}
          />
        )}

        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          <Form.Item
            name="badge_no"
            label={<span style={{ color: '#a0aec0', fontWeight: 500 }}>{t('common.badgeNo')}</span>}
            rules={[{ required: true, message: 'Please enter your badge number' }]}
          >
            <Input
              prefix={<User size={16} style={{ color: '#718096' }} />}
              placeholder="e.g. HC001, SHO001"
              size="large"
              style={{ height: 45 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#a0aec0', fontWeight: 500 }}>Password</span>}
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: '#718096' }} />}
              placeholder="••••••••"
              size="large"
              style={{ height: 45 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{
                height: 45,
                background: 'linear-gradient(90deg, #3182ce 0%, #2b6cb0 100%)',
                borderColor: '#3182ce',
                fontWeight: 600,
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(49, 130, 206, 0.3)'
              }}
            >
              Log In
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: '#1f2735', margin: '20px 0' }}>
          <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px' }}>
            QUICK ACCESS DEV LOGINS
          </span>
        </Divider>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          <Button size="small" onClick={() => handleQuickLogin('HC001')} style={{ background: '#141722', color: '#60a5fa', borderColor: '#1f2735', fontSize: 11 }}>HC</Button>
          <Button size="small" onClick={() => handleQuickLogin('SHO001')} style={{ background: '#141722', color: '#10b981', borderColor: '#1f2735', fontSize: 11 }}>SHO</Button>
          <Button size="small" onClick={() => handleQuickLogin('DO001')} style={{ background: '#141722', color: '#f59e0b', borderColor: '#1f2735', fontSize: 11 }}>DCP</Button>
          <Button size="small" onClick={() => handleQuickLogin('HQ001')} style={{ background: '#141722', color: '#a78bfa', borderColor: '#1f2735', fontSize: 11, padding: 0 }}>HQ Analyst</Button>
          <Button size="small" onClick={() => handleQuickLogin('HQ002')} style={{ background: '#141722', color: '#f472b6', borderColor: '#1f2735', fontSize: 11, padding: 0 }}>HQ Admin</Button>
          <Button size="small" onClick={() => handleQuickLogin('SA001')} style={{ background: '#141722', color: '#f87171', borderColor: '#1f2735', fontSize: 11, padding: 0 }}>SysAdmin</Button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: '#4a5568', fontSize: 11 }}>
            Secure Connection. Intended for authorized Delhi Police personnel only.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
