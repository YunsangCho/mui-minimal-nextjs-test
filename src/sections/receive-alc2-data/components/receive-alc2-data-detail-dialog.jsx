import { useState } from 'react';
import { Box, Stack, Typography, Dialog, DialogTitle, DialogContent, IconButton, Chip, Tabs, Tab, Backdrop } from '@mui/material';
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

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`detail-tabpanel-${index}`}
      aria-labelledby={`detail-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export function ReceiveAlc2DataDetailDialog({ open, onClose, row }) {
  const [tabValue, setTabValue] = useState(0);

  if (!row) return null;

  const handleClose = () => {
    onClose();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
      {/* 개선된 백그라운드 */}
      <Backdrop
        sx={{ 
          zIndex: (theme) => theme.zIndex.modal - 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(2px)',
        }}
        open={open}
      />
      
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="lg" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'white',
            boxShadow: 24,
            borderRadius: 2,
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>서열수신 상세정보</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {row.BODY_NO} • {row.VIN_NO}
              </Typography>
            </Box>
            <IconButton 
              onClick={handleClose}
              sx={{ 
                backgroundColor: 'grey.100',
                '&:hover': { backgroundColor: 'grey.200' }
              }}
            >
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>
        </DialogTitle>

        {/* 탭 네비게이션 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ px: 3 }}
          >
            <Tab 
              label="주요정보" 
              icon={<Iconify icon="solar:info-circle-bold" />}
              iconPosition="start"
            />
            <Tab 
              label="상세정보" 
              icon={<Iconify icon="solar:document-text-bold" />}
              iconPosition="start"
            />
            <Tab 
              label="작업상태" 
              icon={<Iconify icon="solar:settings-bold" />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {/* 주요정보 탭 */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 3 }}>
              <Stack spacing={3}>
                {/* 핵심 식별 정보 */}
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'primary.lighter', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'primary.light'
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.dark' }}>핵심 식별정보</Typography>
                  <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">차체번호</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {row.BODY_NO}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">VIN번호</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {row.VIN_NO}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">커밋번호</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {row.COMMIT_NO}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* 생산 정보 */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>생산 정보</Typography>
                  <Stack direction="row" spacing={3} flexWrap="wrap">
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="subtitle2" color="text.secondary">생산일시</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDateTime(row.PROD_DTTM)}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 150 }}>
                      <Typography variant="subtitle2" color="text.secondary">생산일자</Typography>
                      <Typography variant="body1">{formatDate(row.PROD_DATE)}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 150 }}>
                      <Typography variant="subtitle2" color="text.secondary">차체타입</Typography>
                      <Typography variant="body1">{row.BODY_TYPE}</Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* 상태 정보 */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>상태 정보</Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>작업 플래그</Typography>
                      <WorkFlagChip value={row.WORK_FLAG} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>조립완료</Typography>
                      <AssemblyChip value={row.ASSEMBLY_COMPLETE} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>데이터 소스</Typography>
                      <DataSourceChip value={row.DATA_SOURCE} />
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </TabPanel>

          {/* 상세정보 탭 */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 3 }}>
              <Stack spacing={3}>
                {/* ALC 정보 */}
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'success.lighter', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'success.light'
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'success.dark' }}>ALC 정보</Typography>
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">ALC 전면</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{row.ALC_FRONT}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">ALC 후면</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{row.ALC_REAR}</Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* 외관 정보 */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>외관 정보</Typography>
                  <Stack direction="row" spacing={4}>
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="subtitle2" color="text.secondary">외장색상</Typography>
                      <Typography variant="body1">{row.EXT_COLOR}</Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* 시스템 정보 */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>시스템 정보</Typography>
                  <Stack direction="row" spacing={4}>
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="subtitle2" color="text.secondary">MES 연동</Typography>
                      <Typography variant="body1">{row.MES_IF}</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </TabPanel>

          {/* 작업상태 탭 */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ px: 3 }}>
              <Stack spacing={3}>
                {/* 작업 진행 상황 */}
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'warning.lighter', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'warning.light'
                }}>
                  <Typography variant="h6" sx={{ mb: 3, color: 'warning.dark' }}>작업 진행 상황</Typography>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle1" sx={{ minWidth: 120 }}>작업 플래그:</Typography>
                      <WorkFlagChip value={row.WORK_FLAG} />
                      <Typography variant="body2" color="text.secondary">
                        {row.WORK_FLAG === 'T' ? '모든 작업이 완료되었습니다.' : '작업이 진행 중입니다.'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle1" sx={{ minWidth: 120 }}>조립 상태:</Typography>
                      <AssemblyChip value={row.ASSEMBLY_COMPLETE} />
                      <Typography variant="body2" color="text.secondary">
                        {row.ASSEMBLY_COMPLETE === '완료' ? '조립 공정이 완료되었습니다.' : '조립 공정이 진행 중입니다.'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* 데이터 정보 */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>데이터 정보</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ minWidth: 120 }}>데이터 소스:</Typography>
                    <DataSourceChip value={row.DATA_SOURCE} />
                    <Typography variant="body2" color="text.secondary">
                      {row.DATA_SOURCE === 'LIVE' ? '실시간 운영 데이터입니다.' : '백업 데이터입니다.'}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </TabPanel>
        </DialogContent>
      </Dialog>
    </>
  );
}