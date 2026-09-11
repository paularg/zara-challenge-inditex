export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0
