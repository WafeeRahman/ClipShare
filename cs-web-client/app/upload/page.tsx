'use client'
// app/upload/page.tsx


import { uploadVideo } from "../firebase/functions"; // Adjust the import path as necessary
import styles from "./upload.module.css"; // Update the path as necessary
import React, { useState } from "react";

export default function Upload() {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.item(0);
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (file) {
            try {
                setLoading(true);
                // Call the uploadVideo function with all necessary parameters
                const response = await uploadVideo(file, title, description, key);
                alert(`File uploaded successfully. Server responded with: ${JSON.stringify(response)}`);
            } catch (error) {
                alert(`Failed to upload file: ${error}`);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className={styles.uploadContainer}>
            <h1>Upload A Video!</h1>
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
                    <label htmlFor="key">Key</label>
                    <input
                        id="key"
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        required
                    />
                </div>
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
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload'}
                </button>
            </form>
        </div>
    );
}