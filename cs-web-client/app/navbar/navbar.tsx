'use client'
import styles from "./navbar.module.css";
import Image from "next/image";
import Link from "next/link";
import SignIn from "./sign-in";
import { onAuthStateChangeHelper } from "../firebase/firebase";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChangeHelper((user) => {
            setUser(user);
        });
        return () => unsubscribe(); // Clean up subscription
    }, []);

    return (
        <nav className={styles.nav}>
            {/* Logo */}
            <Link href="/" className={styles.logoContainer}>
                <Image
                    src="/ClipShare.svg"
                    alt="ClipShare Logo"
                    width={150}
                    height={50}
                    priority
                />
            </Link>

            {/* Centered Upload Link */}
            <div className={styles.navLinks}>
                {user && <Link href="/upload">Upload Video</Link>}
            </div>

            {/* Sign In Button */}
            <div className={styles.signInContainer}>
                <SignIn user={user} />
            </div>
        </nav>
    );
}
