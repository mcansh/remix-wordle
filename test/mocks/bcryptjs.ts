export async function hash(plain: string): Promise<string> {
	return `hashed-${plain}`
}

export async function compare(plain: string, hashed: string): Promise<boolean> {
	return hashed === `hashed-${plain}`
}

export default { hash, compare }
