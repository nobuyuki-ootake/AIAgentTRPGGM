import { performanceMonitor } from './performanceMonitor';

// TRPG-specific performance test interfaces
export interface TRPGPerformanceTest {
  name: string;
  description: string;
  execute: () => Promise<TRPGTestResult>;
  expectedDuration: number;
  criticalThreshold: number;
}

export interface TRPGTestResult {
  testName: string;
  duration: number;
  success: boolean;
  metrics: Record<string, any>;
  errors?: string[];
  warnings?: string[];
}

export interface CampaignLoadTestConfig {
  characterCount: number;
  npcCount: number;
  enemyCount: number;
  eventCount: number;
  locationCount: number;
  baseCount: number;
}

export interface TRPGPerformanceBenchmarks {
  campaignLoad: {
    small: number;    // <10 characters
    medium: number;   // 10-50 characters
    large: number;    // 50-200 characters
    enterprise: number; // >200 characters
  };
  aiGeneration: {
    character: number;
    scenario: number;
    dialog: number;
    worldBuilding: number;
  };
  ui: {
    diceAnimation: number;
    characterSheet: number;
    timeline: number;
    chat: number;
  };
}

// Default benchmarks for TRPG operations
export const TRPG_BENCHMARKS: TRPGPerformanceBenchmarks = {
  campaignLoad: {
    small: 3000,     // 3 seconds
    medium: 8000,    // 8 seconds
    large: 20000,    // 20 seconds
    enterprise: 45000 // 45 seconds
  },
  aiGeneration: {
    character: 15000,   // 15 seconds
    scenario: 30000,    // 30 seconds
    dialog: 8000,       // 8 seconds
    worldBuilding: 25000 // 25 seconds
  },
  ui: {
    diceAnimation: 1500, // 1.5 seconds
    characterSheet: 2000, // 2 seconds
    timeline: 5000,      // 5 seconds
    chat: 500           // 0.5 seconds
  }
};

/**
 * Generate test data for performance testing
 */
