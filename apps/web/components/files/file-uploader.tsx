'use client';

import { useState } from 'react';
import { UploadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileUploaderProps {
  label?: string;
  onUploaded?: (fileUrl: string) => void;
  getPresignedUrl: (payload: { fileName: string; fileType: string }) => Promise<string>;
}

export const FileUploader = ({ label, onUploaded, getPresignedUrl }: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadUrl = await getPresignedUrl({
        fileName: selectedFile.name,
        fileType: selectedFile.type
      });

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const fileUrl = uploadUrl.split('?')[0];
      onUploaded?.(fileUrl);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2">
          <UploadIcon className="h-4 w-4 text-muted-foreground" />
          <span>{label ?? 'Upload supporting files or recordings (PDF, audio, video).'}</span>
        </div>
        <Input type="file" onChange={handleFileChange} />
        <div className="flex items-center gap-2">
          <Button onClick={handleUpload} disabled={uploading} className="gap-2">
            {uploading ? 'Uploading…' : 'Upload to S3'}
          </Button>
          {selectedFile ? <span className="text-xs text-muted-foreground">{selectedFile.name}</span> : null}
        </div>
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    </div>
  );
};

