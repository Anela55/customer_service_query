-- Customer Service Data Query
-- Proposed PostgreSQL database schema.
-- This schema is not connected to the current front end.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    phone VARCHAR(30),

    account_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (
            account_status IN (
                'active',
                'inactive',
                'blocked'
            )
        ),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,

    customer_id UUID NOT NULL
        REFERENCES customers(id),

    subject VARCHAR(200) NOT NULL,

    description TEXT NOT NULL DEFAULT '',

    category VARCHAR(100) NOT NULL DEFAULT 'general',

    priority VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (
            priority IN (
                'low',
                'normal',
                'high',
                'urgent'
            )
        ),

    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (
            status IN (
                'open',
                'pending',
                'resolved',
                'closed'
            )
        ),

    assigned_to UUID,

    due_at TIMESTAMPTZ,

    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket indexes
CREATE INDEX IF NOT EXISTS idx_tickets_customer
    ON support_tickets(customer_id);

CREATE INDEX IF NOT EXISTS idx_tickets_status
    ON support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_tickets_priority
    ON support_tickets(priority);

CREATE INDEX IF NOT EXISTS idx_tickets_created
    ON support_tickets(created_at);

-- Ticket comments and internal notes
CREATE TABLE IF NOT EXISTS ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_id UUID NOT NULL
        REFERENCES support_tickets(id)
        ON DELETE CASCADE,

    author_user_id UUID,

    body TEXT NOT NULL,

    is_internal BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query history
CREATE TABLE IF NOT EXISTS query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID,

    query_text TEXT NOT NULL,

    query_kind VARCHAR(20) NOT NULL
        CHECK (
            query_kind IN (
                'search',
                'structured'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit events
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_user_id UUID,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id UUID,

    details JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);