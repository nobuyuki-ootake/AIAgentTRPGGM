import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";

// ParagraphElement や HeadingElement など、既存の要素型もここに含めるか、
// あるいは Text や Element の型をより汎用的に拡張する必要があるかもしれません。
// ここでは、まず page-break のために最小限の定義をします。
export type CustomElement =
  | { type: "paragraph"; children: CustomText[] } // デフォルトの段落も定義しておく
  | { type: "page-break"; children: CustomText[] };
// 他のカスタム要素（例: heading, list-item）もあればここに追加

export type CustomText = {
  text: string;
  bold?: true;
  italic?: true;
  underline?: true;
}; // 必要に応じて拡張

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
