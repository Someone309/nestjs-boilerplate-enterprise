import { AggregateRoot } from '@core/domain/base';

/**
 * Tenant Status Enum
 */
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

/**
 * Tenant Settings
 */
export interface TenantSettings {
  maxUsers?: number;
  features?: string[];
  customDomain?: string;
  theme?: {
    primaryColor?: string;
    logo?: string;
  };
  [key: string]: unknown;
}

/**
 * Tenant Props Interface
 */
export interface TenantProps {
  name: string;
  slug: string;
  status: TenantStatus;
  settings?: TenantSettings;
  ownerId?: string;
  trialEndsAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Tenant Entity
 *
 * Aggregate root for multi-tenancy.
 *
 * Section 3.2: Featues - TenantModule
 */
export class Tenant extends AggregateRoot {
  private _name: string;
  private _slug: string;
  private _status: TenantStatus;
  private _settings: TenantSettings;
  private _ownerId?: string;
  private _trialEndsAt?: Date;

  private constructor(id: string, props: TenantProps) {
    super(id);
    this._name = props.name;
    this._slug = props.slug;
    this._status = props.status;
    this._settings = { ...(props.settings || {}) };
    this._ownerId = props.ownerId;
    this._trialEndsAt = props.trialEndsAt;
    if (props.createdAt) {
      this._createdAt = props.createdAt;
    }
    if (props.updatedAt) {
      this._updatedAt = props.updatedAt;
    }
  }

  /**
   * Create a new tenant
   */
  static create(id: string, props: TenantProps): Tenant {
    return new Tenant(id, props);
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(id: string, props: TenantProps): Tenant {
    return new Tenant(id, props);
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get slug(): string {
    return this._slug;
  }

  get status(): TenantStatus {
    return this._status;
  }

  get settings(): TenantSettings {
    return { ...this._settings };
  }

  get ownerId(): string | undefined {
    return this._ownerId;
  }

  get trialEndsAt(): Date | undefined {
    return this._trialEndsAt;
  }

  get isActive(): boolean {
    return this._status === TenantStatus.ACTIVE;
  }

  get isTrial(): boolean {
    return this._status === TenantStatus.TRIAL;
  }

  get isTrialExpired(): boolean {
    if (!this._trialEndsAt) {
      return false;
    }
    return new Date() > this._trialEndsAt;
  }

  // Behaviors
  activate(): void {
    this._status = TenantStatus.ACTIVE;
    this.markUpdated();
  }

  suspend(): void {
    this._status = TenantStatus.SUSPENDED;
    this.markUpdated();
  }

  deactivate(): void {
    this._status = TenantStatus.INACTIVE;
    this.markUpdated();
  }

  updateSettings(settings: Partial<TenantSettings>): void {
    this._settings = { ...this._settings, ...settings };
    this.markUpdated();
  }

  updateName(name: string): void {
    this._name = name;
    this.markUpdated();
  }

  transferOwnership(newOwnerId: string): void {
    this._ownerId = newOwnerId;
    this.markUpdated();
  }
}
