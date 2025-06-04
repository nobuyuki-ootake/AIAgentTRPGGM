import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Refresh,
  Error as ErrorIcon,
  Warning,
  Info,
  AccessTime,
  WifiOff,
  Psychology,
  Lock,
  Speed,
  Storage,
  Help
} from '@mui/icons-material';
import { LoadingError, LoadingErrorHandler } from '../../utils/loadingErrorHandler';

interface LoadingErrorDisplayProps {
  error: LoadingError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

const iconMap = {
  AccessTime,
  WifiOff,
  Error: ErrorIcon,
  Psychology,
  Warning,
  Lock,
  Speed,
  Storage,
  Help
};

export const LoadingErrorDisplay: React.FC<LoadingErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  compact = false
}) => {
  const [expanded, setExpanded] = React.useState(showDetails);
  
  const severity = LoadingErrorHandler.getErrorSeverity(error.type);
  const iconName = LoadingErrorHandler.getErrorTypeIcon(error.type);
  const IconComponent = iconMap[iconName as keyof typeof iconMap] || Help;
  const recoveryActions = LoadingErrorHandler.getRecoveryActions(error.type);
  const canRetry = LoadingErrorHandler.shouldRetry(error);
  const userMessage = LoadingErrorHandler.formatErrorForUser(error);

  if (compact) {
    return (
      <Alert 
        severity={severity}
        action={
          <Box display="flex" gap={1}>
            {canRetry && onRetry && (
              <Button size="small" onClick={onRetry} startIcon={<Refresh />}>
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button size="small" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </Box>
        }
      >
        {userMessage}
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <IconComponent 
            color={severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info'}
            sx={{ mt: 0.5 }}
          />
          
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h6" color={`${severity}.main`}>
                {error.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Error
              </Typography>
              
              <Chip
                label={`${error.currentRetries || 0}/${error.maxRetries || 1} attempts`}
                size="small"
                variant="outlined"
                color={severity}
              />
              
              {recoveryActions.length > 0 && (
                <IconButton
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </Box>
            
            <Typography variant="body1" gutterBottom>
              {userMessage}
            </Typography>
            
            {error.code && (
              <Typography variant="caption" color="text.secondary">
                Error Code: {error.code}
              </Typography>
            )}
            
            <Collapse in={expanded}>
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Suggested Actions:
                </Typography>
                <List dense>
                  {recoveryActions.map((action, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main'
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={action}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                {error.context && (
                  <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="caption" color="text.secondary">
                      Error Details:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ mt: 1, fontSize: '0.75rem' }}>
                      {JSON.stringify(error.context, null, 2)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        </Box>
        
        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          {onDismiss && (
            <Button onClick={onDismiss} variant="outlined">
              Dismiss
            </Button>
          )}
          
          {canRetry && onRetry && (
            <Button
              onClick={onRetry}
              variant="contained"
              startIcon={<Refresh />}
              color={severity === 'error' ? 'primary' : severity}
            >
              Retry Operation
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Multiple errors display
export const LoadingErrorList: React.FC<{
  errors: LoadingError[];
  onRetry?: (errorId: string) => void;
  onDismiss?: (errorId: string) => void;
  onDismissAll?: () => void;
}> = ({ errors, onRetry, onDismiss, onDismissAll }) => {
  if (errors.length === 0) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {errors.length} Error{errors.length !== 1 ? 's' : ''} Occurred
        </Typography>
        
        {onDismissAll && errors.length > 1 && (
          <Button size="small" onClick={onDismissAll}>
            Dismiss All
          </Button>
        )}
      </Box>
      
      <Box display="flex" flexDirection="column" gap={2}>
        {errors.map((error) => (
          <LoadingErrorDisplay
            key={error.id}
            error={error}
            onRetry={onRetry ? () => onRetry(error.id) : undefined}
            onDismiss={onDismiss ? () => onDismiss(error.id) : undefined}
            compact={errors.length > 3}
          />
        ))}
      </Box>
    </Box>
  );
};

// Inline error for small spaces
export const LoadingErrorInline: React.FC<{
  error: LoadingError;
  onRetry?: () => void;
}> = ({ error, onRetry }) => {
  const severity = LoadingErrorHandler.getErrorSeverity(error.type);
  const canRetry = LoadingErrorHandler.shouldRetry(error);
  
  return (
    <Alert 
      severity={severity}
      size="small"
      action={
        canRetry && onRetry ? (
          <Button size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {LoadingErrorHandler.formatErrorForUser(error)}
    </Alert>
  );
};

export default LoadingErrorDisplay;