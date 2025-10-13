'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient, FileUpload } from '@/lib/api-client';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Upload, File, X, Download, Eye, Trash2, FileText, Image, FileCode, FileArchive } from 'lucide-react';

interface FileUploadInterfaceProps {
  projectId?: string;
  className?: string;
  onFileSelect?: (file: FileUpload) => void;
}

export default function FileUploadInterface({ projectId, className = '', onFileSelect }: FileUploadInterfaceProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { on } = useWebSocket();

  // Load existing files
  useEffect(() => {
    loadFiles();
  }, [projectId]);

  // WebSocket file upload progress
  useEffect(() => {
    const handleUploadProgress = (data: any) => {
      if (data.type === 'file:upload:progress') {
        // Update upload progress UI
        console.log('Upload progress:', data.progress);
      }
    };

    on('file:upload:progress', handleUploadProgress);
  }, [on]);

  const loadFiles = async () => {
    try {
      const filesData = await apiClient.getFiles(projectId);
      setFiles(filesData);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    if (uploading) return;

    setUploading(true);
    const uploadedFiles: FileUpload[] = [];

    for (const file of files) {
      try {
        const uploadedFile = await apiClient.uploadFile(file, projectId);
        uploadedFiles.push(uploadedFile);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    setFiles(prev => [...uploadedFiles, ...prev]);
    setUploading(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await apiClient.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const downloadFile = (file: FileUpload) => {
    window.open(file.url, '_blank');
  };

  const viewFile = (file: FileUpload) => {
    if (file.mimetype.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      window.open(file.url, '_blank');
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <Image className="w-8 h-8 text-blue-400" />;
    if (mimetype.includes('pdf')) return <FileText className="w-8 h-8 text-red-400" />;
    if (mimetype.includes('zip') || mimetype.includes('rar')) return <FileArchive className="w-8 h-8 text-yellow-400" />;
    if (mimetype.includes('text') || mimetype.includes('json') || mimetype.includes('xml')) return <FileCode className="w-8 h-8 text-green-400" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`chrome-surface rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Upload className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">File Manager</h3>
            <p className="text-sm text-gray-400">{files.length} files</p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Upload Area */}
      <div
        className={`p-8 border-2 border-dashed transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Drag and drop files here, or click to select</p>
          <p className="text-sm text-gray-500">Supports all file types up to 100MB</p>
        </div>
      </div>

      {/* Files Grid */}
      <div className="p-4">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No files uploaded yet</p>
            <p className="text-sm mt-2">Upload your first file to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="chrome-surface rounded-lg p-4 hover:border-blue-500/50 transition-all cursor-pointer"
                onClick={() => onFileSelect?.(file)}
              >
                <div className="flex items-start gap-3">
                  {getFileIcon(file.mimetype)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{file.originalName}</h4>
                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewFile(file);
                      }}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                      }}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-surface rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">{selectedFile.originalName}</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {selectedFile.mimetype.startsWith('image/') ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.originalName}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Preview not available for this file type</p>
                  <button
                    onClick={() => downloadFile(selectedFile)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}