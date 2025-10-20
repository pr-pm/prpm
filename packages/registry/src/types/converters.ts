/**
 * Converter-specific types
 */

export interface ConversionMetadata {
  [key: string]: string | number | boolean | undefined;
}

export interface ConversionRequest {
  content: string;
  from: 'cursor' | 'claude' | 'generic';
  to: 'cursor' | 'claude' | 'generic';
  metadata?: ConversionMetadata;
}

export interface MetadataSection {
  type: 'metadata';
  data: Record<string, unknown>;
}

export interface RulesSection {
  type: 'rules';
  title: string;
  items: RuleItem[];
}

export interface RuleItem {
  title?: string;
  content: string;
  examples?: string[];
}

export interface ExamplesSection {
  type: 'examples';
  title: string;
  examples: ExampleItem[];
}

export interface ExampleItem {
  title?: string;
  description?: string;
  code?: string;
  input?: string;
  output?: string;
}

export interface GenericSection {
  type: 'section';
  title: string;
  content: string;
}

export type ContentSection = MetadataSection | RulesSection | ExamplesSection | GenericSection;

export interface ParsedContent {
  sections: ContentSection[];
  metadata: Record<string, string | number | boolean>;
}
