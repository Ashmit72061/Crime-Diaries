import React, { useEffect, useState } from 'react';
import { Tree, Card, Typography, Spin, Alert, Tag, Space } from 'antd';
import { GitBranch, Landmark } from 'lucide-react';
import axios from 'axios';

const { Title, Paragraph } = Typography;

export const HierarchyPage = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatTreeNodes = (nodes) => {
    return nodes.map(node => ({
      title: (
        <Space>
          <span style={{ color: '#fff', fontWeight: 600 }}>{node.name_en}</span>
          <span style={{ color: '#718096', fontSize: 12 }}>({node.name_hi})</span>
          <Tag color="blue" style={{ fontSize: 10 }}>{node.node_type}</Tag>
          {node.code && <Tag color="orange" style={{ fontSize: 10 }}>{node.code}</Tag>}
        </Space>
      ),
      key: node.id,
      children: node.children ? formatTreeNodes(node.children) : []
    }));
  };

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await axios.get('/api/v1/admin/hierarchy/tree');
        // If tree is wrapped in an object or directly returned as an array, handle both
        const data = res.data.data.tree || res.data.data;
        const formatted = formatTreeNodes(Array.isArray(data) ? data : [data]);
        setTreeData(formatted);
      } catch (err) {
        console.error('Failed to load tree:', err);
        setError('Could not retrieve organizational tree');
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          District Hierarchy & Jurisdictions
        </Title>
        <Paragraph style={{ color: '#a0aec0', marginTop: 4 }}>
          Browse Zones, Ranges, Districts, Sub-Divisions, and Police Stations hierarchy of Delhi Police.
        </Paragraph>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 20 }} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="Loading tree directory..." />
        </div>
      ) : (
        <Card
          title={
            <Space>
              <GitBranch size={18} style={{ color: '#38bdf8' }} />
              <span>Delhi Police Organizational Hierarchy Tree</span>
            </Space>
          }
          style={{ background: '#10141d', border: '1px solid #1c2430' }}
        >
          <Tree
            showLine={{ showLeafIcon: false }}
            showIcon={false}
            defaultExpandAll
            treeData={treeData}
            style={{ background: 'transparent', color: '#a0aec0', padding: '10px 0' }}
          />
        </Card>
      )}
    </div>
  );
};

export default HierarchyPage;
