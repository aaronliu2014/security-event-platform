import React, { useEffect, useState } from 'react';
import { Form, Card, Button, Select, Switch, Space, message, Checkbox, Spin } from 'antd';
import { usePreferencesStore } from '../store/index';

const frequencyOptions = [
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const severityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const sourceOptions = [
  { label: 'NVD', value: 'nvd' },
  { label: 'CISA', value: 'cisa' },
  { label: 'RSS', value: 'rss' },
];

function Settings() {
  const [form] = Form.useForm();
  const { preferences, loading, loadPreferences, savePreferences } = usePreferencesStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (preferences) {
      form.setFieldsValue(preferences);
    }
  }, [preferences, form]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await savePreferences(values);
      message.success('Settings saved successfully');
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to save settings';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Settings</h1>
      <Spin spinning={loading}>
        <Card style={{ maxWidth: 600 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              name="collection_frequency"
              label="Collection Frequency"
              rules={[{ required: true, message: 'Please select a frequency' }]}
            >
              <Select options={frequencyOptions} />
            </Form.Item>

            <Form.Item
              name="data_sources"
              label="Data Sources"
            >
              <Checkbox.Group options={sourceOptions} />
            </Form.Item>

            <Form.Item
              name="notification_enabled"
              label="Enable Notifications"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="email_notification_enabled"
              label="Email Notifications"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="alert_severity_threshold"
              label="Minimum Alert Severity"
              rules={[{ required: true, message: 'Please select a threshold' }]}
            >
              <Select options={severityOptions} />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                Save Settings
              </Button>
              <Button onClick={() => form.resetFields()}>
                Reset
              </Button>
            </Space>
          </Form>
        </Card>
      </Spin>
    </div>
  );
}

export default Settings;
