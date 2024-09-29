'use client'
import styles from "./navbar.module.css";
import Image from "next/image";
import Link from "next/link";
import SignIn from "./sign-in";
import { onAuthStateChangeHelper } from "../firebase/firebase";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import Upload from "./upload";
export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
      
        const unsubscribe =  onAuthStateChangeHelper((user) => {
            setUser(user);
        });
        
        return () => unsubscribe(); //Execute Unsub functrio
    });
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
            {
                user && <Upload/>
            }
   
            <SignIn user={user}/>
        </nav>
    );
}