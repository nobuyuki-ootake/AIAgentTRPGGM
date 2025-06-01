export { BaseRepository } from './BaseRepository';
export { CampaignRepository, type Campaign } from './CampaignRepository';
export { CharacterRepository, type Character } from './CharacterRepository';
export { SessionRepository, type Session, type SessionLog } from './SessionRepository';
export { EnemyRepository, type Enemy, type EnemyEncounter } from './EnemyRepository';
export { NPCRepository, type NPC, type NPCInteraction } from './NPCRepository';

// Re-export repository types
export type { Repository } from './BaseRepository';