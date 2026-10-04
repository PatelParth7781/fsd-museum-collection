import api from '@/lib/api';

export async function logAction(
  action: string,
  entityType: string = '',
  entityId: string | null = null,
  description: string = ''
) {
  try {
    await api.post('/audit', {
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: description,
      description,
    });
  } catch {
    // Silent fail — audit logging should not break user flows
  }
}
