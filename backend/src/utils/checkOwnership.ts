import { AppError } from './AppError'

export function checkOwnership<T extends { usuarioId: string }>(
  entity: T | null | undefined,
  userId: string,
  entityName = 'Recurso'
): asserts entity is T {
  if (!entity || entity.usuarioId !== userId) {
    throw new AppError(`${entityName} não encontrado(a)`, 404)
  }
}
