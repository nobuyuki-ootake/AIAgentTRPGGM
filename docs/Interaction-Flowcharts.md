# TRPG Application - Interaction Flowcharts and State Diagrams

## Document Overview

This document provides detailed flowcharts and state diagrams for key interaction patterns in the TRPG application. These diagrams serve as visual guides for developers and UX designers implementing user interactions.

## Character Creation Flow

```mermaid
flowchart TD
    A[Start Character Creation] --> B{Developer Mode?}
    B -->|Yes| C[Show All Options]
    B -->|No| D[Show Simplified UI]
    
    C --> E[Template Selection]
    D --> E
    
    E --> F{Template Selected?}
    F -->|Yes| G[Pre-populate Fields]
    F -->|No| H[Empty Form]
    
    G --> I[Basic Info Tab]
    H --> I
    
    I --> J[Real-time Validation]
    J --> K{Field Valid?}
    K -->|No| L[Show Error Message]
    L --> I
    K -->|Yes| M[Enable Navigation]
    
    M --> N[Next Tab Available]
    N --> O{All Required Fields Complete?}
    O -->|No| P[Continue Editing]
    O -->|Yes| Q[Enable Save Button]
    
    P --> I
    Q --> R[Save Character]
    R --> S[Success Notification]
    S --> T[Return to Character List]
```

## Dice Rolling Interaction Flow

```mermaid
flowchart TD
    A[Open Dice Roll UI] --> B[Configuration Tab Active]
    B --> C{Quick Preset Used?}
    C -->|Yes| D[Apply Preset Values]
    C -->|No| E[Manual Configuration]
    
    D --> F[Configure Dice Settings]
    E --> F
    
    F --> G{Visualization Enabled?}
    G -->|Yes| H[Switch to Visualization Tab]
    G -->|No| I[Instant Roll Mode]
    
    H --> J[Start Animation]
    J --> K[Sequential Dice Rolls]
    K --> L[Display Individual Results]
    L --> M[Calculate Total]
    M --> N[Show Final Result]
    
    I --> O[Generate Random Results]
    O --> M
    
    N --> P[Send to Session Chat]
    P --> Q[Close Dialog or Continue]
```

## AI Chat Integration Flow

```mermaid
flowchart TD
    A[User Opens AI Chat] --> B[Initialize Chat Panel]
    B --> C[Load Context Elements]
    C --> D{Elements Selected?}
    D -->|Yes| E[Display Context Chips]
    D -->|No| F[Show Context Help]
    
    E --> G[User Types Message]
    F --> G
    
    G --> H[Message Input Validation]
    H --> I{Valid Message?}
    I -->|No| J[Show Input Error]
    I -->|Yes| K[Send to AI Service]
    
    J --> G
    K --> L[Show Loading State]
    L --> M{AI Response Success?}
    M -->|No| N[Show Error Message]
    M -->|Yes| O[Parse AI Response]
    
    N --> P[Offer Retry Option]
    P --> K
    
    O --> Q{Response Type?}
    Q -->|Text| R[Display Formatted Text]
    Q -->|Structured| S[Show Apply Options]
    Q -->|Choices| T[Show Selection UI]
    
    R --> U[Conversation Continues]
    S --> V[Apply to Form Fields]
    T --> W[User Selects Option]
    
    V --> U
    W --> U
```

## Timeline Event Management Flow

```mermaid
flowchart TD
    A[Timeline Page Load] --> B[Render Timeline Grid]
    B --> C[Load Existing Events]
    C --> D[Display Events on Grid]
    
    D --> E{User Action?}
    E -->|Add Event| F[Show Event Dialog]
    E -->|Edit Event| G[Open Edit Dialog]
    E -->|Drag Event| H[Start Drag Operation]
    E -->|Delete Event| I[Confirm Deletion]
    
    F --> J[Event Creation Form]
    G --> J
    
    J --> K[Form Validation]
    K --> L{Valid?}
    L -->|No| M[Show Validation Errors]
    L -->|Yes| N[Save Event]
    
    M --> J
    N --> O[Update Timeline Grid]
    O --> P[Show Success Message]
    
    H --> Q[Drag Feedback]
    Q --> R{Valid Drop Zone?}
    R -->|No| S[Show Invalid Drop]
    R -->|Yes| T[Highlight Drop Zone]
    
    S --> U[Return to Original Position]
    T --> V[Drop Event]
    V --> W[Update Event Position]
    W --> O
    
    I --> X{Confirm Delete?}
    X -->|No| Y[Cancel Operation]
    X -->|Yes| Z[Remove Event]
    Z --> O
```

## Form Validation State Machine

```mermaid
stateDiagram-v2
    [*] --> Untouched
    Untouched --> Focused : Focus Input
    Focused --> Typing : Start Typing
    Typing --> Validating : Input Change
    Validating --> Valid : Validation Passes
    Validating --> Invalid : Validation Fails
    Valid --> Typing : Continue Editing
    Invalid --> Typing : Continue Editing
    Valid --> Blurred : Lose Focus
    Invalid --> Blurred : Lose Focus
    Blurred --> Focused : Regain Focus
    Valid --> Submitted : Submit Form
    Submitted --> [*]
```

## Navigation State Flow

```mermaid
stateDiagram-v2
    [*] --> Home
    Home --> CharacterManagement : Navigate to Characters
    Home --> TimelineManagement : Navigate to Timeline
    Home --> WorldBuilding : Navigate to World Building
    Home --> TRPGSession : Start Session
    
    CharacterManagement --> CharacterCreation : Add Character
    CharacterCreation --> CharacterManagement : Save Character
    CharacterManagement --> CharacterEditing : Edit Character
    CharacterEditing --> CharacterManagement : Update Character
    
    TimelineManagement --> EventCreation : Add Event
    EventCreation --> TimelineManagement : Save Event
    TimelineManagement --> EventEditing : Edit Event
    EventEditing --> TimelineManagement : Update Event
    
    WorldBuilding --> PlaceManagement : Manage Places
    WorldBuilding --> CultureManagement : Manage Cultures
    WorldBuilding --> MapEditing : Edit Interactive Map
    
    TRPGSession --> DiceRolling : Roll Dice
    TRPGSession --> SkillChecks : Perform Skill Check
    TRPGSession --> CharacterActions : Character Actions
    
    DiceRolling --> TRPGSession : Return to Session
    SkillChecks --> TRPGSession : Return to Session
    CharacterActions --> TRPGSession : Return to Session
    
    CharacterManagement --> Home : Return Home
    TimelineManagement --> Home : Return Home
    WorldBuilding --> Home : Return Home
    TRPGSession --> Home : End Session
```

## AI Auto-complete Flow

```mermaid
sequenceDiagram
    participant User
    participant Input
    participant AIService
    participant Suggestion
    participant Form

    User->>Input: Focus on field
    Input->>AIService: Request suggestions
    AIService->>AIService: Analyze context
    AIService->>Suggestion: Return suggestions
    Suggestion->>User: Display suggestion popup
    
    alt User accepts suggestion
        User->>Suggestion: Click accept
        Suggestion->>Form: Apply suggestion
        Form->>User: Update field value
    else User rejects suggestion
        User->>Suggestion: Click reject or continue typing
        Suggestion->>User: Hide popup
    else User ignores suggestion
        User->>Input: Continue typing
        Suggestion->>User: Auto-hide after timeout
    end
```

## Error Handling Flow

```mermaid
flowchart TD
    A[User Action] --> B[Action Processing]
    B --> C{Success?}
    C -->|Yes| D[Show Success Feedback]
    C -->|No| E[Determine Error Type]
    
    E --> F{Error Type}
    F -->|Network| G[Network Error Handler]
    F -->|Validation| H[Validation Error Handler]
    F -->|AI Service| I[AI Error Handler]
    F -->|System| J[System Error Handler]
    
    G --> K[Show Network Error Message]
    H --> L[Show Field Validation Errors]
    I --> M[Show AI Service Error]
    J --> N[Show System Error Message]
    
    K --> O[Offer Retry Option]
    L --> P[Focus First Error Field]
    M --> Q[Suggest Alternative Action]
    N --> R[Offer Support Contact]
    
    O --> S{User Retries?}
    S -->|Yes| B
    S -->|No| T[User Continues]
    
    P --> U[User Corrects Input]
    U --> B
    
    Q --> V{Alternative Available?}
    V -->|Yes| W[Switch to Manual Mode]
    V -->|No| T
    
    W --> B
    R --> T
    D --> T
```

## Mobile Touch Interaction Flow

