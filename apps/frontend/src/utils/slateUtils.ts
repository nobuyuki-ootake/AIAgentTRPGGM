import { Descendant, Element } from "slate";

/**
 * プレーンテキストをSlateのValue (Descendant[]) に変換します。
 * 改行は新しい段落として扱われます。
 * @param text 変換するプレーンテキスト
 * @returns SlateのValue
 */
export const convertTextToSlateValue = (text: string): Descendant[] => {
  if (!text) {
    return [{ type: "paragraph", children: [{ text: "" }] }];
  }
  const lines = text.split("\n");
  const slateValue: Descendant[] = lines.map((line) => ({
    type: "paragraph",
    children: [{ text: line }],
  }));
  return slateValue;
};

/**
 * SlateのValue (Descendant[]) をプレーンテキストに変換します。
 * 各段落は改行で区切られます。
 * (これは既存の serializeToText と同様の目的ですが、一応こちらにも定義しておきます)
 * @param nodes 変換するSlateのValue
 * @returns プレーンテキスト
 */
export const convertSlateValueToText = (nodes: Descendant[]): string => {
  return nodes
    .map((node) => {
      if (
        Element.isElement(node) &&
        node.type === "paragraph" &&
        Array.isArray(node.children)
      ) {
        return node.children
          .map((childNode) => {
            if ("text" in childNode) {
              return (childNode as { text: string }).text;
            }
            return "";
          })
          .join("");
      }
      return "";
    })
    .join("\n");
};
