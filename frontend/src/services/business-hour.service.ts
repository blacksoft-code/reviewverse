import { apiFetch } from '@/lib/api';

export type BusinessHour = {
  id: string;
  entityId: string;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  isClosed: boolean;
  openTime: string | null; // "HH:mm"
  closeTime: string | null; // "HH:mm"
};

export type BusinessHourInput = {
  dayOfWeek: number;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
};

export type BusinessHoursData = {
  hours: BusinessHour[];
  isOpenNow: boolean;
};

export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

type BusinessHoursResponse = {
  success: boolean;
  statusCode: number;
  data: BusinessHoursData;
};

type SetBusinessHoursResponse = {
  success: boolean;
  statusCode: number;
  data: BusinessHour[];
};

// GET — public, auth লাগে না
export async function getBusinessHours(entityId: string) {
  return apiFetch<BusinessHoursResponse>(
    `/entities/${entityId}/business-hours`,
  );
}

// PUT — owner/manager/employee, JwtAuthGuard লাগে
export async function setBusinessHours(
  entityId: string,
  hours: BusinessHourInput[],
) {
  return apiFetch<SetBusinessHoursResponse>(
    `/entities/${entityId}/business-hours`,
    {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    },
  );
}