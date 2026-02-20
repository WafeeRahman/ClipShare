"use client";
import styles from "./navbar.module.css";
import Image from "next/image";
import Link from "next/link";
import SignIn from "./sign-in";
import { onAuthStateChangeHelper } from "../firebase/firebase";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { checkWhitelist } from "../firebase/functions";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChangeHelper((u) => {
      setUser(u);
      if (u) {
        checkWhitelist().then(setAllowed).catch(() => setAllowed(false));
      } else {
        setAllowed(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logoContainer}>
        <Image
          src="/ClipShare.svg"
          alt="ClipShare Logo"
          width={150}
          height={50}
          priority
        />
      </Link>

      <div className={styles.navLinks}>
        {user && allowed && (
          <>
            <Link href="/upload">Upload</Link>
            <Link href="/libraries">Libraries</Link>
            <Link href="/clipbot">ClipBot</Link>
            <Link href="/admin">Admin</Link>
          </>
        )}
      </div>

      <div className={styles.signInContainer}>
        <SignIn user={user} />
      </div>
    </nav>
  );
}
