// Types for tracking individual translation changes

export interface TrackedChange {
  id: string; // unique identifier: `${section}-${key}`
  section: string;
  key: string;
  originalValue: string;
  newValue: string;
  timestamp: number;
  submitted: boolean;
  submittedAt?: number;
  prNumber?: string; // GitHub PR number if submitted
}

export interface ChangeSet {
  id: string;
  name: string;
  description?: string;
  changes: TrackedChange[];
  createdAt: number;
  submittedAt?: number;
  status: 'draft' | 'submitted' | 'merged';
  githubPrUrl?: string;
  githubIssueUrl?: string;
}

export interface SubmissionOptions {
  type: 'github-issue' | 'download-patch' | 'copy-clipboard' | 'download-full';
  includeContext?: boolean; // Include surrounding lines for context
  format?: 'diff' | 'json' | 'ini-snippet';
  targetBranch?: string;
  commitMessage?: string;
  prTitle?: string;
  prDescription?: string;
}

export interface SubmissionHistory {
  submissions: ChangeSet[];
  lastSubmissionAt?: number;
  totalChangesSubmitted: number;
}
