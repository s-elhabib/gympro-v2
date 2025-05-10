export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          id: string
          member_id: string
          check_in_time: string
          check_out_time: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          check_in_time?: string
          check_out_time?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          check_in_time?: string
          check_out_time?: string | null
        }
      }
      members: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string | null
          emergency_contact: string | null
          date_of_birth: string | null
          membership_type: string
          membership_start_date: string
          membership_end_date: string | null
          created_at: string
          updated_at: string
          status: string
          notes: string | null
          profile_image_url: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address?: string | null
          emergency_contact?: string | null
          date_of_birth?: string | null
          membership_type: string
          membership_start_date?: string
          membership_end_date?: string | null
          created_at?: string
          updated_at?: string
          status?: string
          notes?: string | null
          profile_image_url?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          address?: string | null
          emergency_contact?: string | null
          date_of_birth?: string | null
          membership_type?: string
          membership_start_date?: string
          membership_end_date?: string | null
          created_at?: string
          updated_at?: string
          status?: string
          notes?: string | null
          profile_image_url?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          member_id: string
          amount: number
          due_date: string
          payment_date: string
          status: string
          payment_method: string
          created_at: string
          updated_at: string
          description: string | null
          transaction_id: string | null
        }
        Insert: {
          id?: string
          member_id: string
          amount: number
          due_date: string
          payment_date?: string
          status?: string
          payment_method: string
          created_at?: string
          updated_at?: string
          description?: string | null
          transaction_id?: string | null
        }
        Update: {
          id?: string
          member_id?: string
          amount?: number
          due_date?: string
          payment_date?: string
          status?: string
          payment_method?: string
          created_at?: string
          updated_at?: string
          description?: string | null
          transaction_id?: string | null
        }
      }
      gym_settings: {
        Row: {
          id: string
          auto_checkout_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auto_checkout_minutes: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auto_checkout_minutes?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}