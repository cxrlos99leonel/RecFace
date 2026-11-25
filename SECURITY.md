# Security Policy

RecFace is an academic project. This repository contains **no real credentials and no personal or
biometric data**: production secrets live only in the hosting provider's environment variables, and
face photos are never stored (only 128-number face vectors, kept in the production database).

## Reporting a vulnerability

Please **do not open a public issue** for security problems.
Report them privately through GitHub's
[private vulnerability reporting](https://github.com/cxrlos99leonel/RecFace/security/advisories/new),
including steps to reproduce. You can expect a reply within a few days.

## Known limitations

These are documented design limits, not vulnerabilities:

- **No liveness detection:** a printed photo of an enrolled face may be accepted.
- **Open entrance terminal:** face recognition and enrollment do not require login, by design, so the
  terminal must be supervised by event staff.
- **Single admin account:** credentials come from environment variables; there is no user management.
