"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getVideos, checkWhitelist, requestWhitelistAccess, Video } from "./firebase/functions";
import { onAuthStateChangeHelper } from "./firebase/firebase";
import { User } from "firebase/auth";
import styles from "./page.module.css";
import Search from "./search/search";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessRequested, setAccessRequested] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChangeHelper((u) => {
      setUser(u);
      if (!u) {
        setAllowed(null);
        setVideos([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    checkWhitelist()
      .then((ok) => {
        setAllowed(ok);
        if (ok) return getVideos();
        return [];
      })
      .then((v) => setVideos(v || []))
      .catch(() => setAllowed(false))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.center}>
          <div className={styles.spinner} />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>ClipShare</h1>
        <p className={styles.subtitle}>
          Sign in with Google to access the library.
        </p>
      </main>
    );
  }

  const handleRequestAccess = async () => {
    setRequestingAccess(true);
    try {
      await requestWhitelistAccess();
      setAccessRequested(true);
    } catch {
      setAccessRequested(false);
    } finally {
      setRequestingAccess(false);
    }
  };

  if (allowed === false) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>Access Denied</h1>
        <p className={styles.subtitle}>
          Your account ({user.email}) is not on the whitelist.
          <br />
          Ask an admin to add you.
        </p>
        {accessRequested ? (
          <p className={styles.subtitle}>
            Access requested! An admin will review your request.
          </p>
        ) : (
          <button
            onClick={handleRequestAccess}
            disabled={requestingAccess}
            style={{
              marginTop: "16px",
              padding: "12px 32px",
              borderRadius: "8px",
              border: "none",
              background: "#000",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: requestingAccess ? "not-allowed" : "pointer",
              opacity: requestingAccess ? 0.6 : 1,
            }}
          >
            {requestingAccess ? "Requesting..." : "Request Access"}
          </button>
        )}
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <Search />
      <h1 className={styles.title}>Recent Uploads</h1>
      <div>
        <h5>
          Welcome to ClipShare Library! Upload your gaming clips, twitch clips,
          and more!
        </h5>
      </div>
      <div className={styles.videoGrid}>
        {videos.map((video) => {
          if (!video.filename || !video.title) return null;
          return (
            <Link
              href={`/watch?v=${video.filename}&title=${encodeURIComponent(
                video.title || ""
              )}&description=${encodeURIComponent(
                video.description || ""
              )}&key=${encodeURIComponent(
                video.key || ""
              )}&shareId=${encodeURIComponent(video.shareId || "")}`}
              key={video.filename}
              className={styles.videoLink}
            >
              <div className={styles.videoItem}>
                <img
                  src={video.thumbnailUrl || "/thumbnail.png"}
                  alt="video thumbnail"
                  width={240}
                  height={160}
                  className={styles.thumbnail}
                />
                <h2 className={styles.videoTitle}>{video.title}</h2>
                <p className={styles.videoKey}>
                  <em>{video.key}</em>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
