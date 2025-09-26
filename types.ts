export enum FieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  DROPDOWN = 'DROPDOWN',
}

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  isFixed?: boolean;
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  handlerLdap: string; // 담당자 이메일 대신 LDAP 계정
  fields: FormField[];
}
