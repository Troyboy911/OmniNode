import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export interface FileOperation {
  success: boolean;
  path?: string;
  content?: string;
  error?: string;
  stats?: any;
}

export class FileSystemTools {
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
  }

  /**
   * Read file contents
   */
  async read(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<FileOperation> {
    try {
      const fullPath = path.resolve(this.basePath, filePath);
      const content = await fs.readFile(fullPath, encoding);
      return { success: true, path: fullPath, content };
    } catch (error: any) {
      return { success: false, path: filePath, error: error.message };
    }
  }

  /**
   * Write content to file
   */
  async write(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<FileOperation> {
    try {
      const fullPath = path.resolve(this.basePath, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, encoding);
      return { success: true, path: fullPath };
    } catch (error: any) {
      return { success: false, path: filePath, error: error.message };
    }
  }

  /**
   * Append content to file
   */
  async append(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<FileOperation> {
    try {
      const fullPath = path.resolve(this.basePath, filePath);
      await fs.appendFile(fullPath, content, encoding);
      return { success: true, path: fullPath };
    } catch (error: any) {
      return { success: false, path: filePath, error: error.message };
    }
  }

  /**
   * Delete file or directory
   */
  async delete(filePath: string, recursive: boolean = false): Promise<FileOperation> {
    try {
      const fullPath = path.resolve(this.basePath, filePath);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive, force: true });
      } else {
        await fs.unlink(fullPath);
      }
      
      return { success: true, path: fullPath };
    } catch (error: any) {
      return { success: false, path: filePath, error: error.message };
    }
  }

  /**
   * List directory contents
   */
  async list(dirPath: string, recursive: boolean = false): Promise<FileOperation> {
    try {
      const fullPath = path.resolve(this.basePath, dirPath);
      
      if (recursive) {
        const files = await glob('**/*', { cwd: fullPath, dot: true });
        return { success: true, path: fullPath, content: JSON.stringify(files, null, 2) };
      }
      
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const listing = files.map(f => ({
        name: f.name,
        type: f.isDirectory() ? 'directory' : 'file',
        isSymbolicLink: f.isSymbolicLink()
      }));
      
      return { success: true, path: fullPath, content: JSON.stringify(listing, null, 2) };
    } catch (error: any) {
      return { success: false, path: dirPath, error: error.message };
    }
  }

  /**
   * Create directory
   */
  async mkdir(dirPath: string, recursive: boolean = true): Promise<FileOperation> {
    try {
      const fullPath = path.resolve(this.basePath, dirPath);
      await fs.mkdir(fullPath, { recursive });
      return { success: true, path: fullPath };
    } catch (error: any) {
      return { success: false, path: dirPath, error: error.message };
    }
  }

  /**
   * Get file/directory stats
   */
  async stat(filePath: string): Promise<FileOperation> {
    try {
      const fullPath = path.resolve(this.basePath, filePath);
      const stats = await fs.stat(fullPath);
      
      return {
        success: true,
        path: fullPath,
        stats: {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          isSymbolicLink: stats.isSymbolicLink()
        }
      };
    } catch (error: any) {
      return { success: false, path: filePath, error: error.message };
    }
  }

  /**
   * Check if path exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.resolve(this.basePath, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Copy file or directory
   */
  async copy(src: string, dest: string, recursive: boolean = true): Promise<FileOperation> {
    try {
      const srcPath = path.resolve(this.basePath, src);
      const destPath = path.resolve(this.basePath, dest);
      
      await fs.cp(srcPath, destPath, { recursive, force: true });
      return { success: true, path: destPath };
    } catch (error: any) {
      return { success: false, path: src, error: error.message };
    }
  }

  /**
   * Move/rename file or directory
   */
  async move(src: string, dest: string): Promise<FileOperation> {
    try {
      const srcPath = path.resolve(this.basePath, src);
      const destPath = path.resolve(this.basePath, dest);
      
      await fs.rename(srcPath, destPath);
      return { success: true, path: destPath };
    } catch (error: any) {
      return { success: false, path: src, error: error.message };
    }
  }

  /**
   * Search files by pattern
   */
  async search(pattern: string, options: { cwd?: string; ignore?: string[] } = {}): Promise<FileOperation> {
    try {
      const searchPath = options.cwd ? path.resolve(this.basePath, options.cwd) : this.basePath;
      const files = await glob(pattern, {
        cwd: searchPath,
        ignore: options.ignore || ['node_modules/**', '.git/**'],
        dot: true
      });
      
      return { success: true, path: searchPath, content: JSON.stringify(files, null, 2) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const fsTools = new FileSystemTools();
