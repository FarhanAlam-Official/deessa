/**
 * Payment provider error classes
 * These are exported from a non-"use server" file so they can be used
 * in both server and client code if needed.
 */

export class KhaltiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorKey?: string,
  ) {
    super(message)
    this.name = "KhaltiError"
  }
}

export class EsewaError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message)
    this.name = "EsewaError"
  }
}

