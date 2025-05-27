/**
 * APIレスポンスの型定義
 */

import {
  WorldBuildingElement,
  WorldBuildingElementData,
} from "@novel-ai-assistant/types";

// 標準的なAPIレスポンスの基本型
export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  error?: string;
  metadata?: {
    model?: string;
    processingTime?: number;
    requestType?: string;
    format?: string;
  };
  rawContent?: string;
}

// 世界観要素のAPIレスポンス型
export interface WorldBuildingApiResponse {
  status: string;
  data: WorldBuildingElement; // 汎用型でWorldBuildingElementDataを表現
  rawContent: string;
  response?: string;
  agentUsed?: Record<string, unknown>;
  steps?: Record<string, unknown>;
  metadata: {
    model: string;
    processingTime: number;
    requestType: string;
    format: string;
  };
}

// AI生成エラーの型
export interface AIError {
  code: string;
  message: string;
  details?: Record<string, unknown>; // 構造が未知のためRecord型を使用
}

// APIからのレスポンス型定義

// 基本レスポンス型
export interface AgentResponse {
  response?: string;
  [key: string]: unknown;
}

// AIレスポンス（返却値の共通型）
export interface AIResponse extends AgentResponse {
  response: string;
  [key: string]: unknown;
}

// キャラクター生成バッチレスポンスの型
export interface CharacterBatchResponse {
  batchResponse: true;
  characters: AgentResponse[];
  totalCharacters: number;
  response?: string; // responseプロパティ追加
}

// 世界観要素生成レスポンスの型
export interface WorldBuildingElementResponse {
  id?: string;
  type: string;
  name: string;
  description?: string;
  importance?: string;
  originalType?: string;
  response?: string; // AIレスポンス文字列
  agentUsed?: Record<string, unknown>;
  steps?: Record<string, unknown>;
  elementName?: string;
  elementType?: string;
  elementData?: WorldBuildingElementData;
}

// 世界観要素生成バッチレスポンスの型
export interface WorldBuildingBatchResponse {
  batchResponse: true;
  elements: WorldBuildingElementResponse[];
  totalElements: number;
  elementType?: string;
  response?: string; // responseプロパティ追加
  [key: string]: unknown; // 追加のプロパティを許容
}

// AI生成のメタデータ型
export interface AIGenerationMetadata {
  model: string;
  processingTime: number;
  requestType: string;
  format: string;
}
