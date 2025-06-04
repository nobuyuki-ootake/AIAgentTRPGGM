# TRPG Application Performance Optimization Guide

## Overview

This guide provides comprehensive performance optimization strategies specific to the TRPG (Tabletop Role-Playing Game) application. It covers frontend optimizations, data management, AI integration performance, and real-time session management.

## Table of Contents

1. [Component Optimization](#component-optimization)
2. [Data Management](#data-management)
3. [AI Integration Performance](#ai-integration-performance)
4. [Memory Management](#memory-management)
5. [Network Optimization](#network-optimization)
6. [Real-time Session Performance](#real-time-session-performance)
7. [Image and Asset Optimization](#image-and-asset-optimization)
8. [Search and Filtering Performance](#search-and-filtering-performance)
9. [Bundle Optimization](#bundle-optimization)
10. [Monitoring and Debugging](#monitoring-and-debugging)

## Component Optimization

### Character Sheet Rendering

**Problem**: Character sheets with complex calculations and multiple components can cause performance bottlenecks.

**Solutions**:

```typescript
// Use React.memo for character components
const CharacterCard = React.memo(({ character }) => {
  return (
    <Card>
      {/* Character content */}
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return prevProps.character.id === nextProps.character.id &&
         prevProps.character.lastModified === nextProps.character.lastModified;
});

// Virtualize long character lists
import { FixedSizeList as List } from 'react-window';

const CharacterList = ({ characters }) => (
  <List
    height={600}
    itemCount={characters.length}
    itemSize={120}
    itemData={characters}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <CharacterCard character={data[index]} />
      </div>
    )}
  </List>
);
```

### Timeline Event Optimization

**Problem**: Large timelines with hundreds or thousands of events cause slow rendering and interactions.

**Solutions**:

```typescript
// Implement event virtualization
const TimelineEventList = ({ events }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const visibleEvents = useMemo(() => 
    events.slice(visibleRange.start, visibleRange.end),
    [events, visibleRange]
  );

  return (
    <VirtualizedTimeline
      events={visibleEvents}
      onRangeChange={setVisibleRange}
    />
  );
};

// Use date-based chunking for large datasets
const useTimelineChunks = (events, chunkSize = 30) => {
  return useMemo(() => {
    const chunks = [];
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = 0; i < sortedEvents.length; i += chunkSize) {
      chunks.push(sortedEvents.slice(i, i + chunkSize));
    }
    
    return chunks;
  }, [events, chunkSize]);
};
```

### Dice Animation Performance

**Problem**: Multiple simultaneous dice animations can cause frame drops.

**Solutions**:

```typescript
// Use CSS animations with GPU acceleration
const DiceAnimation = styled.div`
  transform: translateZ(0); /* Enable GPU acceleration */
  will-change: transform;
  
  &.rolling {
    animation: diceRoll 1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes diceRoll {
    0% { transform: rotateX(0deg) rotateY(0deg); }
    50% { transform: rotateX(180deg) rotateY(180deg) scale(1.1); }
    100% { transform: rotateX(360deg) rotateY(360deg); }
  }
`;

// Limit concurrent animations
const useDiceAnimationQueue = () => {
  const [animationQueue, setAnimationQueue] = useState([]);
  const [activeAnimations, setActiveAnimations] = useState(0);
  const maxConcurrent = 3;

  const addAnimation = useCallback((diceConfig) => {
    if (activeAnimations < maxConcurrent) {
      startAnimation(diceConfig);
    } else {
      setAnimationQueue(prev => [...prev, diceConfig]);
    }
  }, [activeAnimations]);

  return { addAnimation };
};
```

## Data Management

### Campaign Data Loading

**Problem**: Large campaigns with hundreds of characters, NPCs, and locations cause slow initial loading.

**Solutions**:

```typescript
// Implement progressive loading
const useCampaignData = (campaignId) => {
  const [data, setData] = useState({
    characters: [],
    npcs: [],
    locations: [],
    timeline: []
  });
  const [loadingState, setLoadingState] = useState({
    characters: 'pending',
    npcs: 'pending',
    locations: 'pending',
    timeline: 'pending'
  });

  useEffect(() => {
    // Load critical data first (characters)
    loadCharacters(campaignId).then(characters => {
      setData(prev => ({ ...prev, characters }));
      setLoadingState(prev => ({ ...prev, characters: 'loaded' }));
    });

    // Load less critical data with delay
    setTimeout(() => {
      loadNPCs(campaignId).then(npcs => {
        setData(prev => ({ ...prev, npcs }));
        setLoadingState(prev => ({ ...prev, npcs: 'loaded' }));
      });
    }, 100);

    // Load heavy data last
    setTimeout(() => {
      loadTimeline(campaignId).then(timeline => {
        setData(prev => ({ ...prev, timeline }));
        setLoadingState(prev => ({ ...prev, timeline: 'loaded' }));
      });
    }, 500);
  }, [campaignId]);

  return { data, loadingState };
};

// Use data pagination for large lists
const useCharacterPagination = (characters, pageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return characters.slice(start, start + pageSize);
  }, [characters, currentPage, pageSize]);

  return { paginatedData, currentPage, setCurrentPage };
};
```

### State Management Optimization

**Problem**: Frequent state updates cause unnecessary re-renders across the application.

**Solutions**:

```typescript
// Use Recoil selectors for derived state
const characterStatsSelector = selectorFamily({
  key: 'characterStatsSelector',
  get: (characterId) => ({ get }) => {
    const character = get(characterAtom(characterId));
    return {
      totalLevel: character.classes.reduce((sum, cls) => sum + cls.level, 0),
      totalHP: calculateTotalHP(character),
      armorClass: calculateAC(character),
      // Cache expensive calculations
    };
  },
});

// Implement smart state updates
const useOptimizedCharacterUpdate = (characterId) => {
  const updateCharacter = useCallback((updates) => {
    // Batch updates to prevent multiple re-renders
    unstable_batchedUpdates(() => {
      setCharacter(characterId, prevCharacter => {
        const newCharacter = { ...prevCharacter, ...updates };
        
        // Only trigger dependent calculations if relevant fields changed
        if (updates.stats || updates.equipment || updates.level) {
          newCharacter.computedStats = recalculateStats(newCharacter);
        }
        
        return newCharacter;
      });
    });
  }, [characterId]);

  return updateCharacter;
};
```

## AI Integration Performance

### Request Batching and Caching

**Problem**: Multiple AI requests slow down the application and increase API costs.

**Solutions**:

```typescript
// Implement request debouncing
const useAIRequestDebounce = (delay = 1000) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const timeoutRef = useRef();

  const queueRequest = useCallback((request) => {
    setPendingRequests(prev => [...prev, request]);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(async () => {
      const requests = [...pendingRequests, request];
      setPendingRequests([]);
      
      // Batch process requests
      await processBatchedAIRequests(requests);
    }, delay);
  }, [pendingRequests, delay]);

  return queueRequest;
};

// Cache AI responses
const aiResponseCache = new Map();

const useAICache = () => {
  const getCachedResponse = useCallback((requestKey) => {
    return aiResponseCache.get(requestKey);
  }, []);

  const setCachedResponse = useCallback((requestKey, response) => {
    // Implement LRU eviction
    if (aiResponseCache.size > 1000) {
      const firstKey = aiResponseCache.keys().next().value;
      aiResponseCache.delete(firstKey);
    }
    
    aiResponseCache.set(requestKey, {
      response,
      timestamp: Date.now(),
      expires: Date.now() + (30 * 60 * 1000) // 30 minutes
    });
  }, []);

  return { getCachedResponse, setCachedResponse };
};
```

### Progressive AI Generation

**Problem**: Long AI generation times block the UI and frustrate users.

**Solutions**:

```typescript
// Implement streaming AI responses
const useStreamingAI = () => {
  const [streamData, setStreamData] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const startStream = useCallback(async (prompt) => {
    setStreamData('');
    setIsComplete(false);
    
    const response = await fetch('/api/ai-agent/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        setIsComplete(true);
        break;
      }

      const chunk = decoder.decode(value);
      setStreamData(prev => prev + chunk);
    }
  }, []);

  return { streamData, isComplete, startStream };
};

// Progressive character generation
const useProgressiveCharacterGeneration = () => {
  const [generationSteps, setGenerationSteps] = useState([]);
  
  const generateCharacter = useCallback(async (config) => {
    const steps = [
      { name: 'Basic Info', weight: 0.2 },
      { name: 'Stats', weight: 0.3 },
      { name: 'Background', weight: 0.3 },
      { name: 'Equipment', weight: 0.2 }
    ];

    setGenerationSteps(steps.map(step => ({ ...step, completed: false })));

    for (const [index, step] of steps.entries()) {
      const result = await generateCharacterStep(step.name, config);
      
      setGenerationSteps(prev => 
        prev.map((s, i) => 
          i === index ? { ...s, completed: true, result } : s
        )
      );
    }
  }, []);

  return { generationSteps, generateCharacter };
};
```

## Memory Management

### Preventing Memory Leaks

**Problem**: Long-running TRPG sessions can accumulate memory over time.

**Solutions**:

```typescript
// Clean up event listeners and subscriptions
const useCleanupEffects = () => {
  const cleanupFunctions = useRef([]);

  const addCleanup = useCallback((cleanup) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];
    };
  }, []);

  return addCleanup;
};

// Implement data pruning for long sessions
const useSessionDataPruning = () => {
  const pruneOldData = useCallback(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Remove old chat messages
    setChatHistory(prev => 
      prev.filter(message => message.timestamp > oneHourAgo)
    );
    
    // Remove old dice roll history
    setDiceHistory(prev => 
      prev.filter(roll => roll.timestamp > oneHourAgo)
    );
    
    // Clear temporary state
    setTemporaryAnimations([]);
    setTempCalculations([]);
  }, []);

  useEffect(() => {
    const interval = setInterval(pruneOldData, 10 * 60 * 1000); // Every 10 minutes
    return () => clearInterval(interval);
  }, [pruneOldData]);

  return pruneOldData;
};
```

### Image Memory Management

**Problem**: Character portraits and map images consume significant memory.

**Solutions**:

```typescript
// Implement image lazy loading and unloading
const useLazyImage = (src, options = {}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !imageSrc) {
          setIsLoading(true);
          
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoading(false);
          };
          img.src = src;
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, imageSrc]);

  return { imgRef, imageSrc, isLoading };
};

// Image compression and resizing
const useImageOptimization = () => {
  const optimizeImage = useCallback(async (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  return { optimizeImage };
};
```

## Network Optimization

### API Request Management

**Problem**: Multiple simultaneous API requests can overwhelm the server and slow responses.

**Solutions**:

```typescript
// Implement request queue with concurrency limit
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 3;

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private processQueue() {
    if (this.running < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

// Use request deduplication
const requestCache = new Map();

const useDedupedRequest = () => {
  const makeRequest = useCallback(async (url, options) => {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    const requestPromise = fetch(url, options).then(r => r.json());
    requestCache.set(cacheKey, requestPromise);
    
    // Clean up cache after request completes
    requestPromise.finally(() => {
      setTimeout(() => requestCache.delete(cacheKey), 5000);
    });

    return requestPromise;
  }, []);

  return makeRequest;
};
```

### Offline Support and Caching

**Problem**: Network interruptions can disrupt gameplay sessions.

**Solutions**:

```typescript
// Implement service worker for offline support
const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingData = useCallback(async () => {
    for (const data of pendingSync) {
      try {
        await fetch(data.url, data.options);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
    setPendingSync([]);
  }, [pendingSync]);

  return { isOnline, pendingSync, setPendingSync };
};
```

## Real-time Session Performance

### WebSocket Connection Management

**Problem**: Multiple WebSocket connections and frequent updates can cause performance issues.

**Solutions**:

```typescript
// Implement connection pooling and message batching
class SessionWebSocket {
  private connection: WebSocket | null = null;
  private messageQueue: any[] = [];
  private batchTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string) {
    this.connection = new WebSocket(url);
    
    this.connection.onopen = () => {
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
    };

    this.connection.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(url);
        }, Math.pow(2, this.reconnectAttempts) * 1000);
      }
    };
  }

  sendMessage(message: any) {
    this.messageQueue.push(message);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.flushMessageQueue();
    }, 100); // Batch messages for 100ms
  }

  private flushMessageQueue() {
    if (this.connection?.readyState === WebSocket.OPEN && this.messageQueue.length > 0) {
      this.connection.send(JSON.stringify({
        type: 'batch',
        messages: this.messageQueue
      }));
      this.messageQueue = [];
    }
  }
}
```

### State Synchronization

**Problem**: Keeping multiple players' game state synchronized efficiently.

**Solutions**:

```typescript
// Implement differential state updates
const useStateDiff = (initialState) => {
  const [state, setState] = useState(initialState);
  const previousState = useRef(initialState);

  const updateState = useCallback((newState) => {
    const diff = calculateStateDiff(previousState.current, newState);
    
    if (Object.keys(diff).length > 0) {
      setState(newState);
      previousState.current = newState;
      
      // Send only the differences
      sendStateUpdate({ type: 'diff', changes: diff });
    }
  }, []);

  return [state, updateState];
};

const calculateStateDiff = (oldState, newState) => {
  const diff = {};
  
  Object.keys(newState).forEach(key => {
    if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
      diff[key] = newState[key];
    }
  });
  
  return diff;
};
```

## Search and Filtering Performance

### Optimized Search Implementation

**Problem**: Searching through large character, NPC, and item databases is slow.

**Solutions**:

```typescript
// Implement fuzzy search with indexing
import Fuse from 'fuse.js';

const useOptimizedSearch = (data, searchFields) => {
  const fuse = useMemo(() => {
    return new Fuse(data, {
      keys: searchFields,
      threshold: 0.3,
      includeScore: true,
      includeMatches: true
    });
  }, [data, searchFields]);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce((query) => {
      setIsSearching(true);
      
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const results = fuse.search(query);
      setSearchResults(results.map(result => result.item));
      setIsSearching(false);
    }, 300),
    [fuse]
  );

  return { searchResults, isSearching, search: debouncedSearch };
};

// Implement virtual scrolling for large result sets
const VirtualizedSearchResults = ({ results, renderItem }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const visibleResults = useMemo(() => 
    results.slice(visibleRange.start, visibleRange.end),
    [results, visibleRange]
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={results.length}
      itemSize={60}
      onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
        setVisibleRange({ start: visibleStartIndex, end: visibleStopIndex });
      }}
    >
      {({ index, style }) => (
        <div style={style}>
          {renderItem(results[index], index)}
        </div>
      )}
    </FixedSizeList>
  );
};
```

## Bundle Optimization

### Code Splitting Strategies

**Problem**: Large bundle sizes cause slow initial page loads.

**Solutions**:

```typescript
// Implement route-based code splitting
const CharactersPage = lazy(() => import('./pages/CharactersPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const WorldBuildingPage = lazy(() => import('./pages/WorldBuildingPage'));
const TRPGSessionPage = lazy(() => import('./pages/TRPGSessionPage'));

// Component-based code splitting for heavy features
const AIImageGenerator = lazy(() => 
  import('./components/ai/AIImageGenerator').then(module => ({
    default: module.AIImageGenerator
  }))
);

// Preload critical routes
const preloadRoute = (routeImport) => {
  const componentImport = routeImport();
  return componentImport;
};

// In main component
useEffect(() => {
  // Preload likely next pages
  const timer = setTimeout(() => {
    preloadRoute(() => import('./pages/CharactersPage'));
    preloadRoute(() => import('./pages/TimelinePage'));
  }, 2000);
  
  return () => clearTimeout(timer);
}, []);
```

### Tree Shaking and Dead Code Elimination

**Problem**: Unused code increases bundle size.

**Solutions**:

```typescript
// Use ES6 imports for better tree shaking
import { debounce } from 'lodash-es'; // Instead of import _ from 'lodash'

// Create custom utility functions
export const createDebouncedFunction = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

// Avoid importing entire libraries
// Instead of: import * as MaterialIcons from '@mui/icons-material';
// Use: import { Add, Delete, Edit } from '@mui/icons-material';
```

## Monitoring and Debugging

### Performance Monitoring Setup

**Problem**: Identifying performance bottlenecks in production.

**Solutions**:

```typescript
// Implement custom performance hooks
const usePerformanceMonitor = (componentName) => {
  const renderStart = useRef();
  const [renderTimes, setRenderTimes] = useState([]);

  useLayoutEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current;
      setRenderTimes(prev => [...prev.slice(-10), renderTime]);
      
      if (renderTime > 16.67) { // Longer than one frame at 60fps
        console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
  });

  const averageRenderTime = renderTimes.length > 0 
    ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
    : 0;

  return { averageRenderTime, renderTimes };
};

// Set up error boundary with performance context
class PerformanceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, performanceData: null };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      performanceData: {
        memory: performance.memory,
        timing: performance.timing,
        timestamp: Date.now()
      }
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Performance Error:', {
      error,
      errorInfo,
      performanceData: this.state.performanceData
    });
  }

  render() {
    if (this.state.hasError) {
      return <PerformanceErrorFallback performanceData={this.state.performanceData} />;
    }

    return this.props.children;
  }
}
```

## Performance Testing and Benchmarking

### Automated Performance Tests

```typescript
// Create performance regression tests
describe('Performance Tests', () => {
  test('Character list renders within performance budget', async () => {
    const characters = generateTestCharacters(100);
    const startTime = performance.now();
    
    render(<CharacterList characters={characters} />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('character-card')).toHaveLength(100);
    });
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // Should render within 1 second
  });

  test('Search performance with large dataset', async () => {
    const characters = generateTestCharacters(1000);
    const { search } = renderHook(() => useOptimizedSearch(characters, ['name', 'class']));
    
    const startTime = performance.now();
    act(() => {
      search.current('warrior');
    });
    
    await waitFor(() => {
      const searchTime = performance.now() - startTime;
      expect(searchTime).toBeLessThan(100); // Search should complete within 100ms
    });
  });
});
```

## Conclusion

This performance optimization guide provides strategies for maintaining excellent performance in the TRPG application as it scales. Regular performance monitoring, profiling, and testing are essential for identifying and addressing bottlenecks before they impact user experience.

### Key Takeaways

1. **Measure First**: Always profile before optimizing to identify actual bottlenecks
2. **Progressive Loading**: Load critical data first, defer non-essential features
3. **Virtualization**: Use virtual scrolling for large lists and datasets
4. **Memory Management**: Implement cleanup and pruning strategies for long sessions
5. **Smart Caching**: Cache AI responses and computed values appropriately
6. **Bundle Optimization**: Use code splitting and tree shaking effectively
7. **Real-time Optimization**: Batch updates and use efficient state synchronization
8. **Monitor Continuously**: Set up performance monitoring and alerting

Regular application of these strategies will ensure the TRPG application provides a smooth, responsive experience for all users, regardless of campaign size or session length.