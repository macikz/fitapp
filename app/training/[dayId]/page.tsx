"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyTrainingDayPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/training"); }, [router]);
  return null;
}
