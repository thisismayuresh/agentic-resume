export interface BlockStyle {
  bold?: boolean;
  italic?: boolean;
}

export interface ResumeBlockMeta {
  company?: string;
  role?: string;
  start?: string;
  end?: string;
}

export interface ResumeBlock {
  id: string;
  type: 'heading' | 'text' | 'bulletList' | 'entry';
  text?: string;
  bullets?: string[];
  meta?: ResumeBlockMeta;
  style?: BlockStyle;
}

export interface ResumeSection {
  id: string;
  title: string;
  blocks: ResumeBlock[];
}

export interface ResumeContact {
  phone?: string;
  email?: string;
  location?: string;
}

export interface ResumeDocument {
  fullName?: string;
  contact?: ResumeContact;
  sections: ResumeSection[];
}

export type ResumeOp =
  | { type: 'insertSection'; at: number; section: ResumeSection }
  | { type: 'updateText'; path: string; text: string }
  | { type: 'moveBlock'; path: string; to: number }
  | { type: 'setStyle'; path: string; style: BlockStyle }
  | { type: 'removeBlock'; path: string };

export type ExportFormat = 'pdf' | 'docx';
