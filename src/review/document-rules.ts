export const requiredDocumentsByMode = {
  standard: [
    "proposal.md",
    "clarification.md",
    "requirements.md",
    "design.md",
    "tasks.md",
    "test-case.md",
    "test-case.json",
    "traceability.json",
  ],
  lite: [
    "proposal.md",
    "requirements.md",
    "tasks.md",
    "test-case.md",
    "test-case.json",
    "traceability.json",
  ],
} as const;

export const documentSectionRules: Record<string, string[]> = {
  "proposal.md": ["# Proposal", "## Goals", "## Recommended Workflow Mode"],
  "clarification.md": ["# Clarification", "## Summary"],
  "requirements.md": ["# Requirements", "## Requirements"],
  "design.md": ["# Design", "## Overview"],
  "tasks.md": ["# Tasks"],
  "test-case.md": ["# Test Cases"],
};
