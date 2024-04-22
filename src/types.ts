export interface MergeRequestNode {
  id: string;
  webUrl: string;
  title: string;
  conflicts: boolean;
  createdAt: string;
  updatedAt: string;
  approvalsLeft: number;
  userNotesCount: number;
  userDiscussionsCount: number;
  headPipeline: {
    status: string;
  };
  labels: {
    edges: {
      node: {
        id: string;
        color: string;
        title: string;
      };
    }[];
  };
  assignees: {
    edges: {
      node: {
        id: string;
        name: string;
        webUrl: string;
        avatarUrl: string;
      };
    }[];
  };
  commenters: {
    edges: {
      node: {
        id: string;
        name: string;
        webUrl: string;
        avatarUrl: string;
      };
    }[];
  };
  author: {
    id: string;
    name: string;
    username: string;
    webUrl: string;
    avatarUrl: string;
  };
  approvedBy: {
    edges: {
      node: {
        id: string;
        name: string;
        webUrl: string;
        avatarUrl: string;
      };
    }[];
  };
}

export interface ProjectData {
  project?: {
    mergeRequests: {
      nodes: MergeRequestNode[];
    };
  };
}