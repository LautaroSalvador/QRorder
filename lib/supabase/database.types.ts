export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      menu_categories: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          name: string;
          preparation_area: "cocina" | "barra";
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          name: string;
          preparation_area: "cocina" | "barra";
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          name?: string;
          preparation_area?: "cocina" | "barra";
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          available: boolean;
          category_id: string;
          created_at: string;
          description: string;
          id: string;
          image_url: string | null;
          name: string;
          price: number;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          available?: boolean;
          category_id: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          name: string;
          price: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          available?: boolean;
          category_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          name?: string;
          price?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_users: {
        Row: {
          active: boolean;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: "admin" | "cajero" | "cocina" | "barra";
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          role: "admin" | "cajero" | "cocina" | "barra";
        };
        Update: {
          active?: boolean;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: "admin" | "cajero" | "cocina" | "barra";
        };
        Relationships: [];
      };
      tables: {
        Row: {
          capacity: number;
          created_at: string;
          current_session_id: string | null;
          id: string;
          name: string;
          number: number;
          pos_x: number;
          pos_y: number;
          status: "available" | "occupied" | "awaiting_payment" | "closed";
          updated_at: string;
        };
        Insert: {
          capacity?: number;
          created_at?: string;
          current_session_id?: string | null;
          id?: string;
          name: string;
          number: number;
          pos_x?: number;
          pos_y?: number;
          status?: "available" | "occupied" | "awaiting_payment" | "closed";
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          current_session_id?: string | null;
          id?: string;
          name?: string;
          number?: number;
          pos_x?: number;
          pos_y?: number;
          status?: "available" | "occupied" | "awaiting_payment" | "closed";
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      preparation_area: "cocina" | "barra";
      staff_role: "admin" | "cajero" | "cocina" | "barra";
    };
    CompositeTypes: Record<string, never>;
  };
};
