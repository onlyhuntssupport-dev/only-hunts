"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import AuthModal from "@/components/auth/AuthModal";

interface GatedLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export default function GatedLink({ href, className, children }: GatedLinkProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setIsAuthenticated(!!user));
    return () => unsubscribe();
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  return (
    <>
      <Link href={href} onClick={handleClick} className={className}>
        {children}
      </Link>
      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
