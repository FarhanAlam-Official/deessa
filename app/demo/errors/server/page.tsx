"use client"

import ServerErrorPage from "@/components/error-pages/ServerErrorPage"

export default function ServerErrorDemo() {
  const mockError = new Error("Internal Server Error - This is a demo")
  
  // Adding a digest to simulate Next.js error boundary
  const errorWithDigest = Object.assign(mockError, { 
    digest: "server-error-digest-500" 
  })
  
  const handleReset = () => {
    window.location.href = "/demo/errors"
  }

  return (
    <ServerErrorPage 
      error={errorWithDigest}
      reset={handleReset}
    />
  )
}
