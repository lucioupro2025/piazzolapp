import { cookies } from 'next/headers';
import { getDeliveryPeople } from './api';

export async function getDriverSession() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('driver_session')?.value;
  if (!sessionId) return null;

  const deliveryPeople = await getDeliveryPeople();
  const driver = deliveryPeople.find(d => d.id === sessionId);
  return driver || null;
}
