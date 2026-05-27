"use client";

import * as React from "react"
import { motion, Variants } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  duration?: number
  delay?: number
  replay?: boolean
  className?: string
  textClassName?: string
  underlineClassName?: string
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
  underlineGradient?: string
  underlineHeight?: string
  underlineOffset?: string
}

const AnimatedText = React.forwardRef<HTMLDivElement, AnimatedTextProps>(
  ({
    text,
    duration = 0.5,
    delay = 0.1,
    replay = true,
    className,
    textClassName,
    underlineClassName,
    as: Component = "h1",
    underlineGradient = "from-blue-500 via-purple-500 to-pink-500",
    underlineHeight = "h-1",
    underlineOffset = "-bottom-2",
    style,
    ...props
  }, ref) => {
    const letters = Array.from(text)
    const words = text.split(" ")

    const container: Variants = {
      hidden: { 
        opacity: 0 
      },
      visible: (i: number = 1) => ({
        opacity: 1,
        transition: { 
          staggerChildren: duration, 
          delayChildren: i * delay 
        }
      })
    }

    const child: Variants = {
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          damping: 12,
          stiffness: 200
        }
      },
      hidden: {
        opacity: 0,
        y: 20,
        transition: {
          type: "spring",
          damping: 12,
          stiffness: 200
        }
      }
    }

    const lineVariants: Variants = {
      hidden: {
        width: "0%",
        left: "50%"
      },
      visible: {
        width: "100%",
        left: "0%",
        transition: {
          delay: letters.length * delay,
          duration: 0.8,
          ease: "easeOut"
        }
      }
    }

    // Dynamic motion component tag mapping
    const MotionComponent = React.useMemo(() => motion(Component), [Component]);

    // Track letter index for animation delays across word blocks
    let letterIndex = 0;

    return (
      <div 
        ref={ref} 
        className={cn("flex flex-col items-center justify-center gap-2", className)}
        style={style}
        {...props}
      >
        <div className="relative">
          <MotionComponent
            variants={container}
            initial="hidden"
            animate={replay ? "visible" : "hidden"}
            className={cn("flex flex-wrap justify-center text-center", textClassName)}
            style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              justifyContent: "center",
              overflow: "visible"
            }}
          >
            {words.map((word, wordIdx) => {
              const wordLetters = Array.from(word)
              return (
                <span 
                  key={wordIdx} 
                  className="inline-flex whitespace-nowrap" 
                  style={{ display: "inline-flex", whiteSpace: "nowrap" }}
                >
                  {wordLetters.map((letter) => {
                    const currentIdx = letterIndex++;
                    return (
                      <motion.span 
                        key={currentIdx} 
                        variants={child}
                        style={{ display: "inline-block", flexShrink: 0 }}
                      >
                        {letter}
                      </motion.span>
                    )
                  })}
                  {/* Render space after words, but not the last word */}
                  {wordIdx < words.length - 1 && (
                    <motion.span 
                      key={`space-${wordIdx}`} 
                      variants={child}
                      style={{ display: "inline-block", flexShrink: 0 }}
                    >
                      {"\u00A0"}
                    </motion.span>
                  )}
                </span>
              )
            })}
          </MotionComponent>

          {underlineHeight && underlineHeight !== "h-0" && underlineHeight !== "none" && (
            <motion.div
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                "absolute",
                underlineHeight,
                underlineOffset,
                "bg-gradient-to-r",
                underlineGradient,
                underlineClassName
              )}
            />
          )}
        </div>
      </div>
    )
  }
)
AnimatedText.displayName = "AnimatedText"

export { AnimatedText }
