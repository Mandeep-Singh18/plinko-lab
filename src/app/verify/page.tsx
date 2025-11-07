'use client';

import { useState, FormEvent } from 'react';

interface VerifyResult {
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
  path: ('L' | 'R')[];
}

export default function VerifyPage() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams({
      serverSeed: formData.get('serverSeed') as string,
      clientSeed: formData.get('clientSeed') as string,
      nonce: formData.get('nonce') as string,
      dropColumn: formData.get('dropColumn') as string,
    });

    try {
      const res = await fetch(`/api/verify?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Error: ${await res.text()}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Round Verifier</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md p-4 bg-gray-100 rounded-lg shadow">
        <div className="mb-4">
          <label htmlFor="serverSeed" className="block mb-1 text-sm font-medium">Server Seed</label>
          <input id="serverSeed" name="serverSeed" type="text" required className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label htmlFor="clientSeed" className="block mb-1 text-sm font-medium">Client Seed</label>
          <input id="clientSeed" name="clientSeed" type="text" required className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label htmlFor="nonce" className="block mb-1 text-sm font-medium">Nonce</label>
          <input id="nonce" name="nonce" type="text" required className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label htmlFor="dropColumn" className="block mb-1 text-sm font-medium">Drop Column (0-12)</label>
          <input id="dropColumn" name="dropColumn" type="number" min="0" max="12" required className="w-full p-2 border rounded" />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-3 text-white bg-blue-600 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Verifying...' : 'Verify Round'}
        </button>
      </form>

      {error && (
        <div className="w-full max-w-md p-4 mt-4 bg-red-100 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="w-full max-w-md p-4 mt-4 bg-green-100 text-green-700 rounded-lg">
          <h2 className="text-xl font-bold mb-2">✅ Verification Passed</h2>
          <p><strong>Calculated Bin:</strong> {result.binIndex}</p>
          <p className="text-xs break-all"><strong>Commit Hex:</strong> {result.commitHex}</p>
          <p className="text-xs break-all"><strong>Combined Seed:</strong> {result.combinedSeed}</p>
          <p className="text-xs break-all"><strong>PegMap Hash:</strong> {result.pegMapHash}</p>
          <p className="text-xs break-all"><strong>Path:</strong> {result.path.join(', ')}</p>
        </div>
      )}
    </div>
  );
}