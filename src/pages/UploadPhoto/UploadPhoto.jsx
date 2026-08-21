import React, { useState, useRef } from "react";
import "./UploadPhoto.css";

export default function UploadPhoto({ isOpen, onClose, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmUpload = () => {
    if (previewUrl && onUploadSuccess) {
      onUploadSuccess(previewUrl, selectedFile);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <div className="upload-modal-overlay" onClick={handleClose}>
      <div className="upload-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="upload-modal-header">
          <div>
            <h2 className="upload-modal-title">Upload Photo</h2>
            <p className="upload-modal-subtitle">
              Add a clear image of the hazard to help us locate and assess it.
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

        {/* Dropzone Area */}
        <div
          className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!previewUrl ? (
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
                Drag and drop your photo here
              </span>
              <span className="dropzone-text-or">or</span>

              <button
                type="button"
                className="btn-browse-files"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </button>

              <span className="dropzone-hint">JPG, PNG or GIF (max. 10MB)</span>
            </>
          ) : (
            <div className="preview-container">
              <img src={previewUrl} alt="Hazard Preview" className="preview-image" />
              <button
                type="button"
                className="btn-change-photo"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden-file-input"
            accept="image/*"
            onChange={handleInputChange}
          />
        </div>

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
            className={`btn-upload-submit ${!previewUrl ? "disabled" : ""}`}
            onClick={handleConfirmUpload}
            disabled={!previewUrl}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}