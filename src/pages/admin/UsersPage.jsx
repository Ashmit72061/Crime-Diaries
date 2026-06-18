import React, { useEffect, useState } from 'react';
import { Table, Card, Space, Tag, Typography, Spin, Alert } from 'antd';
import axios from 'axios';

const { Title, Paragraph } = Typography;

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/v1/admin/users');
        setUsers(res.data.data.users || []);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Could not retrieve user directory');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const columns = [
    {
      title: 'Badge Number',
      dataIndex: 'badge_no',
      key: 'badge_no',
      render: (text) => <span style={{ color: '#38bdf8', fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: 'Name (English)',
      dataIndex: 'name_en',
      key: 'name_en',
      render: (text) => <span style={{ color: '#fff' }}>{text}</span>
    },
    {
      title: 'Name (Hindi)',
      dataIndex: 'name_hi',
      key: 'name_hi'
    },
    {
      title: 'System Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color="blue">{role}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Suspended'}</Tag>
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          User Directory Directory
        </Title>
        <Paragraph style={{ color: '#a0aec0', marginTop: 4 }}>
          Access list of registered district officers, stations coordinators, and headquarters operators.
        </Paragraph>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 20 }} />}

      <Card style={{ background: '#10141d', border: '1px solid #1c2430' }}>
        <Table
          dataSource={users}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ background: 'transparent' }}
        />
      </Card>
    </div>
  );
};

export default UsersPage;
