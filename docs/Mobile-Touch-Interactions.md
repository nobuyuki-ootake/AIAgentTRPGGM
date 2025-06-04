# TRPG Application - Mobile and Touch Interaction Guide

## Document Overview

This document provides comprehensive guidelines for implementing mobile and touch interactions in the TRPG application, ensuring optimal user experience across all touch-enabled devices.

## Table of Contents

1. [Mobile Design Principles](#mobile-design-principles)
2. [Touch Gesture Standards](#touch-gesture-standards)
3. [Responsive Layout Patterns](#responsive-layout-patterns)
4. [Component-Specific Touch Interactions](#component-specific-touch-interactions)
5. [Performance Optimization](#performance-optimization)
6. [Platform-Specific Guidelines](#platform-specific-guidelines)
7. [Testing and Validation](#testing-and-validation)

---

## Mobile Design Principles

### Touch-First Design Philosophy

#### Design Hierarchy
```
Primary Actions (Thumb Zone)
├── Save/Submit buttons
├── Navigation actions
├── Primary dice rolling
└── Character selection

Secondary Actions (Extended Reach)
├── Edit buttons
├── Delete actions
├── Filter controls
└── Settings access

Tertiary Actions (Two-handed reach)
├── Advanced settings
├── Complex form fields
├── Detailed configuration
└── Administrative functions
```

#### Touch Target Guidelines
```css
/* Minimum touch target sizes */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

/* Recommended sizes for different action types */
.primary-action {
  min-height: 56px;
  min-width: 120px;
}

.icon-button {
  min-height: 48px;
  min-width: 48px;
}

.list-item {
  min-height: 56px;
  padding: 16px;
}

/* Adequate spacing between touch targets */
.touch-target + .touch-target {
  margin: 8px;
}
```

### Mobile-First Responsive Strategy

#### Breakpoint System
```scss
// Mobile-first breakpoints
$breakpoints: (
  'mobile': 320px,   // Small phones
  'mobile-lg': 414px, // Large phones
  'tablet': 768px,   // Tablets portrait
  'tablet-lg': 1024px, // Tablets landscape
  'desktop': 1200px  // Desktop and up
);

@mixin respond-to($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

#### Layout Adaptation
```css
/* Mobile layout - single column */
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar {
  display: none; /* Hidden on mobile */
}

/* Tablet layout - hybrid approach */
@media (min-width: 768px) {
  .main-layout {
    flex-direction: row;
  }
  
  .sidebar {
    display: block;
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}

/* Desktop layout - full sidebar */
@media (min-width: 1024px) {
  .sidebar {
    position: static;
    transform: none;
  }
}
```

---

## Touch Gesture Standards

### Basic Touch Gestures

#### Single Touch Gestures
```javascript
class TouchGestureHandler {
  constructor(element) {
    this.element = element;
    this.touchStartTime = 0;
    this.touchStartPosition = { x: 0, y: 0 };
    this.longPressThreshold = 500; // 500ms
    this.swipeThreshold = 50; // 50px minimum distance
    
    this.bindEvents();
  }

  bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  handleTouchStart(event) {
    const touch = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartPosition = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.handleLongPress(touch);
    }, this.longPressThreshold);
  }

  handleTouchMove(event) {
    // Cancel long press if user moves finger
    clearTimeout(this.longPressTimer);
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartPosition.x;
    const deltaY = touch.clientY - this.touchStartPosition.y;
    
    // Handle swipe gestures
    if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
      this.handleSwipe(deltaX, deltaY);
    }
  }

  handleTouchEnd(event) {
    clearTimeout(this.longPressTimer);
    
    const touchDuration = Date.now() - this.touchStartTime;
    const touch = event.changedTouches[0];
    
    // Determine gesture type
    if (touchDuration < 200) {
      this.handleTap(touch);
    } else if (touchDuration < this.longPressThreshold) {
      this.handlePress(touch);
    }
  }

  handleTap(touch) {
    // Quick tap - primary action
    this.element.dispatchEvent(new CustomEvent('tap', {
      detail: { x: touch.clientX, y: touch.clientY }
    }));
  }

  handleLongPress(touch) {
    // Long press - context menu
    this.element.dispatchEvent(new CustomEvent('longpress', {
      detail: { x: touch.clientX, y: touch.clientY }
    }));
  }

  handleSwipe(deltaX, deltaY) {
    const direction = Math.abs(deltaX) > Math.abs(deltaY) 
      ? (deltaX > 0 ? 'right' : 'left')
      : (deltaY > 0 ? 'down' : 'up');
    
    this.element.dispatchEvent(new CustomEvent('swipe', {
      detail: { direction, deltaX, deltaY }
    }));
  }
}
```

#### Multi-Touch Gestures
```javascript
class MultiTouchHandler {
  constructor(element) {
    this.element = element;
    this.initialDistance = 0;
    this.initialScale = 1;
    
    this.bindEvents();
  }

  bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  handleTouchStart(event) {
    if (event.touches.length === 2) {
      // Start pinch gesture
      this.initialDistance = this.getDistance(event.touches[0], event.touches[1]);
    }
  }

  handleTouchMove(event) {
    if (event.touches.length === 2) {
      event.preventDefault(); // Prevent page zoom
      
      const currentDistance = this.getDistance(event.touches[0], event.touches[1]);
      const scale = currentDistance / this.initialDistance;
      
      this.element.dispatchEvent(new CustomEvent('pinch', {
        detail: { scale: scale * this.initialScale }
      }));
    }
  }

  handleTouchEnd(event) {
    if (event.touches.length < 2) {
      // End pinch gesture
      this.initialDistance = 0;
    }
  }
}
```

### Gesture Implementation by Component

#### Character Cards
```javascript
// Character card touch interactions
class CharacterCardTouch {
  constructor(cardElement) {
    this.card = cardElement;
    this.gestureHandler = new TouchGestureHandler(cardElement);
    
    this.setupGestures();
  }

  setupGestures() {
    this.card.addEventListener('tap', this.handleTap.bind(this));
    this.card.addEventListener('longpress', this.handleLongPress.bind(this));
    this.card.addEventListener('swipe', this.handleSwipe.bind(this));
  }

  handleTap(event) {
    // Single tap - select character
    this.selectCharacter();
    this.showHapticFeedback('light');
  }

  handleLongPress(event) {
    // Long press - show context menu
    this.showContextMenu(event.detail.x, event.detail.y);
    this.showHapticFeedback('medium');
  }

  handleSwipe(event) {
    const { direction } = event.detail;
    
    switch (direction) {
      case 'right':
        this.quickEdit();
        break;
      case 'left':
        this.showQuickActions();
        break;
      case 'up':
        this.showCharacterDetails();
        break;
    }
    
    this.showHapticFeedback('light');
  }

  showHapticFeedback(intensity) {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[intensity]);
    }
  }
}
```

#### Timeline Interactions
```javascript
// Timeline touch interactions
class TimelineTouch {
  constructor(timelineElement) {
    this.timeline = timelineElement;
    this.isDragging = false;
    this.draggedEvent = null;
    
    this.setupTouchEvents();
  }

  setupTouchEvents() {
    this.timeline.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.timeline.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.timeline.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  handleTouchStart(event) {
    const eventCard = event.target.closest('.timeline-event');
    if (eventCard) {
      this.startDrag(eventCard, event.touches[0]);
    }
  }

  handleTouchMove(event) {
    if (this.isDragging) {
      event.preventDefault(); // Prevent scrolling
      this.updateDragPosition(event.touches[0]);
      this.highlightDropZones();
    }
  }

  handleTouchEnd(event) {
    if (this.isDragging) {
      this.completeDrag(event.changedTouches[0]);
    }
  }

  startDrag(eventCard, touch) {
    this.isDragging = true;
    this.draggedEvent = eventCard;
    
    // Visual feedback
    eventCard.classList.add('dragging');
    this.showHapticFeedback('light');
    
    // Create drag helper
    this.createDragHelper(eventCard, touch);
  }

  createDragHelper(eventCard, touch) {
    this.dragHelper = eventCard.cloneNode(true);
    this.dragHelper.classList.add('drag-helper');
    this.dragHelper.style.position = 'fixed';
    this.dragHelper.style.pointerEvents = 'none';
    this.dragHelper.style.zIndex = '1000';
    
    document.body.appendChild(this.dragHelper);
    this.updateHelperPosition(touch);
  }

  updateDragPosition(touch) {
    this.updateHelperPosition(touch);
    
    // Find drop target
    const dropTarget = this.findDropTarget(touch.clientX, touch.clientY);
    this.updateDropTarget(dropTarget);
  }

  completeDrag(touch) {
    const dropTarget = this.findDropTarget(touch.clientX, touch.clientY);
    
    if (dropTarget && this.isValidDrop(dropTarget)) {
      this.performDrop(dropTarget);
      this.showHapticFeedback('medium');
    } else {
      this.cancelDrag();
      this.showHapticFeedback('heavy');
    }
    
    this.cleanup();
  }

  cleanup() {
    this.isDragging = false;
    this.draggedEvent.classList.remove('dragging');
    document.body.removeChild(this.dragHelper);
    this.clearDropZones();
  }
}
```

---

## Responsive Layout Patterns

### Adaptive Navigation

#### Mobile Navigation Stack
```jsx
// Responsive navigation component
const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <>
      {isMobile ? (
        <MobileDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <NavigationItems />
        </MobileDrawer>
      ) : (
        <DesktopSidebar>
          <NavigationItems />
        </DesktopSidebar>
      )}
    </>
  );
};

const MobileDrawer = ({ isOpen, onClose, children }) => {
  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={isOpen}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      {children}
    </Drawer>
  );
};
```

#### Bottom Navigation for Primary Actions
```jsx
const MobileBottomNavigation = () => {
  const [value, setValue] = useState(0);
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!isMobile) return null;

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1000
      }} 
      elevation={3}
    >
      <BottomNavigation
        value={value}
        onChange={(event, newValue) => setValue(newValue)}
        showLabels
      >
        <BottomNavigationAction 
          label="Characters" 
          icon={<PeopleIcon />} 
        />
        <BottomNavigationAction 
          label="Timeline" 
          icon={<TimelineIcon />} 
        />
        <BottomNavigationAction 
          label="Session" 
          icon={<DiceIcon />} 
        />
        <BottomNavigationAction 
          label="AI Chat" 
          icon={<ChatIcon />} 
        />
      </BottomNavigation>
    </Paper>
  );
};
```

### Adaptive Form Layouts

#### Mobile Form Optimization
```css
/* Mobile form styles */
.form-container {
  padding: 16px;
}

