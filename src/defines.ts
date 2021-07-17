export const DIALECTS = ['mssql', 'sqlite', 'mysql', 'psql', 'generic'] as const;
export type Dialect = typeof DIALECTS[number];
export type StatementType = 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'SELECT'
  | 'TRUNCATE'
  | 'CREATE_DATABASE'
  | 'CREATE_TABLE'
  | 'CREATE_VIEW'
  | 'CREATE_TRIGGER'
  | 'CREATE_FUNCTION'
  | 'DROP_DATABASE'
  | 'DROP_TABLE'
  | 'DROP_VIEW'
  | 'DROP_TRIGGER'
  | 'DROP_FUNCTION'
  | 'UNKNOWN';
export type ExecutionType = 'LISTING' | 'MODIFICATION' | 'UNKNOWN';

export interface IdentifyOptions {
  strict?: boolean
  dialect?: Dialect;
}

export interface IdentifyResult {
  start: number;
  end: number;
  text: string;
  type: StatementType;
  executionType: ExecutionType;
}

export interface Statement {
  start: number;
  end: number;
  type?: StatementType;
  executionType?: ExecutionType;
  endStatement?: string;
  canEnd?: boolean;
  definer?: number;
  algorithm?: number;
  sqlSecurity?: number;
}

export interface ConcreteStatement extends Statement {
  type: StatementType;
  executionType: ExecutionType;
}

export interface State {
  start: number;
  end: number;
  position: number;
  input: string;
}

export interface Token {
  type:
    'whitespace'
    | 'comment-inline'
    | 'comment-block'
    | 'string'
    | 'semicolon'
    | 'keyword'
    | 'unknown';
  value: string;
  start: number;
  end: number;
}

export interface ParseResult {
  type: 'QUERY';
  start: number;
  end: number;
  body: ConcreteStatement[];
  tokens: Token[];
}

export interface Step {
  preCanGoToNext: (token?: Token) => boolean;
  validation?: {
    requireBefore?: string[];
    acceptTokens: {type: string; value: string;}[];
  };
  add: (token: Token) => void;
  postCanGoToNext: (token?: Token) => boolean;
}
