## Linux Hardening — purpose
This document collects vetted resources and a short checklist to help system administrators and defenders harden Linux hosts.

If you'd like, I can expand any checklist item into example commands (Ubuntu/CentOS) or open a PR with small, low-risk hardened examples.

## Table of contents
- Linux basics and learning
- Benchmarks & hardening guides
- Security modules
- Quick hardening checklist
- Additional resources

## Linux basics and learning
- [Null-byte Linux Basics](https://null-byte.wonderhowto.com/how-to/linux-basics/)
- [Kali Linux Revealed Free Course](https://kali.training/)

### Practice
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/)
- [TryHackMe: Linux Modules](https://tryhackme.com/room/linuxmodules)

## Benchmarks and hardening guides
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [DoD STIGs (operating systems)](https://public.cyber.mil/stigs/downloads/?_dl_facet_stigs=operating-systems)
- [STIG-compliant AMIs via EC2 Image Builder (AWS)](https://aws.amazon.com/blogs/security/quickly-build-stig-compliant-amazon-machine-images-using-amazon-ec2-image-builder/)
- [How to Secure and Harden Cloud VM (Ubuntu & CentOS)](https://geekflare.com/cloud-vm-security-guide/)
- [Harden OpenSSH (DigitalOcean guide)](https://www.digitalocean.com/community/tutorials/how-to-harden-openssh-on-ubuntu-20-04)

## Security modules
- [SELinux](https://selinuxproject.org)
- [AppArmor](https://apparmor.net/)
- [Smack (Wikipedia)](https://en.wikipedia.org/wiki/Smack_(software))
- [Tomoyo Linux (Wikipedia)](https://en.wikipedia.org/wiki/Tomoyo_Linux)

## Quick hardening checklist (minimal, high-impact)
Use this as a starting checklist; expand to playbooks or automation as needed.

- Keep the kernel and packages updated (apt/yum/dnf) and apply security updates automatically where appropriate.
- Enforce strong SSH hardening: disable root login, disable password authentication, use key-only access, change SSH port only as obfuscation, and enable Fail2Ban or equivalent rate-limiting.
- Configure a host-based firewall (UFW/iptables/nftables) to allow only required services and drop by default.
- Install and enable automatic security updates (unattended-upgrades on Debian/Ubuntu) or a patch management process.
- Use disk encryption for laptops and sensitive systems (LUKS/FDE) and protect recovery keys.
- Enable and configure a Linux security module (AppArmor/SELinux) with at least targeted policies.
- Install and configure an auditing/logging stack (auditd, rsyslog/journald → central logging) and monitor for anomalies.
- Use least-privilege: drop unnecessary packages/services, use dedicated service accounts, and enable sudo logging.
- Protect secrets: use a secrets manager (Vault, SOPS) — do not store keys or passwords in plaintext in the repo.
- Use FIDO2/2FA for interactive logins where possible and require MFA for administrative access.

## Additional resources
- [Linux Kernel Exploitation](https://github.com/xairy/linux-kernel-exploitation)
- [The Linux Auditing Framework (audit-userspace)](https://github.com/linux-audit/audit-userspace)
- [DevSec Linux Baseline](https://github.com/dev-sec/linux-baseline)
- [SCAP / OpenSCAP security policies](https://www.open-scap.org/security-policies/)
- [Linux Privilege Checker](https://github.com/sleventyeleven/linuxprivchecker)

---
Notes: this file was lightly reorganized for clarity. I can (a) add example commands for Ubuntu/CentOS, (b) add a TOC with linkable headings, or (c) open a small PR with the above changes plus example scripts — tell me which you prefer.