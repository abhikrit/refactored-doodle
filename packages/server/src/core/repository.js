// In-memory repository behind the shape of nopCommerce 5.00.1 IRepository<TEntity>.
//
// Deviation P-4 (see CLAUDE.md addendum C-2): the kit recommends MySQL 8 / SQL Server in Docker.
// This prototype has no database by user decision, so the store is a Map per table and every
// method is async - 5.00.1 removed the synchronous IRepository members, so callers written
// against this interface port unchanged to the real Nop.Data repository.
//
// Libraries/Nop.Data/IRepository.cs (release-5.00.1): GetByIdAsync, GetAllAsync, InsertAsync,
// UpdateAsync, DeleteAsync, Table.

let nextId = 1;
const tables = new Map();

const tableOf = (name) => {
  if (!tables.has(name)) tables.set(name, new Map());
  return tables.get(name);
};

export class Repository {
  constructor(entityName) {
    this.entityName = entityName;
  }

  get table() {
    return [...tableOf(this.entityName).values()];
  }

  async getByIdAsync(id) {
    return tableOf(this.entityName).get(Number(id)) ?? null;
  }

  async getAllAsync(predicate) {
    const all = this.table;
    return predicate ? all.filter(predicate) : all;
  }

  async getOneAsync(predicate) {
    return this.table.find(predicate) ?? null;
  }

  async insertAsync(entity) {
    const id = entity.id ?? nextId++;
    if (id >= nextId) nextId = id + 1;
    const stored = { ...entity, id, createdOnUtc: entity.createdOnUtc ?? new Date().toISOString() };
    tableOf(this.entityName).set(id, stored);
    return stored;
  }

  async insertManyAsync(entities) {
    const out = [];
    for (const e of entities) out.push(await this.insertAsync(e));
    return out;
  }

  async updateAsync(entity) {
    if (entity.id == null) throw new Error(`${this.entityName}: update needs an id`);
    const current = tableOf(this.entityName).get(Number(entity.id));
    if (!current) throw new Error(`${this.entityName} ${entity.id} not found`);
    const merged = { ...current, ...entity, updatedOnUtc: new Date().toISOString() };
    tableOf(this.entityName).set(Number(entity.id), merged);
    return merged;
  }

  async deleteAsync(entity) {
    tableOf(this.entityName).delete(Number(entity.id ?? entity));
  }

  async countAsync(predicate) {
    return (await this.getAllAsync(predicate)).length;
  }

  async truncateAsync() {
    tableOf(this.entityName).clear();
  }
}

const repositories = new Map();

/** Resolve the repository for an entity, the way DI resolves IRepository<TEntity>. */
export function repository(entityName) {
  if (!repositories.has(entityName)) repositories.set(entityName, new Repository(entityName));
  return repositories.get(entityName);
}

/** Reset the whole in-memory store (used by the seeder and by tests). */
export async function resetStore() {
  tables.clear();
  repositories.clear();
  nextId = 1;
}

export function storeSnapshot() {
  return Object.fromEntries([...tables.entries()].map(([k, v]) => [k, v.size]));
}
