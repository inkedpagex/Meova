// Mock firebaseAdmin.js to prevent import errors and runtime crashes
// since firebase-admin has been completely removed to fix Vercel 500 errors.

const mockDocRef = {
  get: async () => ({ exists: false, data: () => ({}) }),
  set: async () => {},
  update: async () => {},
};

const mockQuery = {
  get: async () => ({ docs: [], empty: true, size: 0, forEach: () => {} }),
  where: () => mockQuery,
  limit: () => mockQuery,
  orderBy: () => mockQuery,
};

const mockCollection = {
  doc: () => mockDocRef,
  add: async () => mockDocRef,
  get: mockQuery.get,
  where: mockQuery.where,
  limit: mockQuery.limit,
  orderBy: mockQuery.orderBy,
};

export const adminDb = {
  collection: () => mockCollection,
  runTransaction: async (callback) => {
    return callback({
      get: mockDocRef.get,
      set: () => {},
      update: () => {},
    });
  }
};

export const adminAuth = null;
export const isFirebaseAdminConfigured = false;

