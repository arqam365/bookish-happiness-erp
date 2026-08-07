'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import api from '@/lib/api'

interface ImageUploadProps {
  label: string
  value?: string
  onChange: (url: string) => void
  accept?: string
  folder?: string
}

export function ImageUpload({ label, value, onChange, accept = 'image/*', folder = 'uploads' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const { data } = await api.get<{ uploadUrl: string; publicUrl: string }>('/upload/presign', {
        params: { filename: file.name, contentType: file.type, folder },
      })
      await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      onChange(data.publicUrl)
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>

      {value ? (
        <div className="relative w-full">
          <img
            src={value}
            alt={label}
            className="h-32 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-0.5 shadow hover:bg-red-50"
          >
            <X className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition hover:border-[#4F46E5] hover:bg-indigo-50 hover:text-[#4F46E5] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#4F46E5] dark:hover:bg-indigo-950"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="text-xs">{uploading ? 'Uploading…' : 'Click to upload'}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
