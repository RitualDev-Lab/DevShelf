/**
 * DevShelf Native Binary Cryptographic Code-Signing Policy (SEC-06)
 *
 * Prevents unsigned native OS executables (Windows .exe / macOS .dmg / kernel utilities)
 * from receiving "Verified" or "Featured" trust badges without Authenticode or Apple Notarization.
 */

export interface BinaryTrustCandidate {
  name: string;
  category?: string;
  description?: string;
  language?: string;
  nativeBinary?: boolean;
  codeSigned?: boolean;
  featured?: boolean;
  verified?: boolean;
  statusTags?: string[];
  securityWarning?: string;
}

export interface BinaryTrustEvaluation {
  isNativeBinary: boolean;
  isSigned: boolean;
  allowedVerifiedBadge: boolean;
  warningLabel?: string;
  errors: string[];
}

const NATIVE_BINARY_HINTS =
  /\b(windows\s+(?:performance\s+)?utility|\.exe\b|\.msi\b|\.dmg\b|native\s+(?:windows|macos)\s+binary|kernel\s+driver|etw\s+fps)\b/i;

export function evaluateBinaryTrustPolicy(item: BinaryTrustCandidate): BinaryTrustEvaluation {
  const isNativeBinary =
    item.nativeBinary === true ||
    item.category === "OS & Hardware Utilities" ||
    NATIVE_BINARY_HINTS.test(item.description || "");

  if (!isNativeBinary) {
    return {
      isNativeBinary: false,
      isSigned: true,
      allowedVerifiedBadge: true,
      errors: [],
    };
  }

  const isSigned = item.codeSigned === true;
  if (isSigned) {
    return {
      isNativeBinary: true,
      isSigned: true,
      allowedVerifiedBadge: true,
      errors: [],
    };
  }

  const warningLabel = "[UNVERIFIED BINARY - UNSIGNED]";
  const errors: string[] = [];
  const claimsVerified =
    item.featured === true ||
    item.verified === true ||
    (item.statusTags || []).some((t) => /^verified$/i.test(t));

  if (claimsVerified) {
    errors.push(
      `Unsigned native OS executable '${item.name}' cannot receive Verified/Featured status without codeSigned: true (Authenticode or Apple Notarization).`,
    );
  }

  return {
    isNativeBinary: true,
    isSigned: false,
    allowedVerifiedBadge: false,
    warningLabel,
    errors,
  };
}
