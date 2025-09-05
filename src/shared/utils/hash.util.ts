import * as bcrypt from 'bcrypt';

export class HashUtil {
    // Further reduce salt rounds in production for constrained CPU environments
    private static saltRounds = process.env.NODE_ENV === 'production' ? 6 : 10;

    static async hashPassword(password: string): Promise<string> {
        const timeoutMs = process.env.NODE_ENV === 'production' ? 5000 : 10000;
        
        return Promise.race([
            bcrypt.hash(password, this.saltRounds),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Password hashing timeout')), timeoutMs)
            )
        ]);
    }

    static async comparePassword(password: string, hash: string): Promise<boolean> {
        const timeoutMs = process.env.NODE_ENV === 'production' ? 3000 : 5000;
        
        return Promise.race([
            bcrypt.compare(password, hash),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Password comparison timeout')), timeoutMs)
            )
        ]);
    }
}