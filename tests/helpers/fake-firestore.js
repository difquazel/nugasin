'use strict';

// In-memory optimistic transactions for service tests. Every callback reads a
// snapshot; a competing commit invalidates it and reruns the callback. This
// deliberately exercises retry safety rather than serializing all operations.
const copy = value => value === undefined ? undefined : structuredClone(value);
const merge = (previous = {}, update = {}) => {
  const result = copy(previous);
  for (const [key, value] of Object.entries(update)) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(previous[key] && typeof previous[key] === 'object' ? previous[key] : {}, value)
      : copy(value);
  }
  return result;
};

class DocumentReference {
  constructor(db, path) { this.db = db; this.path = path; this.id = path.split('/').at(-1); }
  collection(name) { return new CollectionReference(this.db, `${this.path}/${name}`); }
  async get() { return this.db.snapshot(this, this.db.documents); }
  async set(data, options) { this.db.seed(this.path, options?.merge ? merge(this.db.read(this.path), data) : data); }
  async delete() { this.db.documents.delete(this.path); this.db.revision++; }
}

class CollectionReference {
  constructor(db, path, filters = []) { this.db = db; this.path = path; this.filters = filters; }
  doc(id) { return new DocumentReference(this.db, `${this.path}/${id}`); }
  where(field, operator, value) {
    if (operator !== '==') throw new Error(`Unsupported fake query operator: ${operator}`);
    return new CollectionReference(this.db, this.path, [...this.filters, [field, value]]);
  }
  async get() { return this.db.snapshot(this, this.db.documents); }
}

class FakeFirestore {
  constructor(initial = {}) {
    this.documents = new Map(Object.entries(initial).map(([name, value]) => [name, copy(value)]));
    this.revision = 0;
    this.retryCount = 0;
    this.forceRetries = 0;
  }
  collection(name) { return new CollectionReference(this, name); }
  doc(name) { return new DocumentReference(this, name); }
  seed(name, value) { this.documents.set(name, copy(value)); this.revision++; }
  read(name) { return copy(this.documents.get(name)); }
  list(prefix) { return [...this.documents.entries()].filter(([name]) => name.startsWith(`${prefix}/`)).map(([name, data]) => ({ path: name, data: copy(data) })); }
  snapshot(ref, documents) {
    if (ref instanceof DocumentReference) {
      const data = documents.get(ref.path);
      return { id: ref.id, ref, exists: data !== undefined, data: () => copy(data) };
    }
    const docs = [...documents.entries()]
      .filter(([name, data]) => name.startsWith(`${ref.path}/`) && !name.slice(ref.path.length + 1).includes('/') && ref.filters.every(([field, value]) => data[field] === value))
      .map(([name]) => this.snapshot(new DocumentReference(this, name), documents));
    return { docs, empty: docs.length === 0, size: docs.length, forEach: callback => docs.forEach(callback) };
  }
  async runTransaction(callback) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const revision = this.revision;
      const snapshot = new Map([...this.documents].map(([name, data]) => [name, copy(data)]));
      const writes = [];
      let hasWrites = false;
      const tx = {
        get: async ref => {
          if (hasWrites) throw new Error('Firestore transactions require all reads before writes');
          return this.snapshot(ref, snapshot);
        },
        getAll: async (...refs) => {
          if (hasWrites) throw new Error('Firestore transactions require all reads before writes');
          return refs.map(ref => this.snapshot(ref, snapshot));
        },
        create: (ref, data) => { hasWrites = true; writes.push({ type: 'create', ref, data }); },
        set: (ref, data, options) => { hasWrites = true; writes.push({ type: 'set', ref, data, options }); },
        update: (ref, data) => { hasWrites = true; writes.push({ type: 'update', ref, data }); }
      };
      const result = await callback(tx);
      if (this.forceRetries > 0 || revision !== this.revision) {
        if (this.forceRetries > 0) this.forceRetries--;
        this.retryCount++;
        continue;
      }
      const next = new Map(this.documents);
      for (const { type, ref, data, options } of writes) {
        if (type === 'create' && next.has(ref.path)) throw new Error(`Document already exists: ${ref.path}`);
        if (type === 'update' && !next.has(ref.path)) throw new Error(`Document does not exist: ${ref.path}`);
        next.set(ref.path, copy(type === 'update' || options?.merge ? merge(next.get(ref.path), data) : data));
      }
      if (writes.length) { this.documents = next; this.revision++; }
      return result;
    }
    throw new Error('Fake transaction retry limit exceeded');
  }
}

module.exports = { FakeFirestore };
