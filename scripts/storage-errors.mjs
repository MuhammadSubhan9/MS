export function logStorageFailure(operation, error, request) {
  const knownCode = String(error?.cause?.message || error?.message || '')
    .match(/\b(?:SQLITE_[A-Z_]+|D1_[A-Z_]+)\b/)?.[0];
  console.error(JSON.stringify({
    operation,
    cause: knownCode || 'storage-error',
    requestId: request.headers.get('CF-Ray')?.match(/^[a-zA-Z0-9-]{1,64}$/)?.[0] || undefined,
  }));
}
