import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Button, Tag, Space, Select, Drawer, Descriptions, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { eventService } from '../services/api';

const { Text } = Typography;

const severityColors = {
  critical: 'red', high: 'orange', medium: 'gold', low: 'green',
};

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [severityFilter, setSeverityFilter] = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchEvents = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      if (severityFilter) params.severity = severityFilter;
      if (sourceFilter) params.source = sourceFilter;

      let response;
      if (searchText.trim()) {
        response = await eventService.searchEvents({ q: searchText.trim(), limit: pageSize });
      } else {
        response = await eventService.getEvents(params);
      }

      const data = response.data.data || [];
      setEvents(data);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: response.data.count || data.length,
      }));
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setLoading(false);
    }
  }, [searchText, severityFilter, sourceFilter]);

  useEffect(() => {
    fetchEvents(1, pagination.pageSize);
  }, []);

  const handleSearch = () => {
    fetchEvents(1, pagination.pageSize);
  };

  const handleTableChange = (pag) => {
    fetchEvents(pag.current, pag.pageSize);
  };

  const openDetail = async (record) => {
    try {
      const response = await eventService.getEventById(record.id);
      setSelectedEvent(response.data.data);
      setDrawerOpen(true);
    } catch {
      setSelectedEvent(record);
      setDrawerOpen(true);
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => <a onClick={() => openDetail(record)}>{text}</a>,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 100,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s) => <Tag color={severityColors[s] || 'default'}>{s?.toUpperCase()}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 100,
    },
    {
      title: 'Published',
      dataIndex: 'published_date',
      key: 'published_date',
      width: 120,
      render: (d) => d ? new Date(d).toLocaleDateString() : '--',
    },
  ];

  return (
    <div>
      <h1>Security Events</h1>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search events..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder="Severity"
          value={severityFilter}
          onChange={(v) => { setSeverityFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
          allowClear
          style={{ width: 130 }}
        >
          <Select.Option value="critical">Critical</Select.Option>
          <Select.Option value="high">High</Select.Option>
          <Select.Option value="medium">Medium</Select.Option>
          <Select.Option value="low">Low</Select.Option>
        </Select>
        <Select
          placeholder="Source"
          value={sourceFilter}
          onChange={(v) => { setSourceFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}
          allowClear
          style={{ width: 130 }}
        >
          <Select.Option value="NVD">NVD</Select.Option>
          <Select.Option value="CISA">CISA</Select.Option>
        </Select>
        <Button icon={<SearchOutlined />} onClick={handleSearch} type="primary">
          Search
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => fetchEvents(1, pagination.pageSize)} loading={loading}>
          Refresh
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={events}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Drawer
        title="Event Detail"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={640}
      >
        {selectedEvent && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Title">{selectedEvent.title}</Descriptions.Item>
            <Descriptions.Item label="Source">{selectedEvent.source}</Descriptions.Item>
            <Descriptions.Item label="Severity">
              <Tag color={severityColors[selectedEvent.severity]}>
                {selectedEvent.severity?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Type">{selectedEvent.event_type}</Descriptions.Item>
            <Descriptions.Item label="External ID">{selectedEvent.external_id}</Descriptions.Item>
            <Descriptions.Item label="Published Date">
              {selectedEvent.published_date ? new Date(selectedEvent.published_date).toLocaleString() : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="Collected Date">
              {selectedEvent.collected_date ? new Date(selectedEvent.collected_date).toLocaleString() : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="Affected Products">
              {Array.isArray(selectedEvent.affected_products)
                ? selectedEvent.affected_products.join(', ')
                : selectedEvent.affected_products || '--'}
            </Descriptions.Item>
            <Descriptions.Item label="Source URL">
              {selectedEvent.source_url ? (
                <a href={selectedEvent.source_url} target="_blank" rel="noopener noreferrer">
                  {selectedEvent.source_url}
                </a>
              ) : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              <Text>{selectedEvent.description || 'No description'}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}

export default EventList;
