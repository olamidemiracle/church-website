/**
 * services/firestore.service.js
 * -----------------------------------------------------------------------
 * Thin, reusable data-access layer over the Firestore SDK. Pages never
 * call `getDoc`/`getDocs`/`addDoc` directly — they call these functions
 * instead. This keeps query logic in one place, makes it easy to add
 * caching/error-handling later, and matches Section 5 of the project
 * plan's collection schema.
 * -----------------------------------------------------------------------
 */

import { db } from './firebase.js';

// See services/firebase.js for the explanation of why this project imports
// the Firebase SDK from the CDN rather than a bare 'firebase/firestore'
// specifier (no bundler yet). Keep this version in sync with firebase.js's
// FIREBASE_SDK_VERSION.
const {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit: fsLimit,
  addDoc,
  serverTimestamp,
} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');

/** Fetches a single document by collection + id. Returns null if missing. */
export async function getDocument(collectionName, id) {
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error(`[firestore] getDocument(${collectionName}/${id}) failed:`, error);
    throw error;
  }
}

/**
 * Fetches a list of documents from a collection with optional ordering,
 * a max result count, and simple equality filters.
 *
 * Example:
 *   getCollectionList('ministries', { orderByField: 'order' })
 *   getCollectionList('events', { where: [['category', '==', 'youth']] })
 */
export async function getCollectionList(collectionName, options = {}) {
  const { orderByField, orderDirection = 'asc', limit, where: whereClauses = [] } = options;

  try {
    const constraints = whereClauses.map(([field, op, value]) => where(field, op, value));
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection));
    }
    if (limit) {
      constraints.push(fsLimit(limit));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error(`[firestore] getCollectionList(${collectionName}) failed:`, error);
    throw error;
  }
}

/** Fetches a single document by matching a field (e.g. slug) rather than doc id. */
export async function getDocumentByField(collectionName, field, value) {
  try {
    const q = query(collection(db, collectionName), where(field, '==', value), fsLimit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      return null;
    }
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (error) {
    console.error(`[firestore] getDocumentByField(${collectionName}.${field}) failed:`, error);
    throw error;
  }
}

/**
 * Creates a new document in a collection (used by public forms: Contact,
 * Prayer Request, Membership, etc.). Automatically stamps `submittedAt`.
 * Allowed by firestore.rules for these specific collections (create-only).
 */
export async function createDocument(collectionName, data) {
  try {
    const ref = await addDoc(collection(db, collectionName), {
      ...data,
      submittedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    console.error(`[firestore] createDocument(${collectionName}) failed:`, error);
    throw error;
  }
}
