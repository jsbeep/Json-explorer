// path: src/utils/jsonTree.ts
import {
  isBsonObjectId,
  isBsonDate,
  isBsonDecimal128,
  isBsonLong,
  type Document,
  type JsonValue,
} from '../types/explorer';

export type JsonFieldType =
  | 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'
  | 'oid' | 'date' | 'decimal128' | 'long';

// 자동 EJSON 모드 감지의 신호로 쓰는 타입 — oid도 MongoDB/EJSON 데이터임을 보여주는 신호이므로 포함
const EXTENDED_TYPES: JsonFieldType[] = ['oid', 'date', 'decimal128', 'long'];

export const getFieldType = (v: JsonValue): JsonFieldType => {
  if (v === null) return 'null';
  if (isBsonObjectId(v)) return 'oid';
  if (isBsonDate(v)) return 'date';
  if (isBsonDecimal128(v)) return 'decimal128';
  if (isBsonLong(v)) return 'long';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'object') return 'object';
  return typeof v as 'string' | 'number' | 'boolean';
};

// node(및 그 하위 전체)에 ObjectId/Date/Decimal128/Long 중 하나라도 있으면 true —
// 새 컬럼이 마운트될 때 EJSON 토글의 자동 기본값으로 쓴다.
export const hasExtendedTypes = (node: JsonValue): boolean => {
  const type = getFieldType(node);
  if (EXTENDED_TYPES.includes(type)) return true;
  if (type !== 'object' && type !== 'array') return false;
  return getEntries(node).some(({ value }) => hasExtendedTypes(value));
};

export const resolveAtPath = (doc: Document, path: string[]): JsonValue => {
  let node: JsonValue = doc;
  for (const seg of path) {
    if (node === null || typeof node !== 'object') return null;
    if (Array.isArray(node)) {
      node = (node as JsonValue[])[Number(seg)] ?? null;
    } else {
      node = (node as Record<string, JsonValue>)[seg] ?? null;
    }
  }
  return node;
};

export const isExpandableType = (t: JsonFieldType): boolean => t === 'object' || t === 'array';

export const getEntries = (node: JsonValue): { key: string; value: JsonValue }[] => {
  if (node === null || typeof node !== 'object') return [];
  if (Array.isArray(node)) {
    return (node as JsonValue[]).map((v, i) => ({ key: String(i), value: v }));
  }
  return Object.entries(node as Record<string, JsonValue>).map(([k, v]) => ({ key: k, value: v }));
};
