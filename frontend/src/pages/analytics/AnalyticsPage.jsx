import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Select, Table, Space, Typography, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp, Landmark, ShieldCheck } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

export const AnalyticsPage = () => {
  const { t } = useTranslation();
  const [recordType, setRecordType] = useState('CASES');
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState([]);
  const [compare, setCompare] = useState([]);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const typeLower = recordType.toLowerCase();
      const [trendsRes, compareRes] = await Promise.all([
        axios.get(`/api/v1/analytics/trends?recordType=${typeLower}`),
        axios.get(`/api/v1/analytics/compare?recordType=${typeLower}`)
      ]);
      
      setTrends(trendsRes.data.data.trends || []);
      setCompare(compareRes.data.data.compare || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Could not retrieve analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [recordType]);

  // Transform trends to wide format: [{ period: '2026-06', THEFT: 5, ROBBERY: 1 }, ...]
  const getChartData = () => {
    const dataMap = {};
    trends.forEach(t => {
      const period = t.period || 'Unknown';
      if (!dataMap[period]) {
        dataMap[period] = { period };
      }
      dataMap[period][t.classification] = t.count;
    });
    return Object.values(dataMap).sort((a, b) => a.period.localeCompare(b.period));
  };

  const getClassifications = () => {
    return Array.from(new Set(trends.map(t => t.classification)));
  };

  const chartData = getChartData();
  const classifications = getClassifications();
  const COLORS = ['#38bdf8', '#f43f5e', '#10b981', '#fbbf24', '#a78bfa', '#f97316', '#ec4899'];

  const compareColumns = [
    {
      title: 'Jurisdiction Station / Sub-division',
      dataIndex: 'label',
      key: 'label',
      render: (text) => <span style={{ color: '#fff', fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Total Active Volume',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
      render: (count) => <span style={{ color: '#38bdf8', fontWeight: 700 }}>{count}</span>
    }
  ];

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            {t('nav.analytics')}
          </Title>
          <Paragraph style={{ color: '#a0aec0', marginTop: 4 }}>
            Explore statistical trends, crime hotspot comparisons, and distribution load analysis for {t('app.district')}.
          </Paragraph>
        </div>
        <Space>
          <span style={{ color: '#a0aec0' }}>{t('fields.record_type')}:</span>
          <Select
            value={recordType}
            onChange={(val) => setRecordType(val)}
            style={{ width: 180 }}
          >
            <Option value="CASES">{t('dashboard.cases')}</Option>
            <Option value="ARREST">{t('dashboard.arrests')}</Option>
            <Option value="PCR">{t('dashboard.pcr')}</Option>
          </Select>
        </Space>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 24 }} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="Compiling analytics database..." />
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Trend Lines Chart */}
          <Card
            title={
              <Space>
                <TrendingUp size={18} style={{ color: '#38bdf8' }} />
                <span>Monthly Crime Classification Trends</span>
              </Space>
            }
            style={{ background: '#10141d', border: '1px solid #1c2430' }}
          >
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2430" />
                    <XAxis dataKey="period" stroke="#718096" />
                    <YAxis stroke="#718096" />
                    <Tooltip
                      contentStyle={{ background: '#141923', border: '1px solid #232d3f', color: '#fff' }}
                      itemStyle={{ color: '#a0aec0' }}
                    />
                    <Legend wrapperStyle={{ color: '#fff' }} />
                    {classifications.map((cls, idx) => (
                      <Line
                        key={cls}
                        type="monotone"
                        dataKey={cls}
                        stroke={COLORS[idx % COLORS.length]}
                        activeDot={{ r: 8 }}
                        strokeWidth={2.5}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#4b5563' }}>Insufficient operational data to project trends</Text>
              </div>
            )}
          </Card>

          <Row gutter={[24, 24]}>
            {/* Compare Bar Chart */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <BarChart3 size={18} style={{ color: '#f43f5e' }} />
                    <span>Jurisdictional Volume Comparison</span>
                  </Space>
                }
                style={{ background: '#10141d', border: '1px solid #1c2430' }}
              >
                {compare.length > 0 ? (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={compare}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c2430" />
                        <XAxis dataKey="label" stroke="#718096" />
                        <YAxis stroke="#718096" />
                        <Tooltip
                          contentStyle={{ background: '#141923', border: '1px solid #232d3f', color: '#fff' }}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {compare.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#4b5563' }}>No comparative metrics available</Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* Compare Data Table */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <Landmark size={18} style={{ color: '#10b981' }} />
                    <span>Jurisdiction Load Matrix</span>
                  </Space>
                }
                style={{ background: '#10141d', border: '1px solid #1c2430', height: '100%' }}
              >
                <Table
                  dataSource={compare}
                  columns={compareColumns}
                  rowKey="label"
                  pagination={{ pageSize: 5 }}
                  size="small"
                  style={{ background: 'transparent' }}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      )}
    </div>
  );
};

export default AnalyticsPage;
