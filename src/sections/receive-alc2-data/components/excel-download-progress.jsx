'use client';

import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ExcelDownloadProgress({
  open,
  progress,
  currentChunk,
  totalChunks,
  totalRecords,
  downloadedRecords,
  status,
  onCancel,
  onClose,
  ...other
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'downloading':
        return <CircularProgress size={24} />;
      case 'processing':
        return <CircularProgress size={24} color="warning" />;
      case 'completed':
        return <Iconify icon="solar:check-circle-bold" width={24} sx={{ color: 'success.main' }} />;
      case 'error':
        return <Iconify icon="solar:close-circle-bold" width={24} sx={{ color: 'error.main' }} />;
      default:
        return <Iconify icon="solar:download-bold" width={24} sx={{ color: 'primary.main' }} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'downloading':
        return '데이터 다운로드 중...';
      case 'processing':
        return 'Excel 파일 생성 중...';
      case 'completed':
        return '다운로드 완료!';
      case 'error':
        return '다운로드 실패';
      default:
        return '다운로드 준비 중...';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'downloading':
        return 'primary';
      case 'processing':
        return 'warning';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Modal
      open={open}
      onClose={status === 'completed' || status === 'error' ? onClose : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
      {...other}
    >
      <Box
        sx={{
          width: { xs: '90%', sm: 480 },
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          outline: 'none',
          position: 'relative',
        }}
      >
        {/* 헤더 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
          }}
        >
          {getStatusIcon()}
          <Box>
            <Typography variant="h6" component="div">
              엑셀 다운로드
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getStatusText()}
            </Typography>
          </Box>
        </Box>

        {/* 진행률 바 */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              진행률
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={getProgressColor()}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              },
            }}
          />
        </Box>

        {/* 상세 정보 */}
        <Box
          sx={{
            bgcolor: 'grey.50',
            borderRadius: 1,
            p: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                청크 진행률
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {currentChunk} / {totalChunks}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                다운로드된 레코드
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {downloadedRecords?.toLocaleString()} / {totalRecords?.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 액션 버튼들 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          {status === 'downloading' && onCancel && (
            <Button
              variant="outlined"
              color="error"
              onClick={onCancel}
              startIcon={<Iconify icon="solar:close-circle-bold" />}
            >
              취소
            </Button>
          )}
          
          {(status === 'completed' || status === 'error') && (
            <Button
              variant="contained"
              onClick={onClose}
              startIcon={
                status === 'completed' 
                  ? <Iconify icon="solar:check-circle-bold" />
                  : <Iconify icon="solar:refresh-bold" />
              }
            >
              {status === 'completed' ? '확인' : '다시 시도'}
            </Button>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

ExcelDownloadProgress.propTypes = {
  open: PropTypes.bool.isRequired,
  progress: PropTypes.number,
  currentChunk: PropTypes.number,
  totalChunks: PropTypes.number,
  totalRecords: PropTypes.number,
  downloadedRecords: PropTypes.number,
  status: PropTypes.oneOf(['preparing', 'downloading', 'processing', 'completed', 'error']),
  onCancel: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

ExcelDownloadProgress.defaultProps = {
  progress: 0,
  currentChunk: 0,
  totalChunks: 0,
  totalRecords: 0,
  downloadedRecords: 0,
  status: 'preparing',
  onCancel: null,
};