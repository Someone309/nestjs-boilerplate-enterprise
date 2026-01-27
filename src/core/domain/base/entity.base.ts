/**
 * Base Entity Class
 *
 * All domain entities must extend this class.
 * Provides identity-based equality and lifecycle tracking.
 *
 * Section 2.3: Domain Layer - Entity has unique ID, mutable state
 */
export abstract class Entity<TId = string> {
  protected readonly _id: TId;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: TId) {
    this._id = id;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): TId {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Mark entity as updated
   */
  protected markUpdated(): void {
    this._updatedAt = new Date();
  }

  /**
   * Entities are equal if their IDs are equal
   */
  equals(other?: Entity<TId>): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (!(other instanceof Entity)) {
      return false;
    }

    return this._id === other._id;
  }
}
