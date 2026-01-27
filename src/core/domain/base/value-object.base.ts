/**
 * Base Value Object Class
 *
 * All domain value objects must extend this class.
 * Value objects are immutable and compared by value, not identity.
 *
 * Section 2.3: Domain Layer - ValueObject has no ID, equality by value
 */
export abstract class ValueObject<TProps> {
  protected readonly props: TProps;

  constructor(props: TProps) {
    this.props = Object.freeze(props);
  }

  /**
   * Value objects are equal if all their properties are equal
   */
  equals(other?: ValueObject<TProps>): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (!(other instanceof ValueObject)) {
      return false;
    }

    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }

  /**
   * Clone the value object with updated properties
   * Returns a new instance (immutability)
   */
  protected clone(props: Partial<TProps>): this {
    const Constructor = this.constructor as new (props: TProps) => this;
    return new Constructor({
      ...this.props,
      ...props,
    });
  }
}
