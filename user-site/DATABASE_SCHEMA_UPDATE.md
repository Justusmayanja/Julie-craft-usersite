# Database Schema Update for User Authentication

## New Tables Required

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  is_guest BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for role-based queries
CREATE INDEX idx_users_role ON users(role);
```

### 2. Update Existing Tables

#### Update Orders Table
```sql
-- Add user_id column to link orders to users
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);

-- Update guest_customers table to link to users
ALTER TABLE guest_customers ADD COLUMN user_id UUID REFERENCES users(id);
```

#### Update User Sessions Table
```sql
-- Create user_sessions table for better session management
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster session lookups
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
```

## Environment Variables to Add

Add these to your `.env.local` file:

```bash
# JWT Secret for token signing (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Optional: JWT expiration time
JWT_EXPIRES_IN=7d
```

## Migration Steps

1. **Run the SQL commands above** in your Supabase SQL editor
2. **Add JWT_SECRET** to your environment variables
3. **Test the authentication endpoints** using the health check API

## Security Considerations

1. **JWT Secret**: Use a strong, random secret key in production
2. **Password Hashing**: Using bcryptjs with 12 salt rounds
3. **Session Management**: Sessions expire after 7 days
4. **Input Validation**: All inputs are validated on the server
5. **Rate Limiting**: Consider adding rate limiting for auth endpoints

## Testing the Authentication

1. **Register a new user**: POST to `/api/auth/register`
2. **Login**: POST to `/api/auth/login`
3. **Verify token**: GET to `/api/auth/verify` with Authorization header
4. **Access protected routes**: Include Bearer token in headers

## User Flow

### Guest Users (Current System)
- Can browse products
- Can add items to cart
- Can place orders (linked to session)
- Can track orders by order number

### Authenticated Users (New System)
- All guest features
- Persistent cart across devices
- Order history
- Profile management
- Faster checkout (saved addresses)

### Migration from Guest to User
- Guest cart can be transferred to user account
- Guest orders remain linked to session
- User can access both guest and user orders
