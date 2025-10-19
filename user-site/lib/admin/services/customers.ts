import { createClient } from '@/lib/admin/supabase/server'
import { Customer, CustomerFilters, CustomerStats, CustomerCreateInput, CustomerUpdateInput, CustomerListResponse } from '@/lib/admin/types/customer'
import { customerFiltersSchema } from '@/lib/admin/validations/customer'

export class CustomerService {
  private supabase: any

  constructor() {
    this.supabase = null // Will be initialized in methods
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  async getCustomers(filters: CustomerFilters = {}): Promise<CustomerListResponse> {
    const supabase = await this.getSupabase()
    
    // Validate filters
    const validatedFilters = customerFiltersSchema.parse(filters)
    
    // Build query
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })

    // Apply filters
    if (validatedFilters.search) {
      query = query.or(`first_name.ilike.%${validatedFilters.search}%,last_name.ilike.%${validatedFilters.search}%,email.ilike.%${validatedFilters.search}%`)
    }

    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }

    if (validatedFilters.gender) {
      query = query.eq('gender', validatedFilters.gender)
    }

    if (validatedFilters.country) {
      query = query.eq('country', validatedFilters.country)
    }

    if (validatedFilters.city) {
      query = query.eq('city', validatedFilters.city)
    }

    if (validatedFilters.state) {
      query = query.eq('state', validatedFilters.state)
    }

    if (validatedFilters.min_orders !== undefined) {
      query = query.gte('total_orders', validatedFilters.min_orders)
    }

    if (validatedFilters.max_orders !== undefined) {
      query = query.lte('total_orders', validatedFilters.max_orders)
    }

    if (validatedFilters.min_spent !== undefined) {
      query = query.gte('total_spent', validatedFilters.min_spent)
    }

    if (validatedFilters.max_spent !== undefined) {
      query = query.lte('total_spent', validatedFilters.max_spent)
    }

    if (validatedFilters.date_from) {
      query = query.gte('join_date', validatedFilters.date_from)
    }

    if (validatedFilters.date_to) {
      query = query.lte('join_date', validatedFilters.date_to)
    }

    // Apply sorting
    const sortColumn = validatedFilters.sort_by === 'name' ? 'first_name' : validatedFilters.sort_by
    query = query.order(sortColumn, { ascending: validatedFilters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(validatedFilters.offset, validatedFilters.offset + validatedFilters.limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`)
    }

    return {
      customers: data || [],
      total: count || 0,
      page: Math.floor(validatedFilters.offset / validatedFilters.limit) + 1,
      limit: validatedFilters.limit,
      has_more: (validatedFilters.offset + validatedFilters.limit) < (count || 0)
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch customer: ${error.message}`)
    }

    return data
  }

  async createCustomer(customerData: CustomerCreateInput): Promise<Customer> {
    const supabase = await this.getSupabase()
    
    // Check if email already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerData.email)
      .single()

    if (existingCustomer) {
      throw new Error('Customer with this email already exists')
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`)
    }

    return data
  }

  async updateCustomer(id: string, customerData: CustomerUpdateInput): Promise<Customer> {
    const supabase = await this.getSupabase()
    
    // Remove id from update data
    const { id: _, ...updateData } = customerData

    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', id)
        .single()

      if (existingCustomer) {
        throw new Error('Customer with this email already exists')
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Customer not found')
      }
      throw new Error(`Failed to update customer: ${error.message}`)
    }

    return data
  }

  async deleteCustomer(id: string): Promise<void> {
    const supabase = await this.getSupabase()
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Customer not found')
      }
      throw new Error(`Failed to delete customer: ${error.message}`)
    }
  }

  async getCustomerStats(): Promise<CustomerStats> {
    const supabase = await this.getSupabase()
    
    // Get total customers
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    // Get active customers
    const { count: activeCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get inactive customers
    const { count: inactiveCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inactive')

    // Get blocked customers
    const { count: blockedCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'blocked')

    // Get new customers this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newCustomersThisMonth } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('join_date', startOfMonth.toISOString())

    // Get total revenue and average order value
    const { data: revenueData, error: revenueError } = await supabase
      .from('customers')
      .select('total_spent, total_orders')

    if (revenueError) {
      throw new Error(`Failed to fetch revenue data: ${revenueError.message}`)
    }

    const totalRevenue = revenueData?.reduce((sum: number, customer: any) => sum + customer.total_spent, 0) || 0
    const totalOrders = revenueData?.reduce((sum: number, customer: any) => sum + customer.total_orders, 0) || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get top customers
    const { data: topCustomers, error: topCustomersError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, full_name, email, total_orders, total_spent')
      .order('total_spent', { ascending: false })
      .limit(5)

    if (topCustomersError) {
      throw new Error(`Failed to fetch top customers: ${topCustomersError.message}`)
    }

    return {
      total_customers: totalCustomers || 0,
      active_customers: activeCustomers || 0,
      inactive_customers: inactiveCustomers || 0,
      blocked_customers: blockedCustomers || 0,
      new_customers_this_month: newCustomersThisMonth || 0,
      total_revenue: totalRevenue,
      average_order_value: averageOrderValue,
      top_customers: topCustomers?.map((customer: any) => ({
        id: customer.id,
        name: customer.full_name,
        email: customer.email,
        total_orders: customer.total_orders,
        total_spent: customer.total_spent
      }))
    }
  }

  async getCustomerOrders(customerId: string, limit: number = 10): Promise<any[]> {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        order_date
      `)
      .eq('customer_id', customerId)
      .order('order_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch customer orders: ${error.message}`)
    }

    return data || []
  }
}

// Export singleton instance
export const customerService = new CustomerService()
