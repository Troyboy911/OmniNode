/**
 * File Management Routes
 * Upload, download, and manage files using R2
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { APIError } from '../middleware/error';
import type { AuthUser } from '../middleware/auth';

const files = new Hono<{ Bindings: Env }>();

// Upload file
files.post('/upload', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new APIError(400, 'No file provided', 'NO_FILE');
    }

    // Generate unique file key
    const timestamp = Date.now();
    const fileKey = `${user.id}/${timestamp}-${file.name}`;

    // Upload to R2
    await c.env.FILES.put(fileKey, file.stream(), {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        userId: user.id,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    return c.json({
      success: true,
      data: {
        key: fileKey,
        name: file.name,
        size: file.size,
        type: file.type,
        url: `/api/files/${fileKey}`
      }
    }, 201);
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(500, 'File upload failed', 'UPLOAD_ERROR');
  }
});

// Download file
files.get('/:key{.+}', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const fileKey = c.req.param('key');

    // Check if file belongs to user
    if (!fileKey.startsWith(user.id + '/')) {
      throw new APIError(403, 'Access denied', 'ACCESS_DENIED');
    }

    const object = await c.env.FILES.get(fileKey);

    if (!object) {
      throw new APIError(404, 'File not found', 'FILE_NOT_FOUND');
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, {
      headers
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(500, 'File download failed', 'DOWNLOAD_ERROR');
  }
});

// List user files
files.get('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const prefix = `${user.id}/`;

    const listed = await c.env.FILES.list({
      prefix,
      limit: 100
    });

    const fileList = listed.objects.map(obj => ({
      key: obj.key,
      name: obj.key.split('/').pop(),
      size: obj.size,
      uploaded: obj.uploaded,
      url: `/api/files/${obj.key}`
    }));

    return c.json({
      success: true,
      data: fileList
    });
  } catch (error) {
    throw new APIError(500, 'Failed to list files', 'LIST_ERROR');
  }
});

// Delete file
files.delete('/:key{.+}', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const fileKey = c.req.param('key');

    // Check if file belongs to user
    if (!fileKey.startsWith(user.id + '/')) {
      throw new APIError(403, 'Access denied', 'ACCESS_DENIED');
    }

    await c.env.FILES.delete(fileKey);

    return c.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(500, 'File deletion failed', 'DELETE_ERROR');
  }
});

// Get file metadata
files.head('/:key{.+}', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const fileKey = c.req.param('key');

    // Check if file belongs to user
    if (!fileKey.startsWith(user.id + '/')) {
      throw new APIError(403, 'Access denied', 'ACCESS_DENIED');
    }

    const object = await c.env.FILES.head(fileKey);

    if (!object) {
      throw new APIError(404, 'File not found', 'FILE_NOT_FOUND');
    }

    return c.json({
      success: true,
      data: {
        key: object.key,
        size: object.size,
        uploaded: object.uploaded,
        httpMetadata: object.httpMetadata,
        customMetadata: object.customMetadata
      }
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(500, 'Failed to get file metadata', 'METADATA_ERROR');
  }
});

export default files;