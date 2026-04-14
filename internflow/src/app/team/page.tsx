"use client";

import Link from "next/link";
import { ArrowLeft, Crown, Code, Palette, Database, Zap, User } from "lucide-react";
import styles from "./team.module.css";

const TEAM_MEMBERS = [
  {
    name: "Subhaharini S",
    role: "Full-Stack Developer",
    icon: <Code size={16} />,
  },
  {
    name: "Keerthika D",
    role: "UI/UX Designer",
    icon: <Palette size={16} />,
  },
  {
    name: "Akilan K",
    role: "Backend Architecture",
    icon: <Database size={16} />,
  },
  {
    name: "Harish Rohith S",
    role: "Product Lead",
    icon: <Zap size={16} />,
  },
];

export default function TeamMonarchsPage() {
  return (
    <div className={styles.page}>
      {/* Animated Background Abstract Shapes */}
      <div className={styles.bgAbstracts}>
        <div className={styles.abstractCircle1}></div>
        <div className={styles.abstractCircle2}></div>
        <div className={styles.abstractCircle3}></div>
      </div>

      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={18} />
          Back to Portal
        </Link>
        <div className={styles.titleWrapper}>
          <Crown size={48} className={styles.logoCrown} />
          <h1 className={styles.title}>Team Monarchs</h1>
        </div>
        <p className={styles.subtitle}>
          The creative minds and engineers behind the InternFlow platform. 
          Dedicated to building elegant, efficient solutions.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          {TEAM_MEMBERS.map((member, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.avatar}>
                <User size={48} />
              </div>
              
              <h3 className={styles.name}>{member.name}</h3>
              <div className={styles.role}>
                {member.icon}
                {member.role}
              </div>
              
              <div className={styles.socials}>
                <a href="#" className={styles.socialBtn} title="GitHub Profile">
                  <Code size={20} />
                </a>
                <a href="#" className={styles.socialBtn} title="LinkedIn Profile">
                  <User size={20} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Team Monarchs. Designed for Rathinam College.</p>
      </footer>
    </div>
  );
}
