/**
 * Connection Detection Utility
 *
 * Monitors online/offline status using navigator.onLine and connection events
 * Provides reactive connection status for sync operations
 */

export type ConnectionStatus = 'online' | 'offline';

export interface ConnectionState {
  isOnline: boolean;
  status: ConnectionStatus;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

type ConnectionListener = (state: ConnectionState) => void;

class ConnectionMonitor {
  private state: ConnectionState;
  private listeners: Set<ConnectionListener> = new Set();

  constructor() {
    this.state = {
      isOnline: navigator.onLine,
      status: navigator.onLine ? 'online' : 'offline',
      lastOnline: navigator.onLine ? new Date() : null,
      lastOffline: navigator.onLine ? null : new Date(),
    };

    // Listen for connection changes
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.state = {
      isOnline: true,
      status: 'online',
      lastOnline: new Date(),
      lastOffline: this.state.lastOffline,
    };
    this.notifyListeners();
  };

  private handleOffline = () => {
    this.state = {
      isOnline: false,
      status: 'offline',
      lastOnline: this.state.lastOnline,
      lastOffline: new Date(),
    };
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    return this.state.isOnline;
  }

  /**
   * Subscribe to connection changes
   * Returns unsubscribe function
   */
  public subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.state);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Wait for online status
   * Resolves immediately if already online
   */
  public async waitForOnline(): Promise<void> {
    if (this.isOnline()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const unsubscribe = this.subscribe((state) => {
        if (state.isOnline) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Clean up event listeners
   */
  public destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
  }
}

// Singleton instance
export const connectionMonitor = new ConnectionMonitor();
