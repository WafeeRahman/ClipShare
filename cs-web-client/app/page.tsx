
import Image from 'next/image';
import Link from 'next/link';
import { getVideos } from './firebase/functions';
import styles from './page.module.css';
import Search from './search/search';

export default async function Home() {
  const videos = await getVideos();
  console.log(videos);
  return (
    <main className={styles.container}>
      <Search />
      <h1 className={styles.title}>Recent Uploads</h1>
      <div>
        <h5>Welcome to ClipShare Library! Upload your gaming clips, twitch clips, and more!</h5>
      </div>
      <div className={styles.videoGrid}>
        {videos.map((video) => {
          if (!video.filename || !video.title) {
            return null; // Skip videos with missing essential fields
          }
          return (
            <Link
              href={`/watch?v=${video.filename}&title=${encodeURIComponent(video.title || '')}&description=${encodeURIComponent(video.description || '')}&key=${encodeURIComponent(video.key || '')}`}
              key={video.filename}
              className={styles.videoLink}
            >
              <div className={styles.videoItem}>
                <img
                  src={video.thumbnailUrl || '/thumbnail.png'}
                  alt='video thumbnail'
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
