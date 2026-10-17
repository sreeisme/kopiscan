
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "demo_requests": {
                  Row: {
                    "created_at": string,"email": string,"emailed": boolean,"id": string,"message": string,"name": string,"phone": string,"restaurant": string
                  }
                  Insert: {
                    "created_at"?: string,"email": string,"emailed"?: boolean,"id"?: string,"message"?: string,"name": string,"phone"?: string,"restaurant": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"emailed"?: boolean,"id"?: string,"message"?: string,"name"?: string,"phone"?: string,"restaurant"?: string
                  }
                  Relationships: [
                    
                  ]
                },"memberships": {
                  Row: {
                    "created_at": string,"restaurant_id": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"restaurant_id": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"restaurant_id"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"menu_categories": {
                  Row: {
                    "id": string,"name": string,"restaurant_id": string,"sort": number,"translations": NonNullable<Json>,"visible": boolean
                  }
                  Insert: {
                    "id"?: string,"name": string,"restaurant_id": string,"sort"?: number,"translations"?: NonNullable<Json>,"visible"?: boolean
                  }
                  Update: {
                    "id"?: string,"name"?: string,"restaurant_id"?: string,"sort"?: number,"translations"?: NonNullable<Json>,"visible"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "menu_categories_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"menu_items": {
                  Row: {
                    "available": boolean,"category_id": string,"created_at": string,"description": string,"id": string,"image_path": string | null,"name": string,"price_cents": number,"restaurant_id": string,"sort": number,"tags": (string)[],"translations": NonNullable<Json>
                  }
                  Insert: {
                    "available"?: boolean,"category_id": string,"created_at"?: string,"description"?: string,"id"?: string,"image_path"?: string | null,"name": string,"price_cents": number,"restaurant_id": string,"sort"?: number,"tags"?: (string)[],"translations"?: NonNullable<Json>
                  }
                  Update: {
                    "available"?: boolean,"category_id"?: string,"created_at"?: string,"description"?: string,"id"?: string,"image_path"?: string | null,"name"?: string,"price_cents"?: number,"restaurant_id"?: string,"sort"?: number,"tags"?: (string)[],"translations"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "menu_items_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "menu_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "menu_items_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"modifier_groups": {
                  Row: {
                    "id": string,"item_id": string,"max_select": number,"min_select": number,"name": string,"restaurant_id": string,"sort": number
                  }
                  Insert: {
                    "id"?: string,"item_id": string,"max_select"?: number,"min_select"?: number,"name": string,"restaurant_id": string,"sort"?: number
                  }
                  Update: {
                    "id"?: string,"item_id"?: string,"max_select"?: number,"min_select"?: number,"name"?: string,"restaurant_id"?: string,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "modifier_groups_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "menu_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "modifier_groups_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"modifier_options": {
                  Row: {
                    "available": boolean,"group_id": string,"id": string,"name": string,"price_delta_cents": number,"restaurant_id": string,"sort": number
                  }
                  Insert: {
                    "available"?: boolean,"group_id": string,"id"?: string,"name": string,"price_delta_cents"?: number,"restaurant_id": string,"sort"?: number
                  }
                  Update: {
                    "available"?: boolean,"group_id"?: string,"id"?: string,"name"?: string,"price_delta_cents"?: number,"restaurant_id"?: string,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "modifier_options_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "modifier_groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "modifier_options_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "id": string,"item_id": string | null,"line_total_cents": number,"modifiers": NonNullable<Json>,"name": string,"order_id": string,"qty": number,"restaurant_id": string,"unit_price_cents": number
                  }
                  Insert: {
                    "id"?: string,"item_id"?: string | null,"line_total_cents": number,"modifiers"?: NonNullable<Json>,"name": string,"order_id": string,"qty": number,"restaurant_id": string,"unit_price_cents": number
                  }
                  Update: {
                    "id"?: string,"item_id"?: string | null,"line_total_cents"?: number,"modifiers"?: NonNullable<Json>,"name"?: string,"order_id"?: string,"qty"?: number,"restaurant_id"?: string,"unit_price_cents"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "menu_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "acknowledged_at": string | null,"created_at": string,"done_at": string | null,"id": string,"idempotency_key": string,"note": string,"restaurant_id": string,"session_id": string,"status": Database["public"]['Enums']["order_status"],"subtotal_cents": number,"table_id": string,"table_label": string
                  }
                  Insert: {
                    "acknowledged_at"?: string | null,"created_at"?: string,"done_at"?: string | null,"id"?: string,"idempotency_key": string,"note"?: string,"restaurant_id": string,"session_id": string,"status"?: Database["public"]['Enums']["order_status"],"subtotal_cents": number,"table_id": string,"table_label": string
                  }
                  Update: {
                    "acknowledged_at"?: string | null,"created_at"?: string,"done_at"?: string | null,"id"?: string,"idempotency_key"?: string,"note"?: string,"restaurant_id"?: string,"session_id"?: string,"status"?: Database["public"]['Enums']["order_status"],"subtotal_cents"?: number,"table_id"?: string,"table_label"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "table_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_table_id_fkey"
      columns: ["table_id"]
isOneToOne: false
      referencedRelation: "tables"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_limits": {
                  Row: {
                    "max_items": number | null,"max_staff": number | null,"max_tables": number | null,"plan": Database["public"]['Enums']["plan_tier"]
                  }
                  Insert: {
                    "max_items"?: number | null,"max_staff"?: number | null,"max_tables"?: number | null,"plan": Database["public"]['Enums']["plan_tier"]
                  }
                  Update: {
                    "max_items"?: number | null,"max_staff"?: number | null,"max_tables"?: number | null,"plan"?: Database["public"]['Enums']["plan_tier"]
                  }
                  Relationships: [
                    
                  ]
                },"platform_admins": {
                  Row: {
                    "user_id": string
                  }
                  Insert: {
                    "user_id": string
                  }
                  Update: {
                    "user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "count": number,"key": string,"window_start": string
                  }
                  Insert: {
                    "count"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "count"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"restaurants": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"plan": Database["public"]['Enums']["plan_tier"],"settings": NonNullable<Json>,"slug": string,"status": Database["public"]['Enums']["restaurant_status"],"theme": NonNullable<Json>
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"plan"?: Database["public"]['Enums']["plan_tier"],"settings"?: NonNullable<Json>,"slug": string,"status"?: Database["public"]['Enums']["restaurant_status"],"theme"?: NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"plan"?: Database["public"]['Enums']["plan_tier"],"settings"?: NonNullable<Json>,"slug"?: string,"status"?: Database["public"]['Enums']["restaurant_status"],"theme"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"service_requests": {
                  Row: {
                    "created_at": string,"id": string,"resolved_at": string | null,"restaurant_id": string,"session_id": string | null,"status": Database["public"]['Enums']["request_status"],"table_id": string,"table_label": string,"type": Database["public"]['Enums']["request_type"]
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"resolved_at"?: string | null,"restaurant_id": string,"session_id"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"table_id": string,"table_label": string,"type": Database["public"]['Enums']["request_type"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"resolved_at"?: string | null,"restaurant_id"?: string,"session_id"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"table_id"?: string,"table_label"?: string,"type"?: Database["public"]['Enums']["request_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_requests_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_requests_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "table_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_requests_table_id_fkey"
      columns: ["table_id"]
isOneToOne: false
      referencedRelation: "tables"
      referencedColumns: ["id"]
    }
                  ]
                },"table_sessions": {
                  Row: {
                    "closed_at": string | null,"created_at": string,"expires_at": string,"id": string,"ip_hash": string | null,"last_seen_at": string,"restaurant_id": string,"table_id": string,"ua_hash": string | null
                  }
                  Insert: {
                    "closed_at"?: string | null,"created_at"?: string,"expires_at"?: string,"id"?: string,"ip_hash"?: string | null,"last_seen_at"?: string,"restaurant_id": string,"table_id": string,"ua_hash"?: string | null
                  }
                  Update: {
                    "closed_at"?: string | null,"created_at"?: string,"expires_at"?: string,"id"?: string,"ip_hash"?: string | null,"last_seen_at"?: string,"restaurant_id"?: string,"table_id"?: string,"ua_hash"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "table_sessions_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "table_sessions_table_id_fkey"
      columns: ["table_id"]
isOneToOne: false
      referencedRelation: "tables"
      referencedColumns: ["id"]
    }
                  ]
                },"tables": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"label": string,"qr_token": string,"restaurant_id": string,"sort": number
                  }
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"label": string,"qr_token"?: string,"restaurant_id": string,"sort"?: number
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"label"?: string,"qr_token"?: string,"restaurant_id"?: string,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "tables_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "gen_qr_token":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"hit_rate_limit":
{ Args: { "p_key": string,"p_limit": number,"p_window_secs": number }; Returns: boolean
                           },
"is_member":
{ Args: { "rid": string }; Returns: boolean
                           },
"is_owner":
{ Args: { "rid": string }; Returns: boolean
                           },
"is_platform_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"place_order":
{ Args: { "p_items": Json,"p_order": Json }; Returns: string
                           }
          }
          Enums: {
            "member_role": "owner"|"staff","order_status": "new"|"acknowledged"|"done"|"cancelled","plan_tier": "basic"|"pro"|"premium","request_status": "open"|"done","request_type": "call_waiter"|"bill","restaurant_status": "active"|"trial"|"suspended"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "member_role": ["owner", "staff"],"order_status": ["new", "acknowledged", "done", "cancelled"],"plan_tier": ["basic", "pro", "premium"],"request_status": ["open", "done"],"request_type": ["call_waiter", "bill"],"restaurant_status": ["active", "trial", "suspended"]
          }
        }
} as const
