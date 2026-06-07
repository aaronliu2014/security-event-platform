import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/index';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <Result
        icon={<LockOutlined />}
        title="Login Required"
        subTitle="Please log in or register to access this feature."
        extra={[
          <Button type="primary" key="login" onClick={() => navigate('/login')}>
            Log In
          </Button>,
          <Button key="register" onClick={() => navigate('/register')}>
            Register
          </Button>,
        ]}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
