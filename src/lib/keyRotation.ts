/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility for rotating through multiple Gemini API keys to handle rate limits.
 */
class KeyRotator {
  private keys: string[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys() {
    // Collect all GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
    const keysFromEnv: string[] = [];
    
    // Add the primary key first
    if (process.env.GEMINI_API_KEY) {
      keysFromEnv.push(process.env.GEMINI_API_KEY);
    }

    // Look for additional numbered keys
    // Checking up to 10 keys for now
    for (let i = 1; i <= 10; i++) {
      const key = (process.env as any)[`GEMINI_API_KEY_${i}`];
      if (key && !keysFromEnv.includes(key)) {
        keysFromEnv.push(key);
      }
    }

    this.keys = keysFromEnv;
    console.log(`[Neural Key Management] Initialized with ${this.keys.length} active neural nodes.`);
  }

  /**
   * Returns the next API key in the rotation.
   */
  public getNextKey(): string {
    if (this.keys.length === 0) {
      console.warn("[Neural Warning] No API keys detected in environment.");
      return "";
    }

    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  /**
   * Returns all available keys.
   */
  public getAllKeys(): string[] {
    return [...this.keys];
  }

  /**
   * Check if any keys are available.
   */
  public hasKeys(): boolean {
    return this.keys.length > 0;
  }
}

export const neuralKeyManager = new KeyRotator();
