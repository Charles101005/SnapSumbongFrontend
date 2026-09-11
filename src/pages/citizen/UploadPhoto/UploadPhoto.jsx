import React, { useState, useRef, useEffect } from "react";
import "./UploadPhoto.css";

const MAX_PHOTOS = 5;

export default function UploadPhoto({ isOpen, onClose, onUploadSuccess, existingCount = 0 }) {
  const [items, setItems] = useState([]); // { file, previewUrl }[]
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Revoke any object URLs we created for this modal session once it closes
  // or unmounts, so we don't leak memory.
  useEffect(() => {
    if (!isOpen) {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const remainingSlots = Math.max(MAX_PHOTOS - existingCount - items.length, 0);

  const handleFilesSelected = (fileList) => {
    const incoming = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) return;

    if (remainingSlots <= 0) {
      setError(`You can only upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const accepted = incoming.slice(0, remainingSlots);
    if (incoming.length > remainingSlots) {
      setError(`Only ${MAX_PHOTOS} photos are allowed in total — the rest were skipped.`);
    } else {
      setError("");
    }

    // Each file gets its own, independent object URL — no shared state
    // between files, so each thumbnail is guaranteed to show its own image.
    const newItems = accepted.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleInputChange = (e) => {
    handleFilesSelected(e.target.files);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemove = (index) => {
    setItems((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    setError("");
  };

  const handleConfirmUpload = () => {
    if (items.length > 0 && onUploadSuccess) {
      onUploadSuccess(items);
    }
    // Ownership of the object URLs now belongs to the parent, so clear our
    // local list without revoking them.
    setItems([]);
    setIsDragging(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const handleClose = () => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
    setIsDragging(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const hasPhotos = items.length > 0;
  const canAddMore = remainingSlots > 0;

  return (
    <div className="upload-modal-overlay" onClick={handleClose}>
      <div className="upload-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="upload-modal-header">
          <div>
            <h2 className="upload-modal-title">Upload Photos</h2>
            <p className="upload-modal-subtitle">
              Add up to {MAX_PHOTOS} clear images of the hazard to help us locate and assess it.
            </p>
          </div>
          <button
            type="button"
            className="upload-modal-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Dropzone / Preview Area */}
        <div
          className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!hasPhotos ? (
            <>
              <div className="camera-icon-circle">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>

              <span className="dropzone-text-primary">
                Drag and drop your photos here
              </span>
              <span className="dropzone-text-or">or</span>

              <button
                type="button"
                className="btn-browse-files"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </button>

              <span className="dropzone-hint">
                JPG, PNG or GIF (max. 10MB) — up to {MAX_PHOTOS} photos
              </span>
            </>
          ) : (
            <div className="preview-grid">
              {items.map((item, index) => (
                <div className="preview-thumb" key={item.previewUrl}>
                  <img src={item.previewUrl} alt={`Hazard preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-thumb"
                    onClick={() => handleRemove(index)}
                    title="Remove photo"
                  >
                    &times;
                  </button>
                </div>
              ))}

              {canAddMore && (
                <button
                  type="button"
                  className="add-more-thumb"
                  onClick={() => fileInputRef.current?.click()}
                  title="Add another photo"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden-file-input"
            accept="image/*"
            multiple
            onChange={handleInputChange}
          />
        </div>

        {error && <p className="upload-error-text">{error}</p>}

        {/* Action Buttons */}
        <div className="upload-modal-footer">
          <button
            type="button"
            className="btn-upload-cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn-upload-submit ${!hasPhotos ? "disabled" : ""}`}
            onClick={handleConfirmUpload}
            disabled={!hasPhotos}
          >
            Add {hasPhotos ? `(${items.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
