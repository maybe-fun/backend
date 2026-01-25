// src/common/utils/solana-signature.util.ts
import nacl from 'tweetnacl';
import bs58 from 'bs58';

interface VerifySolanaSignatureParams {
  /**
   * The exact message string that was signed by the wallet.
   * ⚠️ Must be byte-for-byte identical to the challenge message
   * originally returned by the `/auth/challenge` endpoint.
   */
  message: string;

  /**
   * Base58-encoded Ed25519 signature produced by the wallet.
   */
  signature: string;

  /**
   * Base58-encoded Solana public key (wallet address).
   */
  publicKey: string;
}

/**
 * Verifies a Solana wallet signature against a message.
 *
 * @param param.message - The original signed message
 * @param param.signature - Base58 encoded signature
 * @param param.publicKey - Base58 encoded public key
 */
export function verifySolanaSignature({
  message,
  signature,
  publicKey,
}: VerifySolanaSignatureParams): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes,
    );
  } catch {
    return false;
  }
}
