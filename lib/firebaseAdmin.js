// Mock firebaseAdmin.js to prevent import errors and runtime crashes
// since firebase-admin has been completely removed to fix Vercel 500 errors.

const mockDocRef = {
  get: async () => ({ exists: false, data: () => ({}) }),
  set: async (data, options) => {},
  update: async (data) => {},
};

const mockQuery = {
  get: async () => ({ docs: [], empty: true, size: 0, forEach: () => {} }),
  where: (field, op, val) => mockQuery,
  limit: (num) => mockQuery,
  orderBy: (field, dir) => mockQuery,
};

const mockCollection = {
  doc: (id) => mockDocRef,
  add: async (data) => mockDocRef,
  get: mockQuery.get,
  where: mockQuery.where,
  limit: mockQuery.limit,
  orderBy: mockQuery.orderBy,
};

export const adminDb = {
  collection: (name) => mockCollection,
  runTransaction: async (callback) => {
    return callback({
      get: (ref) => mockDocRef.get(),
      set: (ref, data) => {},
      update: (ref, data) => {},
    });
  }
};

export const adminAuth = null;
export const isFirebaseAdminConfigured = false;

