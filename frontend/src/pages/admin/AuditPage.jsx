import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Space, Typography, Spin, Alert } from 'antd';
import { ShieldAlert } from 'lucide-react';
import axios from 'axios';

const { Title, Paragraph } = Typography;

export const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/v1/audit');
        setLogs(res.data.data.logs || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
        setError('Could not retrieve audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionTagColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'green';
      case 'UPDATE':
        return 'blue';
      case 'OVERRIDE':
        return 'orange';
      case 'SUBMIT':
        return 'purple';
      case 'LOGIN':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (text) => <Tag color={getActionTagColor(text)}>{text}</Tag>
    },
    {
      title: 'Table Name',
      dataIndex: 'table_name',
      key: 'table_name',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text || 'N/A'}</span>
    },
    {
      title: 'Performer Role',
      dataIndex: 'changed_by_role',
      key: 'changed_by_role',
      render: (text) => <Tag color="default">{text}</Tag>
    },
    {
      title: 'Timestamp',
      dataIndex: 'changed_at',
      key: 'changed_at',
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address'
    },
    {
      title: 'Field Modified',
      dataIndex: 'field_name',
      key: 'field_name',
      render: (text) => <span style={{ color: '#fbbf24' }}>{text || 'All Payload'}</span>
    },
    {
      title: 'Override Reason / Comments',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>{text || '-'}</span>
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          System Audit Trail Ledger
        </Title>
        <Paragraph style={{ color: '#a0aec0', marginTop: 4 }}>
          Audit trace logging representing the complete, immutable transaction records tracking changes.
        </Paragraph>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 20 }} />}

      <Card
        title={
          <Space>
            <ShieldAlert size={18} style={{ color: '#e53e3e' }} />
            <span>Immutable Audit Action Ledger</span>
          </Space>
        }
        style={{ background: '#10141d', border: '1px solid #1c2430' }}
      >
        <Table
          dataSource={logs}
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

export default AuditPage;
