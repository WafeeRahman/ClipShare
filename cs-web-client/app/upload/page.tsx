"use client";
import { uploadVideo, getMyNamespaces, Namespace } from "../firebase/functions";
import styles from "./upload.module.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [key, setKey] = useState("");
  const [namespace, setNamespace] = useState("");
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyNamespaces().then(setNamespaces).catch(() => {}),
      new Promise((r) => setTimeout(r, 1500)),
    ]).then(() => setPageLoading(false));
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.item(0);
    if (selectedFile) setFile(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    try {
      setLoading(true);
      const result = await uploadVideo(
        file,
        title,
        description,
        key,
        namespace || undefined
      );
      setShareId(result.shareId || null);
      setUploadComplete(true);
    } catch (error) {
      alert(`Failed to upload file: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.circle}></div>
        <img src="/ClipShare.svg" alt="Logo" className={styles.logo} />
      </div>
    );
  }

  if (uploadComplete) {
    return (
      <div className={styles.uploadContainer}>
        <h1 className={styles.successMessage}>Upload Complete!</h1>
        <p>Your video has been uploaded successfully.</p>
        {shareId && (
          <p style={{ marginTop: 8, wordBreak: "break-all" }}>
            Share link:{" "}
            <strong>
              {typeof window !== "undefined"
                ? `${window.location.origin}/clip/${shareId}`
                : `/clip/${shareId}`}
            </strong>
          </p>
        )}
        <Link href="/">
          <button className={styles.submitBtn}>Back to Home</button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.uploadContainer}>
      <h1 className={styles.formTitle}>Upload A Video!</h1>
      <form className={styles.uploadForm} onSubmit={handleUpload}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="key">Topic</label>
          <input
            id="key"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
        </div>
        {namespaces.length > 0 && (
          <div className={styles.formGroup}>
            <label htmlFor="namespace">Library (optional)</label>
            <select
              id="namespace"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
            >
              <option value="">None (public)</option>
              {namespaces.map((ns) => (
                <option key={ns.id} value={ns.id}>
                  {ns.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={styles.formGroup}>
          <label htmlFor="file">Video File</label>
          <input
            id="file"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required
          />
        </div>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
