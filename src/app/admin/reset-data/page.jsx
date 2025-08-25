'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export default function ResetDataPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleTestConnection = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const response = await fetch('/api/auth/test-connection', {
        method: 'GET',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`연결 테스트 성공: ${result.message}, 메뉴 개수: ${result.menuCount}`);
      } else {
        setError(`연결 테스트 실패: ${result.error}\n상세: ${result.details}`);
      }
    } catch (err) {
      setError(`연결 테스트 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetMenus = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const response = await fetch('/api/auth/reset-menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`메뉴 재설정 완료: ${result.menusCreated}개 메뉴 생성`);
      } else {
        setError(result.error || '메뉴 재설정 실패');
      }
    } catch (err) {
      setError(`API 호출 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetUsers = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const response = await fetch('/api/auth/reset-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`사용자 권한 재설정 완료: ${result.usersCreated}개 사용자 생성`);
      } else {
        setError(result.error || '사용자 권한 재설정 실패');
      }
    } catch (err) {
      setError(`API 호출 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      // 먼저 메뉴 재설정
      console.log('메뉴 재설정 시작...');
      const menuResponse = await fetch('/api/auth/reset-menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const menuResult = await menuResponse.json();
      
      if (!menuResult.success) {
        throw new Error(menuResult.error || '메뉴 재설정 실패');
      }
      
      // 그 다음 사용자 재설정
      console.log('사용자 권한 재설정 시작...');
      const userResponse = await fetch('/api/auth/reset-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const userResult = await userResponse.json();
      
      if (!userResult.success) {
        throw new Error(userResult.error || '사용자 권한 재설정 실패');
      }
      
      setMessage(`전체 재설정 완료: 메뉴 ${menuResult.menusCreated}개, 사용자 ${userResult.usersCreated}개 생성`);
      
    } catch (err) {
      setError(`전체 재설정 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContent>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ mb: 5 }}>
          MongoDB 데이터 재설정
        </Typography>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              메뉴 및 사용자 데이터 관리
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              새로운 메뉴 구조(서열수신현황 포함)로 MongoDB 데이터를 재설정합니다.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                color="info"
                onClick={handleTestConnection}
                disabled={loading}
              >
                연결 테스트
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleResetMenus}
                disabled={loading}
              >
                메뉴만 재설정
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                onClick={handleResetUsers}
                disabled={loading}
              >
                사용자만 재설정
              </Button>
              
              <Button
                variant="contained"
                color="warning"
                onClick={handleResetAll}
                disabled={loading}
              >
                전체 재설정
              </Button>
            </Box>

            {loading && (
              <Typography color="info.main">
                처리 중...
              </Typography>
            )}

            {message && (
              <Typography color="success.main" sx={{ mt: 2 }}>
                ✅ {message}
              </Typography>
            )}

            {error && (
              <Typography color="error.main" sx={{ mt: 2 }}>
                ❌ {error}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </DashboardContent>
  );
} 