import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Select, Button, Space, Table, Typography, Spin, Alert, message, Progress, Tabs, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api.js';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

import CustomExcelBuilder from './CustomExcelBuilder';

export const ReportsPage = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [exportType, setExportType] = useState('CASES');
  const [exportLoading, setExportLoading] = useState(false);

  // PDF generation polling state
  const [generatingJobId, setGeneratingJobId] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatingTemplateId, setGeneratingTemplateId] = useState(null);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get('/reports/templates');
      setTemplates(res.data.data.templates || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      message.error('Could not load report templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleExcelExport = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const fetchUrl = `${BASE_URL}/analytics/export?recordType=${exportType.toLowerCase()}`;

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Pharos_${exportType}_Export.xlsx`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 500);
      message.success('Excel Sheet exported successfully');
    } catch (err) {
      console.error('Excel export failed:', err);
      message.error('Failed to download spreadsheet');
    } finally {
      setExportLoading(false);
    }
  };

  const handlePdfExport = async (templateId) => {
    setGeneratingTemplateId(templateId);
    setGenerationProgress(10);
    try {
      const res = await api.post('/reports/generate', {
        template_id: templateId,
        format: 'PDF',
        filters: { recordType: 'CASES' } // standard default filter
      });
      
      const jobId = res.data.data.job.id;
      setGeneratingJobId(jobId);
      pollJobStatus(jobId);
    } catch (err) {
      console.error('PDF generation initialization failed:', err);
      message.error('Failed to trigger PDF report generator');
      setGeneratingTemplateId(null);
    }
  };

  const pollJobStatus = (jobId) => {
    let progress = 20;
    const interval = setInterval(async () => {
      progress = Math.min(progress + 15, 90);
      setGenerationProgress(progress);
      
      try {
        const res = await api.get(`/reports/status/${jobId}`);
        const job = res.data.data.job;
        
        if (job.status === 'READY') {
          clearInterval(interval);
          setGenerationProgress(100);
          message.success('PDF document compiled successfully');
          
          // Trigger file download
          window.open(`${api.defaults.baseURL}/reports/download/${jobId}`, '_blank');
          
          setTimeout(() => {
            setGeneratingTemplateId(null);
            setGeneratingJobId(null);
            setGenerationProgress(0);
          }, 1000);
        } else if (job.status === 'FAILED') {
          clearInterval(interval);
          message.error('PDF document compiler failed');
          setGeneratingTemplateId(null);
          setGeneratingJobId(null);
        }
      } catch (err) {
        console.error('Failed checking job status:', err);
        clearInterval(interval);
        message.error('Network error checking report progress');
        setGeneratingTemplateId(null);
      }
    }, 1500);
  };

  const templateColumns = [
    {
      title: 'Report Layout Template Name',
      dataIndex: 'name_en',
      key: 'name_en',
      render: (text, record) => (
        <div>
          <span style={{ color: '#fff', fontWeight: 600, display: 'block' }}>{text}</span>
          <span style={{ color: '#718096', fontSize: 12 }}>{record.name_hi}</span>
        </div>
      )
    },
    {
      title: 'Scope Category',
      dataIndex: 'applicable_record_types',
      key: 'applicable_record_types',
      render: (typesJson) => {
        const types = typeof typesJson === 'string' ? JSON.parse(typesJson) : typesJson;
        return (
          <Space>
            {types.map(t => <Tag color="cyan" key={t}>{t}</Tag>)}
          </Space>
        );
      }
    },
    {
      title: 'Output Actions',
      key: 'actions',
      render: (_, record) => {
        const isGenerating = generatingTemplateId === record.id;
        return (
          <Space>
            {isGenerating ? (
              <div style={{ width: 180 }}>
                <Progress percent={generationProgress} size="small" strokeColor="#38bdf8" />
              </div>
            ) : (
              <Button
                type="primary"
                onClick={() => handlePdfExport(record.id)}
                icon={<FileText size={14} />}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e53e3e', borderColor: '#e53e3e' }}
              >
                Compile PDF Report
              </Button>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          {t('nav.reports')}
        </Title>
        <Paragraph style={{ color: '#a0aec0', marginTop: 4 }}>
          Generate district-level PDF diary entries or compile raw operational grids into clean Excel spreadsheets.
        </Paragraph>
      </div>

      <Tabs 
        defaultActiveKey="1"
        style={{ color: '#fff' }}
        items={[
          {
            key: '1',
            label: 'Defined Templates',
            children: (
              <Row gutter={[24, 24]}>
                {/* Spreadsheet Export Card */}
                <Col xs={24} md={8}>
                  <Card
                    title={
                      <Space>
                        <FileSpreadsheet size={18} style={{ color: '#10b981' }} />
                        <span>Operational Sheets Export</span>
                      </Space>
                    }
                    style={{ background: '#10141d', border: '1px solid #1c2430', height: '100%' }}
                  >
                    <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 10 }}>
                      <div>
                        <span style={{ color: '#a0aec0', display: 'block', marginBottom: 8 }}>Select category spreadsheet:</span>
                        <Select
                          value={exportType}
                          onChange={(val) => setExportType(val)}
                          style={{ width: '100%' }}
                        >
                          <Option value="CASES">{t('dashboard.cases')}</Option>
                          <Option value="ARREST">{t('dashboard.arrests')}</Option>
                          <Option value="PCR">{t('dashboard.pcr')}</Option>
                        </Select>
                      </div>

                      <Alert
                        message="Comprehensive Sheet Output"
                        description="Contains all fields including full case briefs, dates, names, locations, and audit numbers."
                        type="info"
                        showIcon
                        style={{ background: '#0c1a30', border: '1px solid #1c3d5a', color: '#93c5fd' }}
                      />

                      <Button
                        type="primary"
                        onClick={handleExcelExport}
                        loading={exportLoading}
                        block
                        style={{
                          background: '#10b981',
                          borderColor: '#10b981',
                          height: 40,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8
                        }}
                      >
                        {exportLoading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                        Export Excel Spreadsheet
                      </Button>
                    </Space>
                  </Card>
                </Col>

                {/* Compiled PDF Templates List */}
                <Col xs={24} md={16}>
                  <Card
                    title={
                      <Space>
                        <FileText size={18} style={{ color: '#e53e3e' }} />
                        <span>District Compiled Reporting Templates</span>
                      </Space>
                    }
                    style={{ background: '#10141d', border: '1px solid #1c2430' }}
                  >
                    <Table
                      dataSource={templates}
                      columns={templateColumns}
                      loading={loadingTemplates}
                      rowKey="id"
                      pagination={false}
                      style={{ background: 'transparent' }}
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: '2',
            label: 'Custom Excel Export',
            children: <CustomExcelBuilder />
          }
        ]}
      />
    </div>
  );
};

export default ReportsPage;
