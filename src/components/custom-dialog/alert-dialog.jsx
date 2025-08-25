import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AlertDialog({ 
  open, 
  onClose, 
  title = '알림', 
  content = '', 
  severity = 'warning',
  buttonText = '확인',
  ...other 
}) {
  const getSeverityIcon = () => {
    switch (severity) {
      case 'error':
        return <Iconify icon="solar:danger-bold" sx={{ color: 'error.main' }} />;
      case 'warning':
        return <Iconify icon="solar:danger-triangle-bold" sx={{ color: 'warning.main' }} />;
      case 'info':
        return <Iconify icon="solar:info-circle-bold" sx={{ color: 'info.main' }} />;
      case 'success':
        return <Iconify icon="solar:check-circle-bold" sx={{ color: 'success.main' }} />;
      default:
        return <Iconify icon="solar:info-circle-bold" sx={{ color: 'info.main' }} />;
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog 
      fullWidth 
      maxWidth="xs" 
      open={open} 
      onClose={onClose} 
      {...other}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none',
          },
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          {getSeverityIcon()}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </DialogTitle>

      {content && (
        <DialogContent sx={{ textAlign: 'center', pt: 1, position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              whiteSpace: 'pre-line', // \n을 줄바꿈으로 처리
            }}
          >
            {content}
          </Typography>
        </DialogContent>
      )}

      <DialogActions sx={{ justifyContent: 'center', pb: 3, position: 'relative', zIndex: 1 }}>
        <Button 
          variant="contained" 
          color={getSeverityColor()}
          onClick={onClose} 
          autoFocus
          sx={{ 
            minWidth: 100,
            boxShadow: (theme) => theme.customShadows.z8 || '0 8px 16px 0 rgba(0,0,0,0.24)',
          }}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AlertDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  buttonText: PropTypes.string,
}; 