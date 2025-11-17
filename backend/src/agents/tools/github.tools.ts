import { Octokit } from '@octokit/rest';
import { ToolExecutionContext, ToolResult } from './types';

export class GitHubTools {
  private static getOctokit(context: ToolExecutionContext): Octokit {
    const token = context.secrets.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN not available in context');
    }
    return new Octokit({ auth: token });
  }

  static async createRepo(params: any, context: ToolExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    try {
      const octokit = GitHubTools.getOctokit(context);
      const { name, description, private: isPrivate = true } = params;

      const result = await octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: true,
      });

      return {
        success: true,
        data: {
          name: result.data.name,
          fullName: result.data.full_name,
          url: result.data.html_url,
          cloneUrl: result.data.clone_url,
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    }
  }

  static async createBranch(params: any, context: ToolExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    try {
      const octokit = GitHubTools.getOctokit(context);
      const { owner, repo, branch, from = 'main' } = params;

      // Get ref of source branch
      const sourceRef = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${from}`,
      });

      // Create new branch
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: sourceRef.data.object.sha,
      });

      return {
        success: true,
        data: { branch, from, sha: sourceRef.data.object.sha },
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    }
  }

  static async commitFiles(params: any, context: ToolExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    try {
      const octokit = GitHubTools.getOctokit(context);
      const { owner, repo, branch, message, files } = params;

      // Get current commit SHA
      const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const currentCommitSha = refData.object.sha;

      // Get current commit to get tree
      const { data: commitData } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: currentCommitSha,
      });

      // Create blobs for files
      const blobs = await Promise.all(
        files.map(async (file: any) => {
          const { data: blob } = await octokit.git.createBlob({
            owner,
            repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          return { path: file.path, sha: blob.sha, mode: '100644', type: 'blob' };
        })
      );

      // Create tree
      const { data: tree } = await octokit.git.createTree({
        owner,
        repo,
        base_tree: commitData.tree.sha,
        tree: blobs as any,
      });

      // Create commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner,
        repo,
        message,
        tree: tree.sha,
        parents: [currentCommitSha],
      });

      // Update ref
      await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

      return {
        success: true,
        data: { sha: newCommit.sha, message, filesCount: files.length },
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    }
  }

  static async createPullRequest(params: any, context: ToolExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    try {
      const octokit = GitHubTools.getOctokit(context);
      const { owner, repo, title, head, base, body } = params;

      const { data: pr } = await octokit.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body,
      });

      return {
        success: true,
        data: {
          number: pr.number,
          url: pr.html_url,
          state: pr.state,
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    }
  }
}
