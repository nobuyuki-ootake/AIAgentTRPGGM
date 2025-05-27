import { Request, Response } from "express";

// モックリクエスト作成関数
export const mockRequest = (data?: any): Partial<Request> => {
  const req: Partial<Request> = {
    body: data || {},
    headers: {},
    query: {},
    params: {},
  };
  return req;
};

// モックレスポンス作成関数
export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendFile = jest.fn().mockReturnValue(res);
  return res;
};

// APIレスポンスのモック
export const mockOpenAIResponse = {
  id: "mock-openai-response-id",
  object: "chat.completion",
  created: Date.now(),
  model: "gpt-4-turbo",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "これはOpenAIからのモックレスポンスです。",
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
  },
};

export const mockClaudeResponse = {
  id: "msg_mock123",
  type: "message",
  role: "assistant",
  model: "claude-3-opus-20240229",
  content: [
    {
      type: "text",
      text: "これはClaudeからのモックレスポンスです。",
    },
  ],
  usage: {
    input_tokens: 10,
    output_tokens: 20,
  },
};

export const mockGeminiResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: "これはGeminiからのモックレスポンスです。",
          },
        ],
      },
      finishReason: "STOP",
      safetyRatings: [],
    },
  ],
  promptFeedback: {
    safetyRatings: [],
  },
};
