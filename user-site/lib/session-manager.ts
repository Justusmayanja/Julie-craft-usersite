import type { UserSession, User } from './types/user'

class SessionManager {
  private sessionId: string | null = null
  private user: User | null = null
  private isGuest: boolean = true

  constructor() {
    this.initializeSession()
  }

  private initializeSession() {
    // Try to get existing session from localStorage
    const existingSession = this.getStoredSession()
    if (existingSession) {
      this.sessionId = existingSession.session_id
      this.user = existingSession.user_id ? existingSession : null
      this.isGuest = !existingSession.user_id
    } else {
      // Create new guest session
      this.createGuestSession()
    }
  }

  private createGuestSession(): void {
    const sessionId = this.generateSessionId()
    this.sessionId = sessionId
    this.isGuest = true
    this.user = null

    const session: UserSession = {
      session_id: sessionId,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      device_info: {
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      }
    }

    this.storeSession(session)
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getStoredSession(): UserSession | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem('julie-crafts-session')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error reading session from localStorage:', error)
      return null
    }
  }

  private storeSession(session: UserSession): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('julie-crafts-session', JSON.stringify(session))
    } catch (error) {
      console.error('Error storing session to localStorage:', error)
    }
  }

  // Public methods
  getSessionId(): string | null {
    return this.sessionId
  }

  getCurrentUser(): User | null {
    return this.user
  }

  isGuestUser(): boolean {
    return this.isGuest
  }

  updateActivity(): void {
    if (!this.sessionId) return

    const session = this.getStoredSession()
    if (session) {
      session.last_activity = new Date().toISOString()
      this.storeSession(session)
    }
  }

  // Convert guest to registered user
  convertToRegisteredUser(user: User): void {
    const session = this.getStoredSession()
    if (session && this.sessionId) {
      session.user_id = user.id
      session.email = user.email
      this.user = user
      this.isGuest = false
      this.storeSession(session)
    }
  }

  // Get user-specific cart key
  getCartKey(): string {
    if (this.user) {
      return `julie-crafts-cart-user-${this.user.id}`
    } else if (this.sessionId) {
      return `julie-crafts-cart-session-${this.sessionId}`
    }
    return 'julie-crafts-cart'
  }

  // Get user-specific orders key
  getOrdersKey(): string {
    if (this.user) {
      return `julie-crafts-orders-user-${this.user.id}`
    } else if (this.sessionId) {
      return `julie-crafts-orders-session-${this.sessionId}`
    }
    return 'julie-crafts-orders'
  }

  // Clear session (logout)
  clearSession(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('julie-crafts-session')
    this.sessionId = null
    this.user = null
    this.isGuest = true
  }

  // Check if session is still valid (not expired)
  isSessionValid(): boolean {
    const session = this.getStoredSession()
    if (!session) return false

    const lastActivity = new Date(session.last_activity)
    const now = new Date()
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)

    // Session expires after 7 days of inactivity
    return hoursSinceActivity < 168 // 7 days
  }

  // Get session info for API calls
  getSessionInfo() {
    return {
      session_id: this.sessionId,
      user_id: this.user?.id,
      email: this.user?.email,
      is_guest: this.isGuest
    }
  }
}

// Create singleton instance
export const sessionManager = new SessionManager()