```mermaid
flowchart TD
    A[Touch Start] --> B[Detect Gesture Type]
    B --> C{Gesture?}
    C -->|Tap| D[Single Touch Point]
    C -->|Long Press| E[Hold Timer Start]
    C -->|Swipe| F[Track Movement]
    C -->|Pinch| G[Two Touch Points]
    
    D --> H[Touch End Quick]
    H --> I[Execute Tap Action]
    
    E --> J{Timer Expires?}
    J -->|Yes| K[Show Context Menu]
    J -->|No| L[Touch End Early]
    L --> I
    
    F --> M[Calculate Direction]
    M --> N[Execute Swipe Action]
    
    G --> O[Calculate Scale]
    O --> P[Execute Zoom Action]
    
    I --> Q[Provide Haptic Feedback]
    K --> Q
    N --> Q
    P --> Q
    
    Q --> R[Update UI State]
    R --> S[End Interaction]
```

## Accessibility Navigation Flow

```mermaid
flowchart TD
    A[Page Load] --> B[Set Focus to Main Content]
    B --> C[Announce Page Change]
    C --> D[User Navigation Input]
    
    D --> E{Input Type?}
    E -->|Tab| F[Move to Next Element]
    E -->|Shift+Tab| G[Move to Previous Element]
    E -->|Arrow Keys| H[Navigate Within Component]
    E -->|Enter/Space| I[Activate Element]
    E -->|Escape| J[Close/Cancel Action]
    
    F --> K[Check Element Visibility]
    G --> K
    K --> L{Element Visible?}
    L -->|No| M[Skip to Next Focusable]
    L -->|Yes| N[Set Focus]
    
    H --> O[Component-Specific Navigation]
    I --> P[Execute Action]
    J --> Q[Return to Previous State]
    
    N --> R[Announce Focus Change]
    O --> R
    P --> S[Announce Action Result]
    Q --> R
    
    R --> T[Wait for Next Input]
    S --> T
    T --> D
```

## Session State Management Flow

```mermaid
stateDiagram-v2
    [*] --> SessionClosed
    SessionClosed --> SessionStarting : Start Session
    SessionStarting --> SessionActive : Initialization Complete
    
    SessionActive --> CharacterAction : Character Turn
    SessionActive --> DiceRoll : Roll Required
    SessionActive --> SkillCheck : Skill Test
    SessionActive --> CombatMode : Combat Initiated
    
    CharacterAction --> SessionActive : Action Complete
    DiceRoll --> SessionActive : Roll Complete
    SkillCheck --> SessionActive : Check Complete
    
    CombatMode --> Initiative : Roll Initiative
    Initiative --> CombatRound : Order Established
    CombatRound --> CharacterTurn : Next Character
    CharacterTurn --> CombatAction : Choose Action
    CombatAction --> CombatRound : Action Resolved
    CombatRound --> CombatEnd : Combat Finished
    CombatEnd --> SessionActive : Return to Exploration
    
    SessionActive --> SessionPaused : Pause Session
    SessionPaused --> SessionActive : Resume Session
    SessionPaused --> SessionEnded : End Session
    SessionActive --> SessionEnded : End Session
    SessionEnded --> [*]
```

## World Building Tab Navigation

```mermaid
flowchart LR
    A[Setting Overview] --> B[Geography & Environment]
    B --> C[Society & Culture]
    C --> D[History & Legends]
    D --> E[Magic & Technology]
    E --> F[Places & Locations]
    F --> G[Interactive Map]
    G --> H[Rules & Systems]
    H --> I[Free Fields]
    
    A -.-> C
    A -.-> F
    B -.-> G
    C -.-> F
    D -.-> E
    F -.-> G
    
    J[AI Assist] --> A
    J --> B
    J --> C
    J --> D
    J --> E
    J --> F
    J --> G
    J --> H
    J --> I
```

## Character Status Change Flow

```mermaid
sequenceDiagram
    participant Timeline
    participant Event
    participant Character
    participant Status
    participant Validation

    Timeline->>Event: Create/Edit Event
    Event->>Character: Select Related Characters
    Character->>Status: Show Current Status
    Status->>Event: Display Status Options
    Event->>Status: Select New Status
    Status->>Validation: Validate Status Change
    
    alt Valid Status Change
        Validation->>Character: Apply Status
        Character->>Timeline: Update Character State
        Timeline->>Event: Confirm Change
    else Invalid Status Change
        Validation->>Event: Show Error Message
        Event->>Status: Reset to Previous State
    end
```

This comprehensive set of flowcharts and state diagrams provides visual guidance for implementing the complex interaction patterns in the TRPG application. These diagrams should be referenced during development to ensure consistent and predictable user experiences across all features.