import { documentSectionRules, requiredDocumentsByMode } from "./document-rules.js";

export type DocumentCheckIssue = {
  level: 2 | 3;
  title: string;
  suggestion: string;
};

type DocumentCheckInput = {
  mode: "standard" | "lite";
  files: Map<string, string>;
};

type DocumentCheckResult = {
  pass: boolean;
  issues: DocumentCheckIssue[];
};

export async function checkDocuments(input: DocumentCheckInput): Promise<DocumentCheckResult> {
  const requiredDocuments = requiredDocumentsByMode[input.mode];
  const issues: DocumentCheckIssue[] = [];

  for (const document of requiredDocuments) {
    if (!input.files.has(document)) {
      issues.push({
        level: 3,
        title: `Missing document: ${document}`,
        suggestion: `补充 ${document} 后再执行 review。`,
      });
      continue;
    }

    const content = input.files.get(document) ?? "";
    const requiredSections = documentSectionRules[document] ?? [];

    for (const section of requiredSections) {
      if (!content.includes(section)) {
        issues.push({
          level: 2,
          title: `Missing section: ${document} -> ${section}`,
          suggestion: `在 ${document} 中补充 ${section}。`,
        });
      }
    }
  }

  return {
    pass: !issues.some((issue) => issue.level === 3),
    issues,
  };
}
