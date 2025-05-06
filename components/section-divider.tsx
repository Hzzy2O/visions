"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export default function SectionDivider() {
  const dividerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dividerRef.current) return

    const divider = dividerRef.current
    const lines = divider.querySelectorAll(".divider-line")

    // Create animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: divider,
        start: "top bottom-=100",
        end: "bottom center",
        toggleActions: "play none none reverse",
      },
    })

    tl.fromTo(
      lines,
      {
        width: 0,
      },
      {
        width: "100%",
        duration: 1.5,
        stagger: 0.2,
        ease: "power3.inOut",
      },
    )

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div ref={dividerRef} className="my-16 flex flex-col items-center justify-center gap-2">
      <div className="divider-line h-0.5 w-full max-w-xs bg-blue opacity-30"></div>
      <div className="divider-line h-0.5 w-full max-w-md bg-blue opacity-60"></div>
      <div className="divider-line h-0.5 w-full max-w-xs bg-blue opacity-30"></div>
    </div>
  )
}
