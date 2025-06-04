import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Switch,
  Divider
} from '@mui/material';
import { AccessibilityChecker, AccessibilityTestPanel } from '../components/accessibility';

/**
 * Accessibility Testing Page
 * Demonstrates proper accessibility implementation and provides testing tools
 * This page serves as both an example and a testing ground for accessibility features
 */

const AccessibilityTestPage: React.FC = () => {
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [formData, setFormData] = useState({
    characterName: '',
    characterClass: '',
    level: 1,
    hasAdvantage: false,
    diceType: 'd20'
  });
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDiceRoll = async () => {
    setIsRolling(true);
    
    // Simulate dice rolling with delay
    setTimeout(() => {
      const sides = parseInt(formData.diceType.substring(1));
      const result = Math.floor(Math.random() * sides) + 1;
      setDiceResult(result);
      setIsRolling(false);
      
      // Announce result to screen readers
      const announcement = `Rolled ${formData.diceType}: ${result}`;
      announceToScreenReader(announcement);
    }, 1000);
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <header>
        <Typography variant="h1" component="h1" gutterBottom>
          Accessibility Testing Page
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          This page demonstrates proper accessibility implementation for TRPG components
          and provides tools for testing accessibility compliance.
        </Typography>
      </header>

      {/* Main Content */}
      <main>
        {/* Controls Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h2" component="h2" gutterBottom>
              Testing Controls
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showTestPanel}
                    onChange={(e) => setShowTestPanel(e.target.checked)}
                    inputProps={{ 'aria-describedby': 'test-panel-description' }}
                  />
                }
                label="Show Accessibility Test Panel"
              />
              <Typography 
                variant="caption" 
                id="test-panel-description" 
                color="text.secondary"
              >
                Toggle the accessibility testing panel to analyze this page
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Character Creation Form - Accessibility Example */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h2" component="h2" gutterBottom>
              Character Creation Form
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Example of properly labeled form elements for TRPG character creation
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="character-name"
                  label="Character Name"
                  value={formData.characterName}
                  onChange={(e) => handleFormChange('characterName', e.target.value)}
                  helperText="Enter your character's name"
                  required
                  inputProps={{
                    'aria-describedby': 'character-name-helper',
                    maxLength: 50
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="character-class-label">Character Class</InputLabel>
                  <Select
                    labelId="character-class-label"
                    id="character-class"
                    value={formData.characterClass}
                    label="Character Class"
                    onChange={(e) => handleFormChange('characterClass', e.target.value)}
                    aria-describedby="character-class-helper"
                  >
                    <MenuItem value="fighter">Fighter</MenuItem>
                    <MenuItem value="wizard">Wizard</MenuItem>
                    <MenuItem value="rogue">Rogue</MenuItem>
                    <MenuItem value="cleric">Cleric</MenuItem>
                  </Select>
                  <Typography 
                    variant="caption" 
                    id="character-class-helper" 
                    color="text.secondary"
                  >
                    Select your character's class
                  </Typography>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="character-level"
                  label="Level"
                  type="number"
                  value={formData.level}
                  onChange={(e) => handleFormChange('level', parseInt(e.target.value) || 1)}
                  inputProps={{
                    min: 1,
                    max: 20,
                    'aria-describedby': 'level-helper'
                  }}
                />
                <Typography 
                  variant="caption" 
                  id="level-helper" 
                  color="text.secondary"
                  display="block"
                >
                  Character level (1-20)
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasAdvantage}
                      onChange={(e) => handleFormChange('hasAdvantage', e.target.checked)}
                      inputProps={{
                        'aria-describedby': 'advantage-description'
                      }}
                    />
                  }
                  label="Character has advantage on rolls"
                />
                <Typography 
                  variant="caption" 
                  id="advantage-description" 
                  color="text.secondary"
                  display="block"
                >
                  When checked, dice rolls will use advantage rules (roll twice, take higher)
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Dice Rolling Interface - Accessibility Example */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h2" component="h2" gutterBottom>
              Dice Rolling Interface
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Example of accessible dice rolling with proper announcements
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="dice-type-label">Dice Type</InputLabel>
                  <Select
                    labelId="dice-type-label"
                    id="dice-type"
                    value={formData.diceType}
                    label="Dice Type"
                    onChange={(e) => handleFormChange('diceType', e.target.value)}
                    aria-describedby="dice-type-helper"
                  >
                    <MenuItem value="d4">d4 (4-sided die)</MenuItem>
                    <MenuItem value="d6">d6 (6-sided die)</MenuItem>
                    <MenuItem value="d8">d8 (8-sided die)</MenuItem>
                    <MenuItem value="d10">d10 (10-sided die)</MenuItem>
                    <MenuItem value="d12">d12 (12-sided die)</MenuItem>
                    <MenuItem value="d20">d20 (20-sided die)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleDiceRoll}
                  disabled={isRolling}
                  aria-describedby="roll-button-description"
                  fullWidth
                >
                  {isRolling ? 'Rolling...' : `Roll ${formData.diceType}`}
                </Button>
                <Typography 
                  variant="caption" 
                  id="roll-button-description" 
                  color="text.secondary"
                  display="block"
                  textAlign="center"
                  mt={1}
                >
                  Click or press Enter/Space to roll the dice
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                {/* Dice Result Display with Live Region */}
                <Box 
                  sx={{ 
                    p: 2, 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    textAlign: 'center',
                    minHeight: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="h6" component="h3">
                    Result
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={diceResult ? `Dice result: ${diceResult}` : 'No dice result yet'}
                  >
                    {isRolling ? (
                      <span aria-label="Rolling dice">🎲</span>
                    ) : diceResult !== null ? (
                      diceResult
                    ) : (
                      '—'
                    )}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {formData.hasAdvantage && diceResult !== null && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography component="div">
                  <strong>Advantage:</strong> This roll used advantage rules.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Accessibility Guidelines */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h2" component="h2" gutterBottom>
              Accessibility Implementation Guidelines
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h3" component="h3" gutterBottom>
                  Form Accessibility
                </Typography>
                <ul>
                  <li>All form fields have proper labels using <code>label</code> elements or <code>aria-label</code></li>
                  <li>Helper text is associated using <code>aria-describedby</code></li>
                  <li>Required fields are marked with <code>required</code> attribute</li>
                  <li>Error states use <code>aria-invalid</code> and proper error descriptions</li>
                </ul>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h3" component="h3" gutterBottom>
                  Interactive Elements
                </Typography>
                <ul>
                  <li>Buttons have descriptive text or <code>aria-label</code></li>
                  <li>All interactive elements are keyboard accessible</li>
                  <li>Focus indicators are clearly visible</li>
                  <li>Loading states are announced to screen readers</li>
                </ul>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h3" component="h3" gutterBottom>
                  Live Regions
                </Typography>
                <ul>
                  <li>Dynamic content uses <code>aria-live</code> regions</li>
                  <li>Dice results are announced with <code>role="status"</code></li>
                  <li>Important alerts use <code>aria-live="assertive"</code></li>
                  <li>Status updates use <code>aria-live="polite"</code></li>
                </ul>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h3" component="h3" gutterBottom>
                  Semantic Structure
                </Typography>
                <ul>
                  <li>Proper heading hierarchy (h1 → h2 → h3)</li>
                  <li>Landmark roles for page navigation</li>
                  <li>Meaningful page titles and meta descriptions</li>
                  <li>Logical tab order throughout the interface</li>
                </ul>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </main>

      {/* Accessibility Checker - Always visible for testing */}
      <AccessibilityChecker 
        autoCheck={false}
        showResults={true}
      />

      {/* Accessibility Test Panel - Conditional */}
      {showTestPanel && (
        <AccessibilityTestPanel 
          defaultOpen={true}
          position="relative"
        />
      )}
    </Container>
  );
};

export default AccessibilityTestPage;