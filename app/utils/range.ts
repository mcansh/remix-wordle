export function range(start: number, end?: number, step = 1, offset = 0) {
	return new Range(start, end, step, offset)
}

export class Range implements Iterable<number> {
	#start: number
	#end: number | undefined
	#step: number
	#offset: number

	public constructor(start: number, end?: number, step = 1, offset = 0) {
		this.#start = start
		this.#end = end
		this.#step = step
		this.#offset = offset
	}

	public take(count: number): number[] {
		let result: number[] = []
		let index = 0
		for (let value of this) {
			if (index >= count) break
			result.push(value)
			index++
		}
		return result
	}

	public toArray(): number[] {
		return Array.from(this)
	}

	public *[Symbol.iterator](): Iterator<number> {
		let start = this.#start
		let end = this.#end
		let step = this.#step
		let offset = this.#offset

		if (end === undefined) {
			end = start
			start = 0
		}

		if (Number.isNaN(start) || Number.isNaN(end)) return

		let direction = start < end ? 1 : -1
		let startingPoint = start - direction * offset
		let stepSize = direction * step
		let length = Math.abs(end - start) / step + 1

		for (let index = 0; index < length; index++) {
			yield startingPoint + stepSize * index
		}
	}
}
