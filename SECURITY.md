# Security Policy

## Supported Versions

This is a personal Slack bot project. Only the latest version under active development is supported.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < latest | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it through one of the following methods:

1. **GitHub Issues**: Create a new issue at [Issues](https://github.com/ta-dadadada/trrbot-ts-bolt/issues)
   - Add the `security` label
   - If possible, include details and steps to reproduce

2. **For sensitive issues**: Use GitHub [Security Advisories](https://github.com/ta-dadadada/trrbot-ts-bolt/security/advisories/new) for private reporting

## Automated Security Scanning

This project implements the following automated security measures:

- **Dependabot Security Updates**: Automatically detects vulnerable dependencies and creates PRs
- **Dependabot Auto-merge**: Automatically merges patch and minor security updates
- **Secret Scanning**: Detects and prevents accidental commits of secrets (API keys, etc.)
- **Scheduled Scans**: Weekly dependency vulnerability checks every Monday at 9:00 AM JST

For more details, see the Security section in [README.md](README.md).

## Response Policy

- **High-severity vulnerabilities**: Will be addressed as soon as possible
- **Low-severity vulnerabilities**: Will be addressed through Dependabot auto-updates or during the next maintenance cycle
- **Status updates**: Progress will be shared through comments on the reported issue

Please note that response times may vary as this is a personal project maintained on a best-effort basis.