export class TRPGTestDataGenerator {
  static generateCharacters(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `char-${index}`,
      name: `Test Character ${index}`,
      class: ['Warrior', 'Mage', 'Rogue', 'Cleric'][index % 4],
      level: Math.floor(Math.random() * 20) + 1,
      stats: {
        strength: Math.floor(Math.random() * 18) + 3,
        dexterity: Math.floor(Math.random() * 18) + 3,
        constitution: Math.floor(Math.random() * 18) + 3,
        intelligence: Math.floor(Math.random() * 18) + 3,
        wisdom: Math.floor(Math.random() * 18) + 3,
        charisma: Math.floor(Math.random() * 18) + 3
      },
      equipment: this.generateEquipment(),
      background: `Background story for character ${index}`.repeat(10),
      spells: this.generateSpells(Math.floor(Math.random() * 20)),
      inventory: this.generateInventory(Math.floor(Math.random() * 50) + 10)
    }));
  }

  static generateNPCs(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `npc-${index}`,
      name: `NPC ${index}`,
      role: ['Merchant', 'Guard', 'Noble', 'Commoner'][index % 4],
      location: `Location ${Math.floor(index / 10)}`,
      description: `Description for NPC ${index}`.repeat(5),
      dialogOptions: this.generateDialog(10),
      questsAvailable: Math.floor(Math.random() * 3)
    }));
  }

  static generateEnemies(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `enemy-${index}`,
      name: `Enemy ${index}`,
      type: ['Goblin', 'Orc', 'Dragon', 'Undead'][index % 4],
      hitPoints: Math.floor(Math.random() * 100) + 20,
      armorClass: Math.floor(Math.random() * 20) + 10,
      attacks: this.generateAttacks(),
      abilities: this.generateAbilities(),
      loot: this.generateLoot()
    }));
  }

  static generateTimelineEvents(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `event-${index}`,
      title: `Event ${index}`,
      description: `Description for event ${index}`.repeat(3),
      date: new Date(Date.now() + index * 24 * 60 * 60 * 1000),
      location: `Location ${Math.floor(index / 5)}`,
      participants: this.generateParticipants(),
      consequences: this.generateConsequences(),
      prerequisites: Math.floor(Math.random() * 3)
    }));
  }

  static generateLocations(count: number): any[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `location-${index}`,
      name: `Location ${index}`,
      type: ['City', 'Dungeon', 'Forest', 'Mountain'][index % 4],
      description: `Description for location ${index}`.repeat(8),
      npcs: Math.floor(Math.random() * 10),
      enemies: Math.floor(Math.random() * 5),
      treasures: this.generateTreasures(),
      secrets: this.generateSecrets(),
      connections: this.generateConnections()
    }));
  }

  private static generateEquipment(): any[] {
    return Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
      id: `equipment-${i}`,
      name: `Equipment ${i}`,
      type: ['Weapon', 'Armor', 'Accessory'][i % 3],
      stats: { attack: Math.floor(Math.random() * 20), defense: Math.floor(Math.random() * 20) }
    }));
  }

  private static generateSpells(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `spell-${i}`,
      name: `Spell ${i}`,
      level: Math.floor(Math.random() * 9) + 1,
      description: `Spell description ${i}`.repeat(3)
    }));
  }

  private static generateInventory(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      quantity: Math.floor(Math.random() * 10) + 1,
      value: Math.floor(Math.random() * 1000)
    }));
  }

  private static generateDialog(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `dialog-${i}`,
      text: `Dialog option ${i}`.repeat(2),
      response: `Response ${i}`.repeat(2)
    }));
  }

  private static generateAttacks(): any[] {
    return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      name: `Attack ${i}`,
      damage: `${Math.floor(Math.random() * 3) + 1}d${Math.floor(Math.random() * 8) + 4}`
    }));
  }

  private static generateAbilities(): any[] {
    return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
      name: `Ability ${i}`,
      description: `Ability description ${i}`.repeat(2)
    }));
  }

  private static generateLoot(): any[] {
    return Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
      item: `Loot Item ${i}`,
      rarity: ['Common', 'Uncommon', 'Rare', 'Epic'][i % 4]
    }));
  }

  private static generateParticipants(): string[] {
    return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => `Participant ${i}`);
  }

  private static generateConsequences(): string[] {
    return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => `Consequence ${i}`);
  }

  private static generateTreasures(): any[] {
    return Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
      name: `Treasure ${i}`,
      value: Math.floor(Math.random() * 10000)
    }));
  }

  private static generateSecrets(): string[] {
    return Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => `Secret ${i}`);
  }

  private static generateConnections(): string[] {
    return Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, i) => `Location ${i}`);
  }
}

/**
 * TRPG Performance Test Suite
 */
export class TRPGPerformanceTestSuite {
  private tests: TRPGPerformanceTest[] = [];

  constructor() {
    this.setupDefaultTests();
  }

