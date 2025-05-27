import { Descendant, Node } from "slate";
import type { CustomElement } from "../types/slate";

// エディタの初期値を設定する関数
export const createEmptyEditor = (): CustomElement[] => {
  return [
    {
      type: "paragraph",
      children: [{ text: "" }],
    } as CustomElement,
  ];
};

// 編集不可能なプレーンテキストとしてのエディタ値を作成
export const createReadOnlyValue = (content: string): CustomElement[] => {
  return [
    {
      type: "paragraph",
      children: [{ text: content || "" }],
    } as CustomElement,
  ];
};

// エディタの値からプレーンテキストを抽出
export const serializeToText = (nodes: Descendant[]): string => {
  return nodes.map((n) => Node.string(n)).join("\n");
};

// 文字数を計算する関数
export const countCharacters = (nodes: Descendant[]): number => {
  return nodes.reduce((count, node) => {
    return count + Node.string(node).length;
  }, 0);
};

// 指定されたページの内容を取得する関数（20x20=400文字ごと）
// この関数は現在の改ページマーカー方式では直接使用されない可能性が高い
export const getPageContent = (
  nodes: Descendant[],
  pageIndex: number
): string => {
  const allText = serializeToText(nodes);
  return allText.substring(pageIndex * 400, (pageIndex + 1) * 400);
};

// HTML文字列からプレーンテキストを抽出するヘルパー関数
// この関数はHTMLを扱わなくなるため、不要になる可能性が高い
export const extractTextFromHtml = (html: string): string => {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  } catch (e) {
    console.error("Error parsing HTML for text extraction:", e);
    // フォールバックとして簡易的なタグ除去（不完全な場合あり）
    return html.replace(/<[^>]+>/g, "");
  }
};
