import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { MenuItem, Order, DeliveryPerson, Category, OrderStatus } from './types';

// Generic helper to convert a Firestore snapshot to a typed array
const snapshotToArray = <T>(snapshot: any): (T & { id: string })[] => {
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

// --- READ OPERATIONS ---

export async function fetchCategories(): Promise<Category[]> {
  const snapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
  return snapshotToArray<Category>(snapshot);
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const snapshot = await getDocs(query(collection(db, 'menuItems'), orderBy('name')));
  return snapshotToArray<MenuItem>(snapshot);
}

export async function fetchDeliveryPeople(): Promise<DeliveryPerson[]> {
  const snapshot = await getDocs(query(collection(db, 'deliveryPeople'), orderBy('name')));
  return snapshotToArray<DeliveryPerson>(snapshot);
}

interface FetchOrdersParams {
    statuses?: OrderStatus[];
    status?: OrderStatus;
    limit?: number;
    orderId?: string;
    deliveryPersonId?: string;
}

export async function fetchOrders({ statuses, status, limit, orderId, deliveryPersonId }: FetchOrdersParams): Promise<Order[]> {
    const constraints = [];

    if (statuses && statuses.length > 0) {
        constraints.push(where('status', 'in', statuses));
    } else if (status) {
        constraints.push(where('status', '==', status));
    }
    
    if (orderId) {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? [{ id: docSnap.id, ...docSnap.data() } as Order] : [];
    }

    if (deliveryPersonId) {
        constraints.push(where('deliveryPersonId', '==', deliveryPersonId));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));

    if (limit) {
        constraints.push(firestoreLimit(limit));
    }
    
    const q = query(collection(db, 'orders'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshotToArray<Order>(snapshot);
}


// --- WRITE OPERATIONS ---

// Orders
export async function addOrder(orderData: Omit<Order, 'id'>) {
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return { id: docRef.id, ...orderData };
}

export async function updateOrderStatusInDb(orderId: string, status: OrderStatus) {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
}

// Menu Items
export async function upsertMenuItemInDb(menuItemData: Omit<MenuItem, 'id'>, id?: string) {
    const docRef = id ? doc(db, 'menuItems', id) : doc(collection(db, 'menuItems'));
    await setDoc(docRef, menuItemData);
}

export async function deleteMenuItemInDb(id: string) {
    await deleteDoc(doc(db, 'menuItems', id));
}

export async function updateMenuItemAvailability(id: string, available: boolean) {
    const itemRef = doc(db, 'menuItems', id);
    await updateDoc(itemRef, { available });
    const updatedDoc = await getDoc(itemRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
}

// Delivery People
export async function upsertDeliveryPersonInDb(name: string, password?: string, id?: string) {
    const docRef = id ? doc(db, 'deliveryPeople', id) : doc(collection(db, 'deliveryPeople'));
    const currentData = id ? (await getDoc(docRef)).data() : {};
    
    const dataToSet: Partial<DeliveryPerson> = { name };
    if (password) {
        dataToSet.password = password;
    }
    
    await setDoc(docRef, { ...currentData, ...dataToSet }, { merge: true });
}

export async function deleteDeliveryPersonInDb(id: string) {
    await deleteDoc(doc(db, 'deliveryPeople', id));
}

// Categories
export async function upsertCategoryInDb(categoryData: Omit<Category, 'id'>, id?: string) {
    const docRef = id ? doc(db, 'categories', id) : doc(collection(db, 'categories'));
    await setDoc(docRef, categoryData);
}

export async function deleteCategoryInDb(id: string) {
    await deleteDoc(doc(db, 'categories', id));
}
