declare module 'bcryptjs' {
  export function hash(s: string, rounds: number): Promise<string>
  export function hashSync(s: string, rounds: number): string
  export function compare(s: string, hash: string): Promise<boolean>
  export function compareSync(s: string, hash: string): boolean
  export function genSalt(rounds?: number): Promise<string>
  export function genSaltSync(rounds?: number): string
}
