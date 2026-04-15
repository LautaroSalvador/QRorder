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
      order_item_events: {
        Row: {
          actor_id: string | null;
          actor_type: "diner" | "staff" | "system";
          created_at: string;
          from_status:
            | "cart"
            | "pending"
            | "accepted"
            | "in_progress"
            | "ready"
            | "delivered"
            | "unavailable"
            | "cancelled"
            | null;
          id: string;
          order_item_id: string;
          reason: string | null;
          to_status:
            | "cart"
            | "pending"
            | "accepted"
            | "in_progress"
            | "ready"
            | "delivered"
            | "unavailable"
            | "cancelled";
        };
        Insert: {
          actor_id?: string | null;
          actor_type: "diner" | "staff" | "system";
          created_at?: string;
          from_status?:
            | "cart"
            | "pending"
            | "accepted"
            | "in_progress"
            | "ready"
            | "delivered"
            | "unavailable"
            | "cancelled"
            | null;
          id?: string;
          order_item_id: string;
          reason?: string | null;
          to_status:
            | "cart"
            | "pending"
            | "accepted"
            | "in_progress"
            | "ready"
            | "delivered"
            | "unavailable"
            | "cancelled";
        };
        Update: {
          actor_id?: string | null;
          actor_type?: "diner" | "staff" | "system";
          created_at?: string;
          from_status?:
            | "cart"
            | "pending"
            | "accepted"
            | "in_progress"
            | "ready"
            | "delivered"
            | "unavailable"
            | "cancelled"
            | null;
          id?: string;
          order_item_id?: string;
          reason?: string | null;
          to_status?:
            | "cart"
            | "pending"
            | "accepted"
            | "in_progress"
            | "ready"
            | "delivered"
            | "unavailable"
            | "cancelled";
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          accepted_at: string | null;
          added_by_staff_id: string | null;
          area: "cocina" | "barra";
          created_at: string;
          delivered_at: string | null;
          id: string;
          menu_item_id: string | null;
          name_snapshot: string;
          notes: string | null;
          order_id: string;
          price_snapshot: number;
          qty: number;
          ready_at: string | null;
          status:
            | "cart"
            | "pending"
            | "accepted"
            | "in_progress"
            | "ready"
            | "delivered"
            | "unavailable"
            | "cancelled";
        };
        Insert: {
          accepted_at?: string | null;
          added_by_staff_id?: string | null;
          area: "cocina" | "barra";
          created_at?: string;
          delivered_at?: string | null;
          id?: string;
          menu_item_id?: string | null;
          name_snapshot: string;
          notes?: string | null;
          order_id: string;
          price_snapshot: number;
          qty: number;
          ready_at?: string | null;
          status?:
            | "cart"
            | "pending"
            | "accepted"
            | "in_progress"
            | "ready"
            | "delivered"
            | "unavailable"
            | "cancelled";
        };
        Update: {
          accepted_at?: string | null;
          added_by_staff_id?: string | null;
          area?: "cocina" | "barra";
          created_at?: string;
          delivered_at?: string | null;
          id?: string;
          menu_item_id?: string | null;
          name_snapshot?: string;
          notes?: string | null;
          order_id?: string;
          price_snapshot?: number;
          qty?: number;
          ready_at?: string | null;
          status?:
            | "cart"
            | "pending"
            | "accepted"
            | "in_progress"
            | "ready"
            | "delivered"
            | "unavailable"
            | "cancelled";
        };
        Relationships: [];
      };
      orders: {
        Row: {
          created_at: string;
          id: string;
          session_id: string;
          subtotal: number;
          tip: number;
          total: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          session_id: string;
          subtotal?: number;
          tip?: number;
          total?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          session_id?: string;
          subtotal?: number;
          tip?: number;
          total?: number;
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
      table_sessions: {
        Row: {
          closed_at: string | null;
          id: string;
          opened_at: string;
          status: "open" | "awaiting_payment" | "paid" | "cancelled";
          table_id: string;
        };
        Insert: {
          closed_at?: string | null;
          id?: string;
          opened_at?: string;
          status?: "open" | "awaiting_payment" | "paid" | "cancelled";
          table_id: string;
        };
        Update: {
          closed_at?: string | null;
          id?: string;
          opened_at?: string;
          status?: "open" | "awaiting_payment" | "paid" | "cancelled";
          table_id?: string;
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
      audit_log: {
        Row: {
          actor_id: string | null;
          actor_type: "diner" | "staff" | "system";
          action: string;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
          payload: Record<string, unknown>;
        };
        Insert: {
          actor_id?: string | null;
          actor_type: "diner" | "staff" | "system";
          action: string;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
          payload?: Record<string, unknown>;
        };
        Update: {
          actor_id?: string | null;
          actor_type?: "diner" | "staff" | "system";
          action?: string;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
          payload?: Record<string, unknown>;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          external_id: string | null;
          id: string;
          provider: "mercadopago" | "offline";
          raw_payload: Record<string, unknown>;
          session_id: string;
          status: "pending" | "approved" | "rejected" | "cancelled";
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          provider: "mercadopago" | "offline";
          raw_payload?: Record<string, unknown>;
          session_id: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          provider?: "mercadopago" | "offline";
          raw_payload?: Record<string, unknown>;
          session_id?: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
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
      table_session_status: "open" | "awaiting_payment" | "paid" | "cancelled";
      table_status: "available" | "occupied" | "awaiting_payment" | "closed";
      order_item_status:
        | "cart"
        | "pending"
        | "accepted"
        | "in_progress"
        | "ready"
        | "delivered"
        | "unavailable"
        | "cancelled";
      actor_type: "diner" | "staff" | "system";
    };
    CompositeTypes: Record<string, never>;
  };
};