  private setupDefaultTests(): void {
    // Campaign loading tests
    this.addTest({
      name: 'campaign-load-small',
      description: 'Load campaign with small dataset (10 characters)',
      expectedDuration: TRPG_BENCHMARKS.campaignLoad.small,
      criticalThreshold: TRPG_BENCHMARKS.campaignLoad.small * 2,
      execute: () => this.testCampaignLoad({
        characterCount: 10,
        npcCount: 20,
        enemyCount: 15,
        eventCount: 50,
        locationCount: 10,
        baseCount: 5
      })
    });

    this.addTest({
      name: 'campaign-load-medium',
      description: 'Load campaign with medium dataset (50 characters)',
      expectedDuration: TRPG_BENCHMARKS.campaignLoad.medium,
      criticalThreshold: TRPG_BENCHMARKS.campaignLoad.medium * 2,
      execute: () => this.testCampaignLoad({
        characterCount: 50,
        npcCount: 100,
        enemyCount: 75,
        eventCount: 200,
        locationCount: 25,
        baseCount: 15
      })
    });

    this.addTest({
      name: 'campaign-load-large',
      description: 'Load campaign with large dataset (200 characters)',
      expectedDuration: TRPG_BENCHMARKS.campaignLoad.large,
      criticalThreshold: TRPG_BENCHMARKS.campaignLoad.large * 2,
      execute: () => this.testCampaignLoad({
        characterCount: 200,
        npcCount: 400,
        enemyCount: 300,
        eventCount: 1000,
        locationCount: 100,
        baseCount: 50
      })
    });

    // UI Performance tests
    this.addTest({
      name: 'dice-animation-performance',
      description: 'Test dice rolling animation performance',
      expectedDuration: TRPG_BENCHMARKS.ui.diceAnimation,
      criticalThreshold: TRPG_BENCHMARKS.ui.diceAnimation * 2,
      execute: () => this.testDiceAnimation()
    });

    this.addTest({
      name: 'character-sheet-rendering',
      description: 'Test character sheet rendering performance',
      expectedDuration: TRPG_BENCHMARKS.ui.characterSheet,
      criticalThreshold: TRPG_BENCHMARKS.ui.characterSheet * 2,
      execute: () => this.testCharacterSheetRendering()
    });

    this.addTest({
      name: 'timeline-processing',
      description: 'Test timeline event processing performance',
      expectedDuration: TRPG_BENCHMARKS.ui.timeline,
      criticalThreshold: TRPG_BENCHMARKS.ui.timeline * 2,
      execute: () => this.testTimelineProcessing()
    });

    // AI Performance tests
    this.addTest({
      name: 'ai-character-generation',
      description: 'Test AI character generation performance',
      expectedDuration: TRPG_BENCHMARKS.aiGeneration.character,
      criticalThreshold: TRPG_BENCHMARKS.aiGeneration.character * 2,
      execute: () => this.testAICharacterGeneration()
    });

    // Memory stress tests
    this.addTest({
      name: 'memory-stress-test',
      description: 'Test memory usage under heavy load',
      expectedDuration: 10000,
      criticalThreshold: 20000,
      execute: () => this.testMemoryStress()
    });

    // Search and filtering tests
    this.addTest({
      name: 'search-performance',
      description: 'Test search and filtering performance',
      expectedDuration: 1000,
      criticalThreshold: 3000,
      execute: () => this.testSearchPerformance()
    });
  }

