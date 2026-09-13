import { AxiosError } from 'axios';

function shouldRetry(error: unknown): boolean {
  const err = error as AxiosError;
  const status = err.response?.status;

  if (status) {
    return status >= 500;
  }

  const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];
  return retryableCodes.includes(err.code ?? '');
}

export async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!shouldRetry(err)) throw err;
      if (i === retries - 1) throw err;

      const delay = Math.pow(2, i) * 200 + Math.random() * 200;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}
