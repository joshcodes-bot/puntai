export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_initials: string | null
          balance: number
          tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_initials?: string | null
          balance?: number
          tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_initials?: string | null
          balance?: number
          tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
          updated_at?: string
        }
      }
      punts: {
        Row: {
          id: string
          user_id: string
          event: string
          pick: string
          odds: number
          stake: number
          result: 'pending' | 'won' | 'lost' | 'void'
          payout: number
          event_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event: string
          pick: string
          odds: number
          stake: number
          result?: 'pending' | 'won' | 'lost' | 'void'
          payout?: number
          event_date: string
          created_at?: string
        }
        Update: {
          result?: 'pending' | 'won' | 'lost' | 'void'
          payout?: number
        }
      }
    }
    Views: {
      leaderboard_view: {
        Row: {
          user_id: string
          full_name: string | null
          avatar_initials: string | null
          tier: string
          total_punts: number
          wins: number
          win_rate: number
          total_profit: number
          rank: number
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Punt = Database['public']['Tables']['punts']['Row']
export type LeaderboardEntry = Database['public']['Views']['leaderboard_view']['Row']
