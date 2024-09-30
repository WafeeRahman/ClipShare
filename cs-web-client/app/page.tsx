import Image from 'next/image';
import Link from 'next/link';
import { getVideos } from './firebase/functions';
import styles from './page.module.css';

export default async function Home() {
  const videos = await getVideos();

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Recent Uploads</h1>
      <div className={styles.videoGrid}>
        {
          videos.map((video) => (
            <Link href={`/watch?v=${video.filename}`} key={video.filename}>
              <div className={styles.videoCard}>
                <Image
                  src={'/thumbnail.png'}
                  alt='video thumbnail'
                  width={240}
                  height={160}
                  className={styles.thumbnail}
                />
              </div>
            </Link>
          ))
        }
      </div>
    </main>
  );
}