.form-field {
  margin-bottom: 24px;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  min-height: 48px;
  font-size: 16px; /* Prevent zoom on iOS */
  padding: 12px 16px;
  border-radius: 8px;
}

/* Tablet adjustments */
@media (min-width: 768px) {
  .form-container {
    padding: 24px;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .form-row {
    display: flex;
    gap: 16px;
  }
  
  .form-field {
    flex: 1;
  }
}

/* Floating action button for mobile */
.fab-container {
  position: fixed;
  bottom: 80px; /* Above bottom navigation */
  right: 16px;
  z-index: 999;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  font-size: 24px;
}
```

#### Character Form Mobile Layout
```jsx
const CharacterFormMobile = ({ character, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const steps = [
    'Basic Info',
    'Abilities',
    'Skills',
    'Equipment',
    'Review'
  ];

  if (isMobile) {
    return (
      <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <MobileStepper
          steps={steps.length}
          position="top"
          activeStep={activeStep}
          nextButton={
            <Button
              size="small"
              onClick={() => setActiveStep((prev) => prev + 1)}
              disabled={activeStep === steps.length - 1}
            >
              Next
            </Button>
          }
          backButton={
            <Button 
              size="small" 
              onClick={() => setActiveStep((prev) => prev - 1)}
              disabled={activeStep === 0}
            >
              Back
            </Button>
          }
        />
        
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <CharacterFormStep step={activeStep} character={character} />
        </Box>
        
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={onSave}
            disabled={!isFormValid()}
          >
            Save Character
          </Button>
        </Box>
      </Box>
    );
  }

  return <CharacterFormDesktop character={character} onSave={onSave} />;
};
```

---

## Component-Specific Touch Interactions

### Dice Rolling Interface

#### Mobile Dice UI
```jsx
const MobileDiceInterface = () => {
  const [shakeToRoll, setShakeToRoll] = useState(true);
  const [lastRoll, setLastRoll] = useState(null);

  // Device motion detection for shake-to-roll
  useEffect(() => {
    if (!shakeToRoll) return;

    let lastAcceleration = { x: 0, y: 0, z: 0 };
    let shakeThreshold = 15;

    const handleMotion = (event) => {
      const acceleration = event.accelerationIncludingGravity;
      
      const deltaX = Math.abs(acceleration.x - lastAcceleration.x);
      const deltaY = Math.abs(acceleration.y - lastAcceleration.y);
      const deltaZ = Math.abs(acceleration.z - lastAcceleration.z);
      
      if (deltaX + deltaY + deltaZ > shakeThreshold) {
        performQuickRoll();
      }
      
      lastAcceleration = acceleration;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [shakeToRoll]);

  const performQuickRoll = () => {
    const result = Math.floor(Math.random() * 20) + 1;
    setLastRoll(result);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 100]);
    }
  };

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Dice Rolling
      </Typography>
      
      {shakeToRoll && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Shake your device to roll dice!
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DiceSelector />
        
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<CasinoIcon />}
          onClick={performQuickRoll}
        >
          Roll Dice
        </Button>
        
        <FormControlLabel
          control={
            <Switch
              checked={shakeToRoll}
              onChange={(e) => setShakeToRoll(e.target.checked)}
            />
          }
          label="Shake to Roll"
        />
      </Box>
      
      {lastRoll && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4" color="primary">
            {lastRoll}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last Roll Result
          </Typography>
        </Box>
      )}
    </Box>
  );
};
```

#### Touch-Optimized Dice Selection
```jsx
const TouchDiceSelector = ({ onDiceSelect }) => {
  const diceTypes = [
    { sides: 4, icon: '◆', color: '#FF6B6B' },
    { sides: 6, icon: '⚀', color: '#4ECDC4' },
    { sides: 8, icon: '◇', color: '#45B7D1' },
    { sides: 10, icon: '◯', color: '#96CEB4' },
    { sides: 12, icon: '◉', color: '#FFEAA7' },
    { sides: 20, icon: '●', color: '#DDA0DD' },
  ];

  return (
    <Grid container spacing={1} sx={{ mb: 2 }}>
      {diceTypes.map((dice) => (
        <Grid item xs={4} sm={2} key={dice.sides}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              cursor: 'pointer',
              minHeight: 80,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              backgroundColor: dice.color,
              color: 'white',
              '&:active': {
                transform: 'scale(0.95)',
              },
              transition: 'transform 0.1s ease',
            }}
            onClick={() => onDiceSelect(dice.sides)}
          >
            <Typography variant="h4">{dice.icon}</Typography>
            <Typography variant="caption">d{dice.sides}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};
```

### Timeline Touch Interactions

#### Mobile Timeline Navigation
```jsx
const MobileTimelineView = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [events, setEvents] = useState([]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Day selector */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selectedDay}
          onChange={(e, value) => setSelectedDay(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {Array.from({ length: 10 }, (_, i) => (
            <Tab key={i + 1} label={`Day ${i + 1}`} value={i + 1} />
          ))}
        </Tabs>
      </Box>
      
      {/* Events list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {events
            .filter(event => event.day === selectedDay)
            .map((event) => (
              <SwipeableEventItem
                key={event.id}
                event={event}
                onEdit={() => editEvent(event)}
                onDelete={() => deleteEvent(event.id)}
              />
            ))}
        </List>
      </Box>
      
      {/* Add event FAB */}
      <Fab
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        color="primary"
        onClick={() => addNewEvent(selectedDay)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

const SwipeableEventItem = ({ event, onEdit, onDelete }) => {
  const [swipeDirection, setSwipeDirection] = useState(null);

  const handleSwipe = (direction) => {
    setSwipeDirection(direction);
    
    if (direction === 'right') {
      onEdit();
    } else if (direction === 'left') {
      onDelete();
    }
    
    // Reset after animation
    setTimeout(() => setSwipeDirection(null), 300);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        transform: swipeDirection === 'right' ? 'translateX(60px)' : 
                  swipeDirection === 'left' ? 'translateX(-60px)' : 'translateX(0)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Swipe actions background */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
      }}>
        <Box sx={{ color: 'success.main' }}>
          <EditIcon />
        </Box>
        <Box sx={{ color: 'error.main' }}>
          <DeleteIcon />
        </Box>
      </Box>
      
      {/* Event item */}
      <ListItem
        sx={{ 
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
        onTouchStart={(e) => {
          // Touch handling logic
        }}
      >
        <ListItemText
          primary={event.title}
          secondary={event.description}
        />
      </ListItem>
    </Box>
  );
};
```

### Character Sheet Touch Interface

#### Mobile Character Sheet
```jsx
const MobileCharacterSheet = ({ character }) => {
  const [activeSection, setActiveSection] = useState('stats');

  const sections = [
    { id: 'stats', label: 'Stats', icon: <StatsIcon /> },
    { id: 'skills', label: 'Skills', icon: <SkillsIcon /> },
    { id: 'equipment', label: 'Equipment', icon: <EquipmentIcon /> },
    { id: 'notes', label: 'Notes', icon: <NotesIcon /> },
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Character header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={character.image} sx={{ width: 60, height: 60 }}>
            {character.name[0]}
          </Avatar>
          <Box>
            <Typography variant="h6">{character.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Level {character.level} {character.race} {character.class}
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Section navigation */}
      <BottomNavigation
        value={activeSection}
        onChange={(e, value) => setActiveSection(value)}
        showLabels
      >
        {sections.map((section) => (
          <BottomNavigationAction
            key={section.id}
            label={section.label}
            value={section.id}
            icon={section.icon}
          />
        ))}
      </BottomNavigation>
      
      {/* Section content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <CharacterSection section={activeSection} character={character} />
      </Box>
    </Box>
  );
};

const TouchStatEditor = ({ stat, value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleTouchStart = () => {
    setIsEditing(true);
    setTempValue(value);
  };

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(parseInt(e.target.value))}
          size="small"
          inputProps={{ min: 1, max: 20 }}
        />
        <IconButton onClick={handleSave} color="primary">
          <CheckIcon />
        </IconButton>
        <IconButton onClick={handleCancel}>
          <CloseIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: 'pointer',
        minHeight: 80,
        justifyContent: 'center',
      }}
      onTouchStart={handleTouchStart}
    >
      <Typography variant="h6">{value}</Typography>
      <Typography variant="caption" color="text.secondary">
        {stat}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        ({Math.floor((value - 10) / 2) >= 0 ? '+' : ''}{Math.floor((value - 10) / 2)})
      </Typography>
    </Box>
  );
};
```

---

## Performance Optimization

### Touch Event Optimization

#### Passive Event Listeners
```javascript
// Optimize touch event performance
class TouchOptimizer {
  constructor() {
    this.setupPassiveListeners();
    this.setupTouchCallouts();
  }

  setupPassiveListeners() {
    // Use passive listeners for touch events that don't need preventDefault
    const passiveEvents = ['touchstart', 'touchmove', 'wheel'];
    
    passiveEvents.forEach(eventType => {
      document.addEventListener(eventType, this.handlePassiveTouch, {
        passive: true,
        capture: false
      });
    });
  }

  setupTouchCallouts() {
    // Disable touch callouts and selection for better UX
    const style = document.createElement('style');
    style.textContent = `
      /* Disable touch callouts */
      * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Re-enable selection for text content */
      .selectable-text,
      input,
      textarea {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      
      /* Remove tap highlight */
      * {
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Improve scrolling performance */
      .scrollable {
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);
  }

  handlePassiveTouch(event) {
    // Handle passive touch events without blocking
    // Used for analytics, gestures that don't prevent default
  }
}
```

#### Throttled Touch Handlers
```javascript
// Throttle touch events for better performance
class ThrottledTouchHandler {
  constructor(element, handler, delay = 16) { // 60fps
    this.element = element;
    this.handler = handler;
    this.delay = delay;
    this.lastCall = 0;
    this.timeoutId = null;
    
    this.bindEvents();
  }

  bindEvents() {
    this.element.addEventListener('touchmove', this.throttledHandler.bind(this));
  }

  throttledHandler(event) {
    const now = Date.now();
    
    if (now - this.lastCall >= this.delay) {
      this.lastCall = now;
      this.handler(event);
    } else {
      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => {
        this.lastCall = Date.now();
        this.handler(event);
      }, this.delay - (now - this.lastCall));
    }
  }
}
```

### Memory Management

#### Component Cleanup
```jsx
// Proper cleanup for touch components
const TouchEnabledComponent = () => {
  const elementRef = useRef(null);
  const gestureHandlerRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      gestureHandlerRef.current = new TouchGestureHandler(elementRef.current);
    }

    return () => {
      // Cleanup gesture handlers
      if (gestureHandlerRef.current) {
        gestureHandlerRef.current.destroy();
      }
    };
  }, []);

  return <div ref={elementRef}>Touch-enabled content</div>;
};

// Gesture handler with proper cleanup
class TouchGestureHandler {
  constructor(element) {
    this.element = element;
    this.handlers = new Map();
    this.bindEvents();
  }

  bindEvents() {
    const events = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
    events.forEach(event => {
      const handler = this[`handle${event}`].bind(this);
      this.handlers.set(event, handler);
      this.element.addEventListener(event, handler, { passive: false });
    });
  }

  destroy() {
    this.handlers.forEach((handler, event) => {
      this.element.removeEventListener(event, handler);
    });
    this.handlers.clear();
  }
}
```

---

## Platform-Specific Guidelines

### iOS Specific Optimizations

#### iOS Touch Behavior
```css
/* iOS-specific touch optimizations */
.ios-optimized {
  /* Prevent iOS zoom on input focus */
  font-size: 16px;
  
  /* Improve scrolling momentum */
  -webkit-overflow-scrolling: touch;
  
  /* Remove iOS input styling */
  -webkit-appearance: none;
  
  /* Prevent iOS callouts */
  -webkit-touch-callout: none;
  
  /* Improve tap response */
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

/* iOS safe area support */
.ios-safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* iOS status bar considerations */
@supports (padding: max(0px)) {
  .header {
    padding-top: max(20px, env(safe-area-inset-top));
  }
}
```

#### iOS Gesture Detection
```javascript
// iOS-specific gesture handling
class IOSGestureHandler {
  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (this.isIOS) {
      this.setupIOSGestures();
    }
  }

  setupIOSGestures() {
    // Handle iOS-specific touch events
    document.addEventListener('gesturestart', this.handleGestureStart.bind(this));
    document.addEventListener('gesturechange', this.handleGestureChange.bind(this));
    document.addEventListener('gestureend', this.handleGestureEnd.bind(this));
  }

  handleGestureStart(event) {
    event.preventDefault(); // Prevent iOS zoom
  }

  handleGestureChange(event) {
    event.preventDefault();
    // Handle pinch gestures
    const scale = event.scale;
    this.onPinch(scale);
  }

  handleGestureEnd(event) {
    event.preventDefault();
  }
}
```

### Android Specific Optimizations

#### Android Touch Handling
```javascript
// Android-specific optimizations
class AndroidTouchHandler {
  constructor() {
    this.isAndroid = /Android/.test(navigator.userAgent);
    if (this.isAndroid) {
      this.setupAndroidOptimizations();
    }
  }

  setupAndroidOptimizations() {
    // Handle Android Chrome's viewport changes
    window.addEventListener('resize', this.handleViewportChange.bind(this));
    
    // Optimize for Android's touch latency
    this.setupFastClick();
  }

  handleViewportChange() {
    // Handle keyboard appearance on Android
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.clientHeight;
    
    if (windowHeight < documentHeight * 0.75) {
      // Keyboard is likely visible
      document.body.classList.add('keyboard-visible');
    } else {
      document.body.classList.remove('keyboard-visible');
    }
  }

  setupFastClick() {
    // Implement fast click for Android
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}
```

---

## Testing and Validation

### Touch Testing Framework

#### Automated Touch Testing
```javascript
// Playwright touch testing
import { test, expect } from '@playwright/test';

test('mobile dice rolling interface', async ({ page }) => {
  await page.goto('/session');
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

  // Test tap gesture
  await page.tap('.dice-button');
  await expect(page.locator('.dice-result')).toBeVisible();

  // Test swipe gesture
  await page.touchStart('.timeline-event', { x: 100, y: 100 });
  await page.touchMove('.timeline-event', { x: 200, y: 100 });
  await page.touchEnd('.timeline-event');
  
  await expect(page.locator('.swipe-action')).toBeVisible();
});

test('mobile character sheet navigation', async ({ page }) => {
  await page.goto('/characters/new');
  await page.setViewportSize({ width: 375, height: 667 });

  // Test mobile stepper navigation
  await page.tap('.next-button');
  await expect(page.locator('[data-step="1"]')).toBeVisible();

  // Test form field touch
  await page.tap('[name="character-name"]');
  await page.fill('[name="character-name"]', 'Test Character');
  
  // Verify mobile keyboard doesn't break layout
  const layoutHeight = await page.evaluate(() => document.body.scrollHeight);
  expect(layoutHeight).toBeGreaterThan(0);
});
```

#### Manual Testing Checklist

**Touch Gesture Testing:**
- [ ] Tap gestures work on all interactive elements
- [ ] Long press shows context menus where appropriate
- [ ] Swipe gestures navigate correctly
- [ ] Pinch gestures zoom maps and images
- [ ] Double tap actions work as expected

**Mobile Layout Testing:**
- [ ] All content fits on mobile screens
- [ ] Touch targets are at least 44px
- [ ] Text is readable without zooming
- [ ] Forms are easy to complete on mobile
- [ ] Navigation is accessible with thumbs

**Performance Testing:**
- [ ] Touch events respond within 100ms
- [ ] Scrolling is smooth (60fps)
- [ ] No touch delay or lag
- [ ] Memory usage stays reasonable
- [ ] Battery usage is optimized

**Cross-Device Testing:**
- [ ] iPhone (various sizes)
- [ ] Android phones (various sizes)
- [ ] iPads
- [ ] Android tablets
- [ ] Touch-enabled laptops

This comprehensive mobile and touch interaction guide ensures the TRPG application provides an optimal experience across all touch-enabled devices, with platform-specific optimizations and thorough testing procedures.