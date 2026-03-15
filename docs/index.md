# Docs Index

Structured repository knowledge base.

This directory is the system of record for product intent, plans, generated knowledge, and external references.

## Layout

```text
docs/
├── design-docs/
│   ├── index.md
│   ├── core-beliefs.md
│   ├── harness-engineering.md
│   └── verification-status.md
├── exec-plans/
│   ├── active/
│   │   └── README.md
│   ├── completed/
│   │   └── README.md
│   └── tech-debt-tracker.md
├── generated/
│   ├── index.md
│   └── db-schema.md
├── product-specs/
│   ├── index.md
│   ├── cli-contract.md
│   ├── new-user-onboarding.md
│   └── testing-spec.md
├── references/
│   ├── index.md
│   ├── devonthink-scripting-llms.txt
│   └── harness-engineering-llms.txt
├── DESIGN.md
├── FRONTEND.md
├── PLANS.md
├── PRODUCT_SENSE.md
├── QUALITY_SCORE.md
├── RELIABILITY.md
└── SECURITY.md
```

## How To Read

- Start with `README.md` for end-user usage.
- Start with `AGENTS.md` if you are maintaining or automating work in this repo.
- Use `ARCHITECTURE.md` for the top-level system map.
- Use `design-docs/` for principles and constraints.
- Use `product-specs/` for user-visible behavior.
- Use `exec-plans/` for in-progress or deferred work.
- Use `generated/` for artifacts derived from authoritative sources.
- Use `references/` for external source notes and URLs that agents may need to revisit.
