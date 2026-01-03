-- T074: Create satisfaction surveys table for customer feedback
-- Migration: 007_create_satisfaction_surveys.sql
-- Created: 2024-12-31

CREATE TABLE satisfaction_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Overall rating (1-5 stars)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Detailed ratings (1-5 scale)
    food_quality INTEGER CHECK (food_quality >= 1 AND food_quality <= 5),
    service_quality INTEGER CHECK (service_quality >= 1 AND service_quality <= 5),
    ambiance INTEGER CHECK (ambiance >= 1 AND ambiance <= 5),
    value_for_money INTEGER CHECK (value_for_money >= 1 AND value_for_money <= 5),
    
    -- Open-ended feedback
    comments TEXT,
    would_recommend BOOLEAN,
    
    -- Customer info (optional, may be guest)
    customer_name VARCHAR(100),
    customer_email VARCHAR(255),
    
    -- Metadata
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one survey per order
    CONSTRAINT unique_survey_per_order UNIQUE(order_id)
);

-- Indexes for analytics
CREATE INDEX idx_satisfaction_surveys_order_id ON satisfaction_surveys(order_id);
CREATE INDEX idx_satisfaction_surveys_overall_rating ON satisfaction_surveys(overall_rating);
CREATE INDEX idx_satisfaction_surveys_submitted_at ON satisfaction_surveys(submitted_at DESC);
CREATE INDEX idx_satisfaction_surveys_would_recommend ON satisfaction_surveys(would_recommend);

-- Comments
COMMENT ON TABLE satisfaction_surveys IS 'Customer satisfaction feedback collected after order completion';
COMMENT ON COLUMN satisfaction_surveys.overall_rating IS 'Overall experience rating (1-5 stars, required)';
COMMENT ON COLUMN satisfaction_surveys.food_quality IS 'Food quality rating (1-5 stars, optional)';
COMMENT ON COLUMN satisfaction_surveys.service_quality IS 'Service quality rating (1-5 stars, optional)';
COMMENT ON COLUMN satisfaction_surveys.ambiance IS 'Restaurant ambiance rating (1-5 stars, optional)';
COMMENT ON COLUMN satisfaction_surveys.value_for_money IS 'Value for money rating (1-5 stars, optional)';
COMMENT ON COLUMN satisfaction_surveys.would_recommend IS 'Whether customer would recommend restaurant to others';
