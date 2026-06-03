"use client"

import { FC } from "react"

interface Props {
  text: string
  className?: string
  [key: string]: any
}

const TextAnimate: FC<Props> = ({ text, className, type, delay, duration, ...props }: Props) => {
  return (
    <span className={className} {...props}>
      {text}
    </span>
  )
}

export { TextAnimate }
export default TextAnimate
