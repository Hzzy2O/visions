"use client"

import { useEffect, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Create ScrollTrigger for scroll progress
    const scrollTrigger = ScrollTrigger.create({
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setProgress(self.progress)
      },
    })

    return () => {
      scrollTrigger.kill()
    }
  }, [])

  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full bg-gray-200">
      <div
        className="h-full bg-blue transition-all duration-100 ease-out"
        style={{ width: `${progress * 100}%` }}
      ></div>
    </div>
  )
}