  private async testCampaignLoad(config: CampaignLoadTestConfig): Promise<TRPGTestResult> {
    const startTime = performance.now();
    const metrics: Record<string, any> = {};
    const warnings: string[] = [];

    try {
      // Generate test data
      const characters = TRPGTestDataGenerator.generateCharacters(config.characterCount);
      const npcs = TRPGTestDataGenerator.generateNPCs(config.npcCount);
      const enemies = TRPGTestDataGenerator.generateEnemies(config.enemyCount);
      const events = TRPGTestDataGenerator.generateTimelineEvents(config.eventCount);
      const locations = TRPGTestDataGenerator.generateLocations(config.locationCount);

      metrics['dataGenerationTime'] = performance.now() - startTime;

      // Simulate data processing
      const processingStart = performance.now();
      
      // Process characters
      const processedCharacters = characters.map(char => ({
        ...char,
        computed: {
          totalStats: Object.values(char.stats).reduce((sum: number, stat: any) => sum + stat, 0),
          equipmentValue: char.equipment.reduce((sum: number, eq: any) => sum + (eq.stats?.attack || 0) + (eq.stats?.defense || 0), 0)
        }
      }));

      // Process timeline events
      const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Process locations and connections
      this.buildLocationGraph(locations); // Use without assignment to avoid unused variable

      metrics['processingTime'] = performance.now() - processingStart;
      metrics['totalTime'] = performance.now() - startTime;
      metrics['itemCounts'] = {
        characters: processedCharacters.length,
        npcs: npcs.length,
        enemies: enemies.length,
        events: sortedEvents.length,
        locations: locations.length
      };

      // Check for performance warnings
      if (metrics['totalTime'] > 5000) {
        warnings.push('Campaign load time exceeded 5 seconds');
      }
      if (metrics['processingTime'] > metrics['totalTime'] * 0.8) {
        warnings.push('Processing time is disproportionately high');
      }

      return {
        testName: 'campaign-load',
        duration: metrics['totalTime'],
        success: true,
        metrics,
        warnings
      };
    } catch (error) {
      return {
        testName: 'campaign-load',
        duration: performance.now() - startTime,
        success: false,
        metrics,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async testDiceAnimation(): Promise<TRPGTestResult> {
    const startTime = performance.now();
    const metrics: Record<string, any> = {};

    try {
      // Simulate multiple dice rolls
      const rollCount = 100;
      const animationPromises: Promise<void>[] = [];

      for (let i = 0; i < rollCount; i++) {
        const promise = new Promise<void>((resolve) => {
          // Simulate dice animation
          const animationStart = performance.now();
          setTimeout(() => {
            metrics[`roll_${i}_duration`] = performance.now() - animationStart;
            resolve();
          }, Math.random() * 1000 + 500); // 0.5-1.5 second animation
        });
        animationPromises.push(promise);
      }

      await Promise.all(animationPromises);

      const totalTime = performance.now() - startTime;
      const avgAnimationTime = Object.values(metrics)
        .filter(v => typeof v === 'number')
        .reduce((sum: number, time: any) => sum + time, 0) / rollCount;

      return {
        testName: 'dice-animation',
        duration: totalTime,
        success: true,
        metrics: {
          totalTime,
          rollCount,
          avgAnimationTime,
          fps: rollCount / (totalTime / 1000)
        }
      };
    } catch (error) {
      return {
        testName: 'dice-animation',
        duration: performance.now() - startTime,
        success: false,
        metrics,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async testCharacterSheetRendering(): Promise<TRPGTestResult> {
    const startTime = performance.now();
    const metrics: Record<string, any> = {};

    try {
      // Generate complex character data
      const characters = TRPGTestDataGenerator.generateCharacters(50);
      
      // Simulate rendering each character sheet
      const renderTimes: number[] = [];
      
      for (const character of characters) {
        const renderStart = performance.now();
        
        // Simulate complex character sheet calculations
        const computed = {
          totalStats: Object.values(character.stats).reduce((sum: number, stat: any) => sum + stat, 0),
          spellSlots: this.calculateSpellSlots(character.level, character.class),
          armorClass: this.calculateArmorClass(character.equipment),
          hitPoints: this.calculateHitPoints(character.level, character.stats.constitution),
          proficiencyBonus: Math.ceil(character.level / 4) + 1
        };
        void computed; // Use computed result for performance testing
        
        renderTimes.push(performance.now() - renderStart);
      }

      const totalTime = performance.now() - startTime;
      const avgRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      const maxRenderTime = Math.max(...renderTimes);

      return {
        testName: 'character-sheet-rendering',
        duration: totalTime,
        success: maxRenderTime < 100, // Should render within 100ms per sheet
        metrics: {
          totalTime,
          characterCount: characters.length,
          avgRenderTime,
          maxRenderTime,
          sheetsPerSecond: characters.length / (totalTime / 1000)
        }
      };
    } catch (error) {
      return {
        testName: 'character-sheet-rendering',
        duration: performance.now() - startTime,
        success: false,
        metrics,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async testTimelineProcessing(): Promise<TRPGTestResult> {
    const startTime = performance.now();
    const metrics: Record<string, any> = {};

    try {
      // Generate large timeline dataset
      const events = TRPGTestDataGenerator.generateTimelineEvents(1000);
      
      // Test various timeline operations
      const sortingStart = performance.now();
      const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      metrics['sortingTime'] = performance.now() - sortingStart;

      const filteringStart = performance.now();
      const filteredEvents = sortedEvents.filter(event => event.participants.length > 2);
      metrics['filteringTime'] = performance.now() - filteringStart;

      const groupingStart = performance.now();
      const groupedByLocation = sortedEvents.reduce((groups: Record<string, any[]>, event) => {
        const location = event.location;
        if (!groups[location]) groups[location] = [];
        groups[location].push(event);
        return groups;
      }, {});
      metrics['groupingTime'] = performance.now() - groupingStart;

      const searchStart = performance.now();
      const searchResults = sortedEvents.filter(event => 
        event.title.toLowerCase().includes('event') ||
        event.description.toLowerCase().includes('event')
      );
      metrics['searchTime'] = performance.now() - searchStart;

      // Use results to avoid unused variable warnings
      void filteredEvents;
      void groupedByLocation;
      void searchResults;

      const totalTime = performance.now() - startTime;

      return {
        testName: 'timeline-processing',
        duration: totalTime,
        success: true,
        metrics: {
          totalTime,
          eventCount: events.length,
          sortedCount: sortedEvents.length,
          filteredCount: filteredEvents.length,
          locationGroups: Object.keys(groupedByLocation).length,
          searchResults: searchResults.length,
          ...metrics
        }
      };
    } catch (error) {
      return {
        testName: 'timeline-processing',
        duration: performance.now() - startTime,
        success: false,
        metrics,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async testAICharacterGeneration(): Promise<TRPGTestResult> {
    const startTime = performance.now();
    const metrics: Record<string, any> = {};

    try {
      // Simulate AI character generation
      const generationPromise = new Promise<void>((resolve) => {
        // Simulate AI processing time
        setTimeout(() => {
          resolve();
        }, Math.random() * 10000 + 5000); // 5-15 seconds
      });

      await generationPromise;

      const totalTime = performance.now() - startTime;

      return {
        testName: 'ai-character-generation',
        duration: totalTime,
        success: totalTime < 30000, // Should complete within 30 seconds
        metrics: {
          totalTime,
          withinExpectedTime: totalTime < TRPG_BENCHMARKS.aiGeneration.character
        }
      };
    } catch (error) {
      return {
        testName: 'ai-character-generation',
        duration: performance.now() - startTime,
        success: false,
        metrics,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async testMemoryStress(): Promise<TRPGTestResult> {
    const startTime = performance.now();
    const metrics: Record<string, any> = {};
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    try {
      // Create large amounts of test data
      const largeDataSets: any[] = [];
      
      for (let i = 0; i < 10; i++) {
        const dataset = {
          characters: TRPGTestDataGenerator.generateCharacters(100),
          npcs: TRPGTestDataGenerator.generateNPCs(200),
          enemies: TRPGTestDataGenerator.generateEnemies(150),
          events: TRPGTestDataGenerator.generateTimelineEvents(500),
          locations: TRPGTestDataGenerator.generateLocations(50)
        };
        largeDataSets.push(dataset);
      }

      const midMemory = (performance as any).memory?.usedJSHeapSize || 0;
      metrics['memoryIncrease'] = midMemory - initialMemory;

      // Process all data sets
      const processedData = largeDataSets.map(dataset => ({
        characterCount: dataset.characters.length,
        totalStats: dataset.characters.reduce((sum: number, char: any) => 
          sum + Object.values(char.stats).reduce((s: number, stat: any) => s + stat, 0), 0),
        locationConnections: this.buildLocationGraph(dataset.locations)
      }));

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const totalTime = performance.now() - startTime;
      
      // Use processed data for memory testing
      void processedData;

      return {
        testName: 'memory-stress-test',
        duration: totalTime,
        success: metrics['memoryIncrease'] < 100 * 1024 * 1024, // Less than 100MB increase
        metrics: {
          totalTime,
          initialMemory,
          finalMemory,
          memoryIncrease: finalMemory - initialMemory,
          datasetCount: largeDataSets.length,
          processedItemCount: processedData.length
        }
      };
    } catch (error) {
      return {
        testName: 'memory-stress-test',
        duration: performance.now() - startTime,
        success: false,
        metrics,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async testSearchPerformance(): Promise<TRPGTestResult> {
    const startTime = performance.now();
    const metrics: Record<string, any> = {};

    try {
      // Generate large searchable dataset
      const characters = TRPGTestDataGenerator.generateCharacters(1000);
      const npcs = TRPGTestDataGenerator.generateNPCs(2000);
      
      // Test various search scenarios
      const searchTerms = ['warrior', 'mage', 'test', 'character', 'npc'];
      const searchResults: Record<string, any> = {};

      for (const term of searchTerms) {
        const searchStart = performance.now();
        
        const charResults = characters.filter(char => 
          char.name.toLowerCase().includes(term.toLowerCase()) ||
          char.class.toLowerCase().includes(term.toLowerCase())
        );
        
        const npcResults = npcs.filter(npc =>
          npc.name.toLowerCase().includes(term.toLowerCase()) ||
          npc.role.toLowerCase().includes(term.toLowerCase())
        );

        const searchTime = performance.now() - searchStart;
        searchResults[term] = {
          characterMatches: charResults.length,
          npcMatches: npcResults.length,
          searchTime
        };
      }

      const totalTime = performance.now() - startTime;
      const avgSearchTime = Object.values(searchResults)
        .reduce((sum: number, result: any) => sum + result.searchTime, 0) / searchTerms.length;

      return {
        testName: 'search-performance',
        duration: totalTime,
        success: avgSearchTime < 100, // Average search should be under 100ms
        metrics: {
          totalTime,
          datasetSize: characters.length + npcs.length,
          searchTermCount: searchTerms.length,
          avgSearchTime,
          searchResults
        }
      };
    } catch (error) {
      return {
        testName: 'search-performance',
        duration: performance.now() - startTime,
        success: false,
        metrics,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private buildLocationGraph(locations: any[]): Record<string, string[]> {
    return locations.reduce((graph: Record<string, string[]>, location) => {
      graph[location.id] = location.connections || [];
      return graph;
    }, {});
  }

  private calculateSpellSlots(level: number, characterClass: string): Record<string, number> {
    // Simplified spell slot calculation
    const slots: Record<string, number> = {};
    if (characterClass === 'Mage') {
      for (let i = 1; i <= Math.min(9, Math.ceil(level / 2)); i++) {
        slots[`level${i}`] = Math.max(1, Math.floor(level / i));
      }
    }
    return slots;
  }

  private calculateArmorClass(equipment: any[]): number {
    return equipment
      .filter(item => item.type === 'Armor')
      .reduce((ac, armor) => ac + (armor.stats?.defense || 0), 10);
  }

  private calculateHitPoints(level: number, constitution: number): number {
    const conModifier = Math.floor((constitution - 10) / 2);
    return level * (8 + conModifier) + constitution;
  }

  addTest(test: TRPGPerformanceTest): void {
    this.tests.push(test);
  }

  async runTest(testName: string): Promise<TRPGTestResult> {
    const test = this.tests.find(t => t.name === testName);
    if (!test) {
      throw new Error(`Test not found: ${testName}`);
    }

    const operationId = `test-${testName}-${Date.now()}`;
    performanceMonitor.startOperation(operationId, 'performance-test', {
      testName,
      expectedDuration: test.expectedDuration
    });

    try {
      const result = await test.execute();
      
      if (result.success) {
        performanceMonitor.completeOperation(operationId, {
          duration: result.duration,
          metrics: result.metrics
        });
      } else {
        performanceMonitor.failOperation(operationId, result.errors?.join(', ') || 'Test failed', {
          duration: result.duration,
          metrics: result.metrics
        });
      }

      return result;
    } catch (error) {
      performanceMonitor.failOperation(operationId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async runAllTests(): Promise<TRPGTestResult[]> {
    const results: TRPGTestResult[] = [];
    
    for (const test of this.tests) {
      try {
        const result = await this.runTest(test.name);
        results.push(result);
      } catch (error) {
        results.push({
          testName: test.name,
          duration: 0,
          success: false,
          metrics: {},
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return results;
  }

  getTestSummary(): any {
    return {
      totalTests: this.tests.length,
      testCategories: {
        campaignLoad: this.tests.filter(t => t.name.includes('campaign-load')).length,
        ui: this.tests.filter(t => t.name.includes('dice') || t.name.includes('character-sheet') || t.name.includes('timeline')).length,
        ai: this.tests.filter(t => t.name.includes('ai')).length,
        memory: this.tests.filter(t => t.name.includes('memory')).length,
        search: this.tests.filter(t => t.name.includes('search')).length
      },
      benchmarks: TRPG_BENCHMARKS
    };
  }
}

// Singleton instance
export const trpgPerformanceTestSuite = new TRPGPerformanceTestSuite();