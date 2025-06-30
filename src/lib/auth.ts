import { cookies } from 'next/headers';
import { deliveryPeople } from './data';

export function getDriverSession() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('driver_session')?.value;
  if (!sessionId) return null;

  const driver = deliveryPeople.find(d => d.id === sessionId);
  return driver || null;
}
