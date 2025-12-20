"use client"

import GenericErrorPage from "@/components/error-pages/GenericErrorPage"

export default function GenericErrorDemo() {
  const mockError = new Error("This is a demo error to showcase the GenericErrorPage component")
  
  // Adding a digest to simulate Next.js error boundary
  const errorWithDigest = Object.assign(mockError, { 
    digest: "demo-error-digest-123456" 
  })
  
  const handleReset = () => {
    window.location.href = "/demo/errors"
  }

  return (
    <GenericErrorPage 
      error={errorWithDigest}
      reset={handleReset}
      errorTitle="Something went wrong"
      errorMessage="This is a demonstration of the Generic Error Page. In a real scenario, this would catch unexpected runtime errors in your application."
    />
  )
}
