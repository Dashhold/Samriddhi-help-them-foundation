import { ChangeEvent, useState } from "react"
import { uploadCmsAsset } from "../../cms/storage"
import { Icon } from "../../components/ui"
import { resolvePublicAsset } from "../../lib/router"

type Props = {
  label: string
  value: string
  folder: string
  onChange: (url: string, file?: File) => void
  accept?: string
  document?: boolean
  required?: boolean
}

export default function AssetUpload({
  label,
  value,
  folder,
  onChange,
  accept = "image/png,image/jpeg,image/webp,image/gif",
  document = false,
  required = false,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const asset = await uploadCmsAsset(file, folder)
      onChange(asset.url, file)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      )
    } finally {
      setUploading(false)
    }
  }
  return (
    <div className="admin-field admin-asset-upload">
      <span>{label}</span>
      {value &&
        (document ? (
          <a
            className="admin-asset-file"
            href={resolvePublicAsset(value)}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="document" size={18} />
            Open current file <Icon name="external" size={14} />
          </a>
        ) : (
          <div className="admin-preview-image">
            <img src={resolvePublicAsset(value)} alt={`${label} preview`} />
          </div>
        ))}
      <label
        className={`admin-upload-button ${uploading ? "is-uploading" : ""}`}
      >
        <Icon name="upload" size={16} />
        <span>
          {uploading ? "Uploading…" : value ? "Replace file" : "Choose file"}
        </span>
        <input
          type="file"
          accept={accept}
          required={required && !value}
          disabled={uploading}
          onChange={upload}
        />
      </label>
      {value && (
        <button
          className="admin-remove-asset"
          type="button"
          onClick={() => onChange("")}
        >
          <Icon name="trash" size={14} />
          Remove from content
        </button>
      )}
      {error && <small className="admin-field-error">{error}</small>}
      <small>Stored durably by the protected API. Maximum 10 MB.</small>
    </div>
  )
}
