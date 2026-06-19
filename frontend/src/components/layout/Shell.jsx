import React, { useState } from 'react';
import { Layout, Menu, Button, Space, Dropdown, Avatar, Divider, Switch, Tag } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  Inbox,
  BarChart3,
  FileSpreadsheet,
  Users,
  GitBranch,
  ShieldCheck,
  Languages,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';

const { Header, Sider, Content } = Layout;

export const Shell = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const currentLng = i18n.language || 'en';

  const toggleLanguage = () => {
    const nextLng = currentLng === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLng);
    localStorage.setItem('pharos_lng', nextLng);
  };

  const getMenuItems = () => {
    if (!user) return [];
    const role = user.role;

    const items = [
      {
        key: '/dashboard',
        icon: <LayoutDashboard size={18} />,
        label: t('nav.dashboard')
      }
    ];

    // HC: Operator
    if (role === 'HC') {
      items.push(
        {
          key: '/register',
          icon: <FilePlus size={18} />,
          label: t('nav.register')
        },
        {
          key: '/queue',
          icon: <Inbox size={18} />,
          label: t('nav.queue')
        }
      );
    }

    // SHO / District Officer / HQ Analysts: Review Queue
    if (['SHO', 'DISTRICT_OFFICER', 'HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'].includes(role)) {
      items.push({
        key: '/queue',
        icon: <Inbox size={18} />,
        label: t('nav.queue')
      });
    }

    // District Officer & HQ roles: Analytics
    if (['DISTRICT_OFFICER', 'HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'].includes(role)) {
      items.push({
        key: '/analytics',
        icon: <BarChart3 size={18} />,
        label: t('nav.analytics')
      });
    }

    // All roles see Reports
    items.push({
      key: '/reports',
      icon: <FileSpreadsheet size={18} />,
      label: t('nav.reports')
    });

    // HQ Admin & System Admin: Users & Hierarchy management
    if (['HQ_ADMIN', 'SYSTEM_ADMIN'].includes(role)) {
      items.push(
        {
          key: '/admin/users',
          icon: <Users size={18} />,
          label: t('nav.users')
        },
        {
          key: '/admin/hierarchy',
          icon: <GitBranch size={18} />,
          label: t('nav.hierarchy')
        }
      );
    }

    // System Admin: Audit log viewer
    if (role === 'SYSTEM_ADMIN') {
      items.push({
        key: '/admin/audit',
        icon: <ShieldCheck size={18} />,
        label: t('nav.audit')
      });
    }

    return items;
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const userMenu = (
    <Menu style={{ background: '#141923', border: '1px solid #232d3f' }}>
      <Menu.Item key="badge" disabled>
        <span style={{ color: '#a0aec0' }}>{t('common.badgeNo')}: {user?.badge_no}</span>
      </Menu.Item>
      <Menu.Item key="role" disabled>
        <span style={{ color: '#a0aec0' }}>{t('common.role')}: {t(`roles.${user?.role}`)}</span>
      </Menu.Item>
      {user?.station_name && (
        <Menu.Item key="station" disabled>
          <span style={{ color: '#a0aec0' }}>{user.station_name}</span>
        </Menu.Item>
      )}
      <Divider style={{ margin: '4px 0', borderColor: '#232d3f' }} />
      <Menu.Item key="logout" onClick={logout} icon={<LogOut size={16} style={{ color: '#f56565' }} />}>
        <span style={{ color: '#f56565' }}>{t('nav.logout')}</span>
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#0d0f14' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          background: '#0a0d12',
          borderRight: '1px solid #1c2430',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 100
        }}
        theme="dark"
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: '0 24px',
          background: '#0a0d12',
          borderBottom: '1px solid #1c2430'
        }}>
          {!collapsed ? (
            <Space direction="vertical" size={0}>
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
                {t('app.title')}
              </span>
              <span style={{ color: '#4a5568', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>
                {t('app.district')}
              </span>
            </Space>
          ) : (
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>P</span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ background: 'transparent', marginTop: 16 }}
        />
      </Sider>

      <Layout style={{ background: '#0d0f14' }}>
        <Header style={{
          background: '#0a0d12',
          borderBottom: '1px solid #1c2430',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          <div>
            <span style={{ color: '#a0aec0', fontSize: 13, marginRight: 8 }}>
              {t('app.district')} |
            </span>
            <Tag color="blue" style={{ borderRadius: 4 }}>
              {t(`roles.${user?.role}`)}
            </Tag>
          </div>

          <Space size="large">
            {/* Language Toggle */}
            <Button
              type="text"
              onClick={toggleLanguage}
              style={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Languages size={16} />
              <span>{currentLng === 'en' ? 'हिन्दी' : 'English'}</span>
            </Button>

            {/* Profile Dropdown */}
            <Dropdown overlay={userMenu} trigger={['click']}>
              <Space style={{ cursor: 'pointer', color: '#c3cbd6' }}>
                <Avatar style={{ backgroundColor: '#2b6cb0' }} icon={<User size={16} />} />
                <span style={{ fontWeight: 500 }}>
                  {currentLng === 'hi' ? user?.name_hi : user?.name_en}
                </span>
                <ChevronDown size={14} />
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#10141d',
          borderRadius: 8,
          border: '1px solid #1c2430',
          minHeight: 280,
          color: '#e2e8f0'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Shell;
