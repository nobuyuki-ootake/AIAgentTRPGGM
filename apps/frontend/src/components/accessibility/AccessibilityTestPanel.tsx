import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Divider,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Accessibility as AccessibilityIcon,
  Keyboard as KeyboardIcon,
  Visibility as VisibilityIcon,
  VolumeUp as VolumeUpIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAccessibility, useKeyboardNavigation, useScreenReader } from '../../hooks/useAccessibility';
import { generateAccessibilityReport } from '../../utils/accessibilityUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`accessibility-tabpanel-${index}`}
      aria-labelledby={`accessibility-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface AccessibilityTestPanelProps {
  /** Target element to test, defaults to document.body */
  targetElement?: Element;
  /** Whether to show the panel initially */
  defaultOpen?: boolean;
  /** Position of the panel */
  position?: 'fixed' | 'relative';
}

const AccessibilityTestPanel: React.FC<AccessibilityTestPanelProps> = ({
  targetElement,
  defaultOpen = false,
  position = 'fixed'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [currentTab, setCurrentTab] = useState(0);
  const [autoCheck, setAutoCheck] = useState(false);
  const [report, setReport] = useState<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    violations,
    isChecking,
    hasViolations,
    violationCount,
    checkAccessibility
  } = useAccessibility({
    autoCheck,
    targetElement,
    watchMutations: autoCheck
  });

  const {
    focusableElements,
    simulateTabNavigation,
    checkTabOrder
  } = useKeyboardNavigation();

  const {
    isScreenReaderDetected,
    announceToScreenReader,
    checkAriaLabels
  } = useScreenReader();

  const handleGenerateReport = useCallback(async () => {
    const element = targetElement || document.body;
    const fullReport = generateAccessibilityReport(element);
    setReport(fullReport);
    announceToScreenReader(`Accessibility report generated. Found ${fullReport.overall.passedChecks} passed checks out of ${fullReport.overall.totalChecks} total checks.`);
  }, [targetElement, announceToScreenReader]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleTestKeyboardNavigation = useCallback(() => {
    simulateTabNavigation();
    announceToScreenReader('Starting keyboard navigation simulation');
  }, [simulateTabNavigation, announceToScreenReader]);

  const handleTestAriaLabels = useCallback(() => {
    const results = checkAriaLabels(targetElement);
    announceToScreenReader(`Found ${results.length} elements with ARIA labels`);
  }, [checkAriaLabels, targetElement, announceToScreenReader]);

  const getSeverityColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'error';
      case 'serious': return 'error';
      case 'moderate': return 'warning';
      case 'minor': return 'info';
      default: return 'default';
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="contained"
        color="primary"
        startIcon={<AccessibilityIcon />}
        onClick={() => setIsOpen(true)}
        sx={{
          position: position,
          bottom: 16,
          right: 16,
          zIndex: 1300,
          boxShadow: 3
        }}
      >
        A11y Test Panel
      </Button>
    );
  }

  return (
    <Paper
      ref={panelRef}
      elevation={8}
      sx={{
        position: position,
        bottom: 16,
        right: 16,
        width: 480,
        maxHeight: '70vh',
        overflow: 'auto',
        zIndex: 1300,
        ...(position === 'relative' && {
          position: 'relative',
          bottom: 'auto',
          right: 'auto',
          margin: 2
        })
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessibilityIcon />
          Accessibility Test Panel
        </Typography>
        <Button size="small" onClick={() => setIsOpen(false)}>
          ✕
        </Button>
      </Box>

      <Box sx={{ px: 2, pb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={autoCheck}
              onChange={(e) => setAutoCheck(e.target.checked)}
            />
          }
          label="Auto-check on changes"
        />
        
        {isScreenReaderDetected && (
          <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
            Screen reader detected - Enhanced testing mode
          </Alert>
        )}
      </Box>

      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Accessibility test tabs"
      >
        <Tab
          icon={<AccessibilityIcon />}
          label="Overview"
          id="accessibility-tab-0"
          aria-controls="accessibility-tabpanel-0"
        />
        <Tab
          icon={<KeyboardIcon />}
          label="Keyboard"
          id="accessibility-tab-1"
          aria-controls="accessibility-tabpanel-1"
        />
        <Tab
          icon={<VolumeUpIcon />}
          label="Screen Reader"
          id="accessibility-tab-2"
          aria-controls="accessibility-tabpanel-2"
        />
        <Tab
          icon={<VisibilityIcon />}
          label="Visual"
          id="accessibility-tab-3"
          aria-controls="accessibility-tabpanel-3"
        />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => checkAccessibility()}
            disabled={isChecking}
            size="small"
          >
            {isChecking ? 'Checking...' : 'Run Quick Check'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleGenerateReport}
            size="small"
          >
            Full Report
          </Button>
        </Box>

        {violationCount > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Found {violationCount} accessibility violations
          </Alert>
        )}

        {violations.length > 0 && (
          <List dense>
            {violations.slice(0, 5).map((violation, index) => (
              <ListItem key={`${violation.id}-${index}`}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={violation.impact}
                        color={getSeverityColor(violation.impact) as any}
                        size="small"
                      />
                      <Typography variant="body2">{violation.description}</Typography>
                    </Box>
                  }
                  secondary={violation.help}
                />
              </ListItem>
            ))}
          </List>
        )}

        {report && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accessibility Score: {report.overall.score}%
                <Chip
                  label={report.overall.level}
                  color={report.overall.level === 'AAA' ? 'success' : report.overall.level === 'AA' ? 'primary' : 'warning'}
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {report.overall.passedChecks} of {report.overall.totalChecks} checks passed
              </Typography>
              
              {report.recommendations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Recommendations:</Typography>
                  <List dense>
                    {report.recommendations.map((rec: string, index: number) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleTestKeyboardNavigation}
            size="small"
            startIcon={<KeyboardIcon />}
          >
            Test Tab Navigation
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const tabOrder = checkTabOrder();
              console.log('Tab order:', tabOrder);
            }}
            size="small"
          >
            Check Tab Order
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mb: 1 }}>
          Focusable elements found: {focusableElements.length}
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Keyboard Testing Guide</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Tab Navigation"
                  secondary="Press Tab to move forward, Shift+Tab to move backward"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Enter/Space"
                  secondary="Activate buttons and links with Enter or Space"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Arrow Keys"
                  secondary="Navigate within menus and radio groups"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Escape"
                  secondary="Close modals and cancel operations"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleTestAriaLabels}
            size="small"
            startIcon={<VolumeUpIcon />}
          >
            Check ARIA Labels
          </Button>
          <Button
            variant="outlined"
            onClick={() => announceToScreenReader('This is a test announcement')}
            size="small"
          >
            Test Announcement
          </Button>
        </Box>

        {isScreenReaderDetected && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Screen reader or assistive technology detected
          </Alert>
        )}

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Screen Reader Testing</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Labels"
                  secondary="All interactive elements should have accessible names"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Landmarks"
                  secondary="Use semantic HTML and ARIA landmarks for navigation"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Live Regions"
                  secondary="Dynamic content should be announced via aria-live"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Headings"
                  secondary="Use proper heading hierarchy (h1-h6)"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Visual accessibility testing tools and checks
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Color Contrast</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 1 }}>
              WCAG 2.1 Requirements:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Normal text: 4.5:1 (AA), 7:1 (AAA)"
                  secondary="Text smaller than 18px or 14px bold"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Large text: 3:1 (AA), 4.5:1 (AAA)"
                  secondary="Text 18px+ or 14px+ bold"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Focus Indicators</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              All interactive elements must have visible focus indicators when navigated with keyboard.
              Focus should be clearly visible and not rely on color alone.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Visual Hierarchy</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Heading Structure"
                  secondary="Use h1-h6 in logical order, don't skip levels"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Visual Grouping"
                  secondary="Related content should be visually grouped"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Information Hierarchy"
                  secondary="Most important content should be visually prominent"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </TabPanel>
    </Paper>
  );
};

export default AccessibilityTestPanel;