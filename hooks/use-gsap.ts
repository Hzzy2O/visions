"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function useGSAPAnimation() {
  const animationRef = useRef<gsap.Context | null>(null)

  useEffect(() => {
    // Create a GSAP context to keep animations organized
    animationRef.current = gsap.context(() => {})

    // Clean up animations when component unmounts
    return () => {
      if (animationRef.current) {
        animationRef.current.revert()
      }
    }
  }, [])

  return animationRef
}

export function useScrollAnimation(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    animation?: gsap.TweenVars
    scrollTrigger?: gsap.plugins.ScrollTriggerInstanceVars
    delay?: number
  } = {},
) {
  useEffect(() => {
    if (!elementRef.current) return

    const { animation = {}, scrollTrigger = {}, delay = 0 } = options

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: elementRef.current,
        start: "top bottom-=100",
        end: "bottom center",
        toggleActions: "play none none reverse",
        ...scrollTrigger,
      },
    })

    tl.fromTo(
      elementRef.current,
      {
        opacity: 0,
        y: 50,
        ...animation.fromVars,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        delay,
        ...animation.toVars,
      },
    )

    return () => {
      tl.kill()
    }
  }, [elementRef, options])
}

export function useStaggerAnimation(
  containerRef: React.RefObject<HTMLElement>,
  childSelector: string,
  options: {
    staggerAmount?: number
    animation?: gsap.TweenVars
    scrollTrigger?: gsap.plugins.ScrollTriggerInstanceVars
  } = {},
) {
  useEffect(() => {
    if (!containerRef.current) return

    const { staggerAmount = 0.1, animation = {}, scrollTrigger = {} } = options
    const children = containerRef.current.querySelectorAll(childSelector)

    if (children.length === 0) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom-=100",
        end: "bottom center",
        toggleActions: "play none none reverse",
        ...scrollTrigger,
      },
    })

    tl.fromTo(
      children,
      {
        opacity: 0,
        y: 50,
        ...animation.fromVars,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: staggerAmount,
        ease: "power3.out",
        ...animation.toVars,
      },
    )

    return () => {
      tl.kill()
    }
  }, [containerRef, childSelector, options])
}

export function useParallaxEffect(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    speed?: number
    direction?: "up" | "down" | "left" | "right"
    scrollTrigger?: gsap.plugins.ScrollTriggerInstanceVars
  } = {},
) {
  useEffect(() => {
    if (!elementRef.current) return

    const { speed = 0.5, direction = "up", scrollTrigger = {} } = options

    // Calculate movement based on direction
    const yMovement = direction === "up" ? -speed * 100 : direction === "down" ? speed * 100 : 0
    const xMovement = direction === "left" ? -speed * 100 : direction === "right" ? speed * 100 : 0

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: elementRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        ...scrollTrigger,
      },
    })

    tl.to(elementRef.current, {
      y: yMovement,
      x: xMovement,
      ease: "none",
    })

    return () => {
      tl.kill()
    }
  }, [elementRef, options])
}
