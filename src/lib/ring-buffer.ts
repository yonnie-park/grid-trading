export class RingBuffer<T> {
  private buf: (T | undefined)[]
  private head = 0
  private _size = 0
  private cap: number

  constructor(capacity: number) {
    this.cap = capacity
    this.buf = new Array(capacity)
  }

  push(item: T): void {
    this.buf[this.head] = item
    this.head = (this.head + 1) % this.cap
    if (this._size < this.cap) this._size++
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) return undefined
    const start = this._size < this.cap ? 0 : this.head
    return this.buf[(start + index) % this.cap]
  }

  last(): T | undefined {
    if (this._size === 0) return undefined
    return this.get(this._size - 1)
  }

  get size(): number {
    return this._size
  }

  findInRange(predicate: (item: T) => boolean): T[] {
    const result: T[] = []
    for (let i = 0; i < this._size; i++) {
      const item = this.get(i)
      if (item && predicate(item)) result.push(item)
    }
    return result
  }
}
