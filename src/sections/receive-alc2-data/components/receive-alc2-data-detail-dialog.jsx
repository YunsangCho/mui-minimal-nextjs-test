import { Box, Stack, Typography, Dialog, DialogTitle, DialogContent, IconButton, Chip } from '@mui/material';
import { Iconify } from 'src/components/iconify';

// ------------------------------------------------------------------

function WorkFlagChip({ value }) {
  const statusConfig = {
    'T': { color: 'success', label: '완료' },
    'F': { color: 'error', label: '진행중' },
  };

  const config = statusConfig[value] || { color: 'default', label: value || '알 수 없음' };

  return (
    <Chip
      variant="soft"
      color={config.color}
      label={config.label}
    />
  );
}

function AssemblyChip({ value }) {
  const statusConfig = {
    '완료': { color: 'success', label: '완료' },
    '미완료': { color: 'error', label: '미완료' },
  };

  const config = statusConfig[value] || { color: 'default', label: value || '알 수 없음' };

  return (
    <Chip
      variant="soft"
      color={config.color}
      label={config.label}
    />
  );
}

function DataSourceChip({ value }) {
  const statusConfig = {
    'LIVE': { color: 'primary', label: '운영' },
    'BACKUP': { color: 'secondary', label: '백업' },
  };

  const config = statusConfig[value] || { color: 'default', label: value || '알 수 없음' };

  return (
    <Chip
      variant="soft"
      color={config.color}
      label={config.label}
    />
  );
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  if (dateTimeStr.length === 14) {
    const year = dateTimeStr.slice(0, 4);
    const month = dateTimeStr.slice(4, 6);
    const day = dateTimeStr.slice(6, 8);
    const hour = dateTimeStr.slice(8, 10);
    const minute = dateTimeStr.slice(10, 12);
    const second = dateTimeStr.slice(12, 14);
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }
  return dateTimeStr;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  if (dateStr.length === 8) {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

// ------------------------------------------------------------------

export function ReceiveAlc2DataDetailDialog({ open, onClose, row }) {
  if (!row) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">서열수신 상세정보</Typography>
          <IconButton onClick={handleClose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* 기본 정보 */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>기본 정보</Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">생산일시</Typography>
                  <Typography variant="body2">{formatDateTime(row.PROD_DTTM)}</Typography>
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">커밋번호</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{row.COMMIT_NO}</Typography>
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">데이터 소스</Typography>
                  <DataSourceChip value={row.DATA_SOURCE} />
                </Box>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">차체번호</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{row.BODY_NO}</Typography>
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">차체타입</Typography>
                  <Typography variant="body2">{row.BODY_TYPE}</Typography>
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">VIN번호</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{row.VIN_NO}</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">생산일자</Typography>
                  <Typography variant="body2">{formatDate(row.PROD_DATE)}</Typography>
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">외장색상</Typography>
                  <Typography variant="body2">{row.EXT_COLOR}</Typography>
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">MES 연동</Typography>
                  <Typography variant="body2">{row.MES_IF}</Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          {/* ALC 정보 */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>ALC 정보</Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">ALC 전면</Typography>
                  <Typography variant="body2">{row.ALC_FRONT}</Typography>
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="subtitle2" color="text.secondary">ALC 후면</Typography>
                  <Typography variant="body2">{row.ALC_REAR}</Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          {/* 작업 상태 */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>작업 상태</Typography>
            <Stack direction="row" spacing={2}>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="subtitle2" color="text.secondary">작업 플래그</Typography>
                <WorkFlagChip value={row.WORK_FLAG} />
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="subtitle2" color="text.secondary">조립완료</Typography>
                <AssemblyChip value={row.ASSEMBLY_COMPLETE} />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}