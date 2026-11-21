# 🛡️ DevShelf Native Binary Cryptographic Code-Signing Policy (SEC-06)

DevShelf curates hundreds of developer tools, CLI utilities, and runtime binaries. To ensure our community of over 50,000 monthly developers is protected from untrusted execution and supply-chain compromises, DevShelf enforces the **SEC-06 Native Binary Cryptographic Code-Signing Policy**.

---

## 📌 Scope

This policy applies to all submissions distributing pre-compiled native binaries, including:
- **Windows executables and installers**: `.exe`, `.msi`, `.sys` (kernel drivers, ETW performance monitors).
- **macOS binaries and bundles**: `.dmg`, `.pkg`, `.app` bundles, Mach-O executables.
- **Tools classified under**: `OS & Hardware Utilities`, low-level systems utilities, or tools matching native desktop/kernel keywords.

---

## 🔒 Code-Signing Attestation Requirements

To receive **Verified** or **Featured** badges on DevShelf, native binary distributions must be cryptographically signed by a recognized Certificate Authority or Platform Vendor:

| Platform | Required Attestation | Verification Standard |
| :--- | :--- | :--- |
| **Windows** | Microsoft Authenticode | Valid code-signing certificate (Standard or EV) recognized by SmartScreen. |
| **macOS** | Apple Developer ID & Notarization | Apple Developer ID Application signature stapled with an Apple Notarization Ticket (Gatekeeper compliant). |
| **Linux** | GPG / Cosign / SLSA Attestation | Signed release tarballs or container images with public verifiable key/identity. |

---

## 📝 Submitting a Native Binary

When submitting or updating a tool in `shelf/cli-tools.json` or `shelf/testing-qa.json`:

1. Set `"nativeBinary": true` in the tool entry.
2. If signed and notarized, set `"codeSigned": true`.
3. In your Pull Request description, include the following verification details:
   - **Windows Authenticode**: Issuer CN, Certificate Thumbprint, or `signtool verify /pa` output snippet.
   - **macOS Notarization**: Apple Team ID, Developer ID certificate name, or `spctl -a -vv` output snippet.
   - **Release Checksums**: Direct link to the release `SHA256SUMS` or GitHub release artifacts.

### Example JSON Submission

```json
{
  "name": "FastBench",
  "url": "https://fastbench.dev",
  "category": "Benchmarking & Performance",
  "description": "High-precision native CPU and GPU latency benchmarking tool for Windows and macOS.",
  "language": "Rust",
  "license": "MIT",
  "nativeBinary": true,
  "codeSigned": true,
  "tags": ["benchmarking", "profiler", "performance", "rust"]
}
```

---

## ⚠️ Policy Enforcement & Unsigned Binaries

The automated validation pipeline (`scripts/binary-trust-policy.ts`) checks all entries:

- **Unsigned Binaries (`codeSigned: false` or omitted)**:
  - May still be indexed in DevShelf as free open-source tools.
  - Will be labeled with the safety tag: `[UNVERIFIED BINARY - UNSIGNED]`.
  - **Cannot** claim `verified: true` or `featured: true` status. Any PR attempting to mark an unsigned binary as Verified will be blocked by CI.
- **Signed Binaries (`codeSigned: true`)**:
  - Eligible for full `verified: true` and `featured: true` status across the DevShelf web portal, CLI, and API.

---

## 🧪 Testing Policy Compliance Locally

You can test whether your entry satisfies the security policy before pushing:

```bash
# Run security and schema validations
pnpm run validate:pr
```

If you have any questions or require an editorial security review, open an issue under [Security Inquiry](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=03_feature_request.yml).
