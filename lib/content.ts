import services from '@/schema/services.json';
import readiness from '@/schema/readiness.json';
import legal from '@/schema/legal.json';
import site from '@/schema/site.json';
export { services, readiness, legal, site };
export type Priority = 'survey' | 'nhsn' | 'vacant' | 'crisis' | 'rebuild' | 'other';
export function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && [...services.triage.map(t => t.id), 'other'].includes(value);
}
export function triageFor(priority: string) {
  return services.triage.find(t => t.id === priority) ?? {
    id: 'other', label: 'Something else', service: 'Infection Control Consulting',
    response: '1 business day', first: '', cta: 'Schedule a consult'
  };
}
