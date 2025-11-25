-- Migration 057: Generated Taxonomy
-- Auto-generated from package analysis
-- Generated at: 2025-11-16T18:06:42.207Z
-- Total packages analyzed: 8196

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  description TEXT,
  icon VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Create use_cases table if it doesn't exist
CREATE TABLE IF NOT EXISTS use_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_use_cases_slug ON use_cases(slug);

-- Insert categories and use cases
-- Note: This uses a temporary function to handle hierarchical inserts

DO $$
DECLARE
  v_level1_id UUID;
  v_level2_id UUID;
BEGIN
  -- Insert Level 1 Categories

  -- Level 1: Backend Development
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('Backend Development', 'backend-development', NULL, 1, 'server', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: Application Performance
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Application Performance', 'application-performance', v_level1_id, 2, 'Tools and agents focused on optimizing application performance, including monitoring, logging, and observability.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Engineering', 'performance-engineering', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Observability', 'observability', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Containerization and Deployment
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Containerization and Deployment', 'containerization-and-deployment', v_level1_id, 2, 'Packages that assist with containerization, deployment strategies, and cloud-native architecture.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Docker', 'docker', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Kubernetes Operations', 'kubernetes-operations', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Code Quality and Review
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Code Quality and Review', 'code-quality-and-review', v_level1_id, 2, 'Tools aimed at improving code quality through reviews, refactoring, and documentation.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Review', 'code-review', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Documentation', 'documentation', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Database Management
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Database Management', 'database-management', v_level1_id, 2, 'Packages that facilitate database operations, migrations, and optimizations.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Database Migrations', 'database-migrations', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Database Optimization', 'database-optimization', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: API Development
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('API Development', 'api-development', v_level1_id, 2, 'Guidelines and tools for building, managing, and documenting APIs.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('REST APIs', 'rest-apis', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('GraphQL APIs', 'graphql-apis', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: DevOps and Infrastructure
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('DevOps and Infrastructure', 'devops-and-infrastructure', v_level1_id, 2, 'Tools for managing infrastructure, CI/CD pipelines, and deployment automation.', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Terraform', 'terraform', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('GitOps', 'gitops', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Frontend Development
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Frontend Development', 'frontend-development', v_level1_id, 2, 'Packages that support frontend development practices and frameworks.', 6)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('React', 'react', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Vue', 'vue', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 1: Frontend Development
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('Frontend Development', 'frontend-development', NULL, 1, 'layout', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: AI-Powered Development Tools
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('AI-Powered Development Tools', 'ai-powered-development-tools', v_level1_id, 2, 'Tools that leverage AI to enhance various aspects of software development, including code quality, testing, and performance optimization.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Quality Analysis', 'code-quality-analysis', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Test Automation', 'test-automation', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Optimization', 'performance-optimization', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Frontend Frameworks and Libraries
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Frontend Frameworks and Libraries', 'frontend-frameworks-and-libraries', v_level1_id, 2, 'Guides and tools specifically designed for popular frontend frameworks and libraries, focusing on best practices and implementation strategies.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('React Development', 'react-development', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Angular Best Practices', 'angular-best-practices', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Vue.js Optimization', 'vue-js-optimization', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Deployment and Infrastructure Management
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Deployment and Infrastructure Management', 'deployment-and-infrastructure-management', v_level1_id, 2, 'Resources for deploying applications and managing cloud infrastructure, including CI/CD pipelines and serverless architectures.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('AWS Deployment', 'aws-deployment', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Docker and Containerization', 'docker-and-containerization', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Microservices Architecture', 'microservices-architecture', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Code Review and Collaboration
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Code Review and Collaboration', 'code-review-and-collaboration', v_level1_id, 2, 'Skills and tools aimed at improving the code review process, facilitating collaboration among developers, and ensuring adherence to coding standards.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Review Best Practices', 'code-review-best-practices', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Team Collaboration Tools', 'team-collaboration-tools', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Accessibility and User Experience
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Accessibility and User Experience', 'accessibility-and-user-experience', v_level1_id, 2, 'Guidelines and tools focused on ensuring applications are accessible and provide a positive user experience.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Accessibility Audits', 'accessibility-audits', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('UI Testing', 'ui-testing', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Database Management and Integration
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Database Management and Integration', 'database-management-and-integration', v_level1_id, 2, 'Tools and guides for managing databases, including schema migrations, CRUD operations, and integration with various frameworks.', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('MongoDB Integration', 'mongodb-integration', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('PostgreSQL Management', 'postgresql-management', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Database Schema Migration', 'database-schema-migration', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 1: Testing & Quality
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('Testing & Quality', 'testing-quality', NULL, 1, 'check-circle', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: Code Quality & Review
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Code Quality & Review', 'code-quality-review', v_level1_id, 2, 'Tools and agents focused on improving code quality through reviews, refactoring, and adherence to best practices.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Review', 'code-review', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Refactoring', 'refactoring', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Smells', 'code-smells', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Testing & Automation
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Testing & Automation', 'testing-automation', v_level1_id, 2, 'Packages designed for creating, managing, and automating tests across various frameworks and environments.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Unit Testing', 'unit-testing', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Integration Testing', 'integration-testing', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('End-to-End Testing', 'end-to-end-testing', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Performance Engineering
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Performance Engineering', 'performance-engineering', v_level1_id, 2, 'Tools aimed at optimizing application performance, including load testing and observability.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Load Testing', 'load-testing', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Observability', 'observability', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Optimization', 'performance-optimization', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Development Workflows
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Development Workflows', 'development-workflows', v_level1_id, 2, 'Guidelines and tools for managing development processes, including CI/CD and project planning.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('CI/CD Integration', 'ci-cd-integration', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Project Management', 'project-management', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Agile Workflows', 'agile-workflows', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Documentation & Compliance
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Documentation & Compliance', 'documentation-compliance', v_level1_id, 2, 'Agents that ensure documentation is up-to-date and that code adheres to specified guidelines and compliance standards.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Documentation Automation', 'documentation-automation', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Compliance Checks', 'compliance-checks', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Standards', 'code-standards', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Debugging & Issue Resolution
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Debugging & Issue Resolution', 'debugging-issue-resolution', v_level1_id, 2, 'Tools focused on identifying, diagnosing, and resolving bugs and issues in code.', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Systematic Debugging', 'systematic-debugging', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Error Analysis', 'error-analysis', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Flaky Test Resolution', 'flaky-test-resolution', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 1: DevOps & Infrastructure
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('DevOps & Infrastructure', 'devops-infrastructure', NULL, 1, 'cloud', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: Deployment & Automation
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Deployment & Automation', 'deployment-automation', v_level1_id, 2, 'Tools and skills focused on automating deployment processes and managing infrastructure efficiently.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('CI/CD', 'ci-cd', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Containerization', 'containerization', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Infrastructure as Code', 'infrastructure-as-code', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Monitoring & Observability
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Monitoring & Observability', 'monitoring-observability', v_level1_id, 2, 'Packages that assist in implementing monitoring, logging, and observability strategies for applications and infrastructure.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Application Performance Monitoring', 'application-performance-monitoring', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Incident Response', 'incident-response', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Logging Solutions', 'logging-solutions', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Cloud Infrastructure Management
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Cloud Infrastructure Management', 'cloud-infrastructure-management', v_level1_id, 2, 'Skills and tools for managing cloud resources across various platforms, including AWS, Azure, and GCP.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Cloud Cost Optimization', 'cloud-cost-optimization', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Database Management', 'database-management', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Serverless Architectures', 'serverless-architectures', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Testing & Quality Assurance
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Testing & Quality Assurance', 'testing-quality-assurance', v_level1_id, 2, 'Resources aimed at improving testing strategies, automating tests, and ensuring software quality.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Test Automation', 'test-automation', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Integration Testing', 'integration-testing', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Testing', 'performance-testing', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: DevOps Best Practices
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('DevOps Best Practices', 'devops-best-practices', v_level1_id, 2, 'Guidelines and best practices for implementing DevOps methodologies in software development and operations.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('GitOps', 'gitops', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Security Compliance', 'security-compliance', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Collaboration Tools', 'collaboration-tools', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Database Management & Migrations
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Database Management & Migrations', 'database-management-migrations', v_level1_id, 2, 'Tools and skills for managing databases, executing migrations, and ensuring data integrity.', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Database Migrations', 'database-migrations', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Schema Management', 'schema-management', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Data Transformation', 'data-transformation', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 1: AI & Machine Learning
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('AI & Machine Learning', 'ai-machine-learning', NULL, 1, 'brain', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: Development Tools
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Development Tools', 'development-tools', v_level1_id, 2, 'Tools and skills for enhancing software development processes, including code quality, testing, and debugging.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Review', 'code-review', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Test Automation', 'test-automation', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Debugging Techniques', 'debugging-techniques', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Infrastructure Management
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Infrastructure Management', 'infrastructure-management', v_level1_id, 2, 'Skills focused on managing and deploying infrastructure, particularly in cloud environments.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Cloud Deployment', 'cloud-deployment', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Containerization', 'containerization', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Infrastructure as Code', 'infrastructure-as-code', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Performance Optimization
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Performance Optimization', 'performance-optimization', v_level1_id, 2, 'Skills aimed at improving application performance through analysis and optimization techniques.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Application Performance', 'application-performance', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Observability', 'observability', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Load Testing', 'load-testing', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Documentation and Compliance
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Documentation and Compliance', 'documentation-and-compliance', v_level1_id, 2, 'Skills for maintaining project documentation, ensuring compliance, and managing code quality.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Documentation Automation', 'documentation-automation', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Compliance Verification', 'compliance-verification', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Quality Analysis', 'code-quality-analysis', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: AI and Machine Learning
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('AI and Machine Learning', 'ai-and-machine-learning', v_level1_id, 2, 'Skills for implementing AI and machine learning solutions, including prompt engineering and model evaluation.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Prompt Engineering', 'prompt-engineering', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Model Evaluation', 'model-evaluation', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Data Science', 'data-science', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 1: Data Engineering
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('Data Engineering', 'data-engineering', NULL, 1, 'database', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: Database Management
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Database Management', 'database-management', v_level1_id, 2, 'Tools and skills for managing, optimizing, and migrating databases across various platforms.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Database Optimization', 'database-optimization', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Database Migration', 'database-migration', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Database Security', 'database-security', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Data Analysis and Visualization
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Data Analysis and Visualization', 'data-analysis-and-visualization', v_level1_id, 2, 'Packages that assist in analyzing data, creating visualizations, and generating reports.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Spreadsheet Management', 'spreadsheet-management', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Data Modeling', 'data-modeling', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Business Intelligence', 'business-intelligence', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Cloud and DevOps
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Cloud and DevOps', 'cloud-and-devops', v_level1_id, 2, 'Guides and tools for deploying applications in cloud environments and managing CI/CD pipelines.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Cloud Infrastructure', 'cloud-infrastructure', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('CI/CD Best Practices', 'ci-cd-best-practices', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Containerization', 'containerization', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Application Development
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Application Development', 'application-development', v_level1_id, 2, 'Skills and tools for building and maintaining applications, including backend and frontend development.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Web Development', 'web-development', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('API Development', 'api-development', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Mobile Development', 'mobile-development', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Testing and Quality Assurance
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Testing and Quality Assurance', 'testing-and-quality-assurance', v_level1_id, 2, 'Tools and methodologies for ensuring software quality through testing and validation.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Unit Testing', 'unit-testing', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Integration Testing', 'integration-testing', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Testing', 'performance-testing', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Machine Learning and AI
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Machine Learning and AI', 'machine-learning-and-ai', v_level1_id, 2, 'Packages that facilitate machine learning model development, optimization, and deployment.', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Model Training', 'model-training', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('NLP Applications', 'nlp-applications', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Data Engineering for ML', 'data-engineering-for-ml', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 1: Mobile Development
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('Mobile Development', 'mobile-development', NULL, 1, 'smartphone', 6)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: Mobile Frameworks
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Mobile Frameworks', 'mobile-frameworks', v_level1_id, 2, 'Packages focused on specific mobile development frameworks like Flutter, React Native, and SwiftUI, providing best practices, guidelines, and rules.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Flutter Development', 'flutter-development', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('React Native Development', 'react-native-development', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('SwiftUI Development', 'swiftui-development', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Testing and Quality Assurance
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Testing and Quality Assurance', 'testing-and-quality-assurance', v_level1_id, 2, 'Tools and guidelines for testing mobile applications, ensuring quality, and validating user interfaces across platforms.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('UI Testing', 'ui-testing', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Testing', 'performance-testing', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Integration Testing', 'integration-testing', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Backend Integration
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Backend Integration', 'backend-integration', v_level1_id, 2, 'Packages that assist in integrating mobile applications with backend services, including best practices for API development and database management.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('REST API Development', 'rest-api-development', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Database Management', 'database-management', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Cloud Services Integration', 'cloud-services-integration', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Best Practices and Guidelines
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Best Practices and Guidelines', 'best-practices-and-guidelines', v_level1_id, 2, 'Comprehensive rules and practices for writing maintainable, secure, and efficient code in mobile development.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Organization', 'code-organization', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Security Best Practices', 'security-best-practices', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Optimization', 'performance-optimization', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Development Tools and Utilities
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Development Tools and Utilities', 'development-tools-and-utilities', v_level1_id, 2, 'Utilities and tools that enhance the mobile development process, including project scaffolding and code generation.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Project Setup', 'project-setup', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Generation', 'code-generation', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Dependency Management', 'dependency-management', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 1: Security
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('Security', 'security', NULL, 1, 'shield', 7)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: Application Security
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Application Security', 'application-security', v_level1_id, 2, 'Tools and prompts focused on securing applications, identifying vulnerabilities, and ensuring compliance with security standards.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Vulnerability Assessment', 'vulnerability-assessment', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Security Auditing', 'security-auditing', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Compliance', 'compliance', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Code Quality and Optimization
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Code Quality and Optimization', 'code-quality-and-optimization', v_level1_id, 2, 'Guidelines and tools for improving code quality, performance optimization, and maintaining coding standards.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Review', 'code-review', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Tuning', 'performance-tuning', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Technical Debt Management', 'technical-debt-management', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Infrastructure Security
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Infrastructure Security', 'infrastructure-security', v_level1_id, 2, 'Resources for securing cloud infrastructure, managing configurations, and implementing security best practices in cloud environments.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Cloud Security', 'cloud-security', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Network Security', 'network-security', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('DevSecOps', 'devsecops', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Testing and Automation
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Testing and Automation', 'testing-and-automation', v_level1_id, 2, 'Tools and frameworks for automating testing processes, ensuring code reliability, and enhancing software quality.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Test Automation', 'test-automation', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Continuous Integration/Continuous Deployment (CI/CD)', 'continuous-integration-continuous-deployment-ci-cd', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Quality Assurance', 'quality-assurance', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Development Best Practices
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Development Best Practices', 'development-best-practices', v_level1_id, 2, 'Best practices and guidelines for various development frameworks and languages, focusing on security and performance.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Framework-Specific Guidelines', 'framework-specific-guidelines', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Coding Standards', 'coding-standards', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Design Patterns', 'design-patterns', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 1: Documentation
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('Documentation', 'documentation', NULL, 1, 'book', 8)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: Documentation and Guidelines
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Documentation and Guidelines', 'documentation-and-guidelines', v_level1_id, 2, 'Packages that provide comprehensive documentation, best practices, and guidelines for various technologies and frameworks.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('API Documentation', 'api-documentation', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Guidelines', 'code-guidelines', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Deployment Guides', 'deployment-guides', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Skill Development
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Skill Development', 'skill-development', v_level1_id, 2, 'Packages focused on creating, testing, and improving AI skills, particularly for Claude and other AI frameworks.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Skill Creation', 'skill-creation', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Skill Testing', 'skill-testing', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Skill Sharing', 'skill-sharing', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Integration and Automation
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Integration and Automation', 'integration-and-automation', v_level1_id, 2, 'Tools that facilitate integration with various platforms and automate documentation updates and workflows.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('CI/CD Integration', 'ci-cd-integration', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Documentation Sync', 'documentation-sync', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Web Automation', 'web-automation', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Project Management and Best Practices
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Project Management and Best Practices', 'project-management-and-best-practices', v_level1_id, 2, 'Guides and tools for managing projects effectively, including workflows, version control, and team collaboration.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Project Workflows', 'project-workflows', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Version Control Best Practices', 'version-control-best-practices', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Testing Strategies', 'testing-strategies', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Accessibility and Compliance
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Accessibility and Compliance', 'accessibility-and-compliance', v_level1_id, 2, 'Tools and guidelines to ensure applications meet accessibility standards and compliance requirements.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Accessibility Audits', 'accessibility-audits', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Compliance Checks', 'compliance-checks', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 1: Code Quality
  INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
  VALUES ('Code Quality', 'code-quality', NULL, 1, 'code', 9)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  RETURNING id INTO v_level1_id;

  -- Level 2: Code Review and Quality Assurance
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Code Review and Quality Assurance', 'code-review-and-quality-assurance', v_level1_id, 2, 'Tools focused on reviewing code for quality, compliance, and best practices, ensuring that code meets project standards.', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Automated Code Review', 'automated-code-review', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Manual Code Review', 'manual-code-review', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Testing and Validation
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Testing and Validation', 'testing-and-validation', v_level1_id, 2, 'Packages that assist in creating, executing, and validating tests to ensure software reliability and performance.', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Unit Testing', 'unit-testing', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Integration Testing', 'integration-testing', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Testing', 'performance-testing', v_level2_id, 3, 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Documentation and Compliance
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Documentation and Compliance', 'documentation-and-compliance', v_level1_id, 2, 'Tools aimed at generating, maintaining, and validating documentation for codebases and ensuring compliance with standards.', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('API Documentation', 'api-documentation', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Documentation', 'code-documentation', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Refactoring and Optimization
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Refactoring and Optimization', 'refactoring-and-optimization', v_level1_id, 2, 'Packages that help in refactoring code to improve structure, readability, and performance without altering functionality.', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Refactoring', 'code-refactoring', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Performance Optimization', 'performance-optimization', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Development Workflow Automation
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Development Workflow Automation', 'development-workflow-automation', v_level1_id, 2, 'Tools that automate various aspects of the development workflow, including CI/CD integration and task management.', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Continuous Integration', 'continuous-integration', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Task Automation', 'task-automation', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Level 2: Code Quality Enforcement
  INSERT INTO categories (name, slug, parent_id, level, description, display_order)
  VALUES ('Code Quality Enforcement', 'code-quality-enforcement', v_level1_id, 2, 'Packages that enforce coding standards and best practices through linting and formatting tools.', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
  RETURNING id INTO v_level2_id;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Linting', 'linting', v_level2_id, 3, 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO categories (name, slug, parent_id, level, display_order)
  VALUES ('Code Formatting', 'code-formatting', v_level2_id, 3, 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- Insert Use Cases

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Building and optimizing REST APIs for scalability and performance', 'building-and-optimizing-rest-apis-for-scalability-and-performance', 'Use case for Backend Development', 0)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Implementing containerization strategies for microservices', 'implementing-containerization-strategies-for-microservices', 'Use case for Backend Development', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Conducting thorough code reviews to ensure quality and maintainability', 'conducting-thorough-code-reviews-to-ensure-quality-and-maintainability', 'Use case for Backend Development', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Managing database migrations and optimizing queries for performance', 'managing-database-migrations-and-optimizing-queries-for-performance', 'Use case for Backend Development', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Setting up CI/CD pipelines for automated deployment and testing', 'setting-up-ci-cd-pipelines-for-automated-deployment-and-testing', 'Use case for Backend Development', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Automating test processes to ensure code quality and reduce manual testing efforts.', 'automating-test-processes-to-ensure-code-quality-and-reduce-manual-testing-efforts', 'Use case for Frontend Development', 5)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Deploying applications to cloud platforms with best practices for scalability and security.', 'deploying-applications-to-cloud-platforms-with-best-practices-for-scalability-and-security', 'Use case for Frontend Development', 6)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Conducting accessibility audits to ensure compliance with WCAG guidelines.', 'conducting-accessibility-audits-to-ensure-compliance-with-wcag-guidelines', 'Use case for Frontend Development', 7)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Implementing effective code review processes to maintain code quality and team collaboration.', 'implementing-effective-code-review-processes-to-maintain-code-quality-and-team-collaboration', 'Use case for Frontend Development', 8)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Integrating payment processing solutions into e-commerce applications.', 'integrating-payment-processing-solutions-into-e-commerce-applications', 'Use case for Frontend Development', 9)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Improving code quality through automated reviews and refactoring', 'improving-code-quality-through-automated-reviews-and-refactoring', 'Use case for Testing & Quality', 10)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Creating and managing comprehensive test suites for applications', 'creating-and-managing-comprehensive-test-suites-for-applications', 'Use case for Testing & Quality', 11)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Optimizing application performance and identifying bottlenecks', 'optimizing-application-performance-and-identifying-bottlenecks', 'Use case for Testing & Quality', 12)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Establishing efficient CI/CD pipelines for faster deployment', 'establishing-efficient-ci-cd-pipelines-for-faster-deployment', 'Use case for Testing & Quality', 13)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Ensuring compliance with coding standards and maintaining up-to-date documentation', 'ensuring-compliance-with-coding-standards-and-maintaining-up-to-date-documentation', 'Use case for Testing & Quality', 14)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Automating the deployment of applications to the cloud using CI/CD pipelines', 'automating-the-deployment-of-applications-to-the-cloud-using-ci-cd-pipelines', 'Use case for DevOps & Infrastructure', 15)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Implementing monitoring solutions to track application performance and detect incidents', 'implementing-monitoring-solutions-to-track-application-performance-and-detect-incidents', 'Use case for DevOps & Infrastructure', 16)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Optimizing cloud costs through resource management and analysis', 'optimizing-cloud-costs-through-resource-management-and-analysis', 'Use case for DevOps & Infrastructure', 17)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Automating testing processes to ensure code quality and reliability', 'automating-testing-processes-to-ensure-code-quality-and-reliability', 'Use case for DevOps & Infrastructure', 18)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Managing database migrations with zero-downtime strategies', 'managing-database-migrations-with-zero-downtime-strategies', 'Use case for DevOps & Infrastructure', 19)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Automating code reviews to ensure quality and adherence to best practices.', 'automating-code-reviews-to-ensure-quality-and-adherence-to-best-practices', 'Use case for AI & Machine Learning', 20)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Deploying applications to cloud platforms using Infrastructure as Code.', 'deploying-applications-to-cloud-platforms-using-infrastructure-as-code', 'Use case for AI & Machine Learning', 21)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Optimizing application performance through observability and load testing.', 'optimizing-application-performance-through-observability-and-load-testing', 'Use case for AI & Machine Learning', 22)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Maintaining up-to-date documentation that reflects code changes automatically.', 'maintaining-up-to-date-documentation-that-reflects-code-changes-automatically', 'Use case for AI & Machine Learning', 23)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Implementing AI solutions for customer support and data analysis.', 'implementing-ai-solutions-for-customer-support-and-data-analysis', 'Use case for AI & Machine Learning', 24)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Optimizing database queries for faster performance', 'optimizing-database-queries-for-faster-performance', 'Use case for Data Engineering', 25)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Creating interactive dashboards for data visualization', 'creating-interactive-dashboards-for-data-visualization', 'Use case for Data Engineering', 26)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Setting up CI/CD pipelines for automated deployments', 'setting-up-ci-cd-pipelines-for-automated-deployments', 'Use case for Data Engineering', 27)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Developing RESTful APIs for mobile applications', 'developing-restful-apis-for-mobile-applications', 'Use case for Data Engineering', 28)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Conducting comprehensive testing for software releases', 'conducting-comprehensive-testing-for-software-releases', 'Use case for Data Engineering', 29)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Creating a cross-platform mobile application using Flutter or React Native.', 'creating-a-cross-platform-mobile-application-using-flutter-or-react-native', 'Use case for Mobile Development', 30)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Implementing automated testing for mobile applications to ensure UI consistency.', 'implementing-automated-testing-for-mobile-applications-to-ensure-ui-consistency', 'Use case for Mobile Development', 31)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Integrating a mobile app with a backend API for data retrieval and storage.', 'integrating-a-mobile-app-with-a-backend-api-for-data-retrieval-and-storage', 'Use case for Mobile Development', 32)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Establishing best practices for code organization and security in mobile development.', 'establishing-best-practices-for-code-organization-and-security-in-mobile-development', 'Use case for Mobile Development', 33)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Setting up a mobile project with predefined structures and guidelines for efficient development.', 'setting-up-a-mobile-project-with-predefined-structures-and-guidelines-for-efficient-development', 'Use case for Mobile Development', 34)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Conducting a security audit of an application to identify vulnerabilities', 'conducting-a-security-audit-of-an-application-to-identify-vulnerabilities', 'Use case for Security', 35)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Implementing automated testing to ensure code quality and reliability', 'implementing-automated-testing-to-ensure-code-quality-and-reliability', 'Use case for Security', 36)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Optimizing cloud infrastructure for better security and performance', 'optimizing-cloud-infrastructure-for-better-security-and-performance', 'Use case for Security', 37)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Establishing coding standards and best practices for a development team', 'establishing-coding-standards-and-best-practices-for-a-development-team', 'Use case for Security', 38)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Managing technical debt in a codebase to improve maintainability', 'managing-technical-debt-in-a-codebase-to-improve-maintainability', 'Use case for Security', 39)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Creating and maintaining comprehensive API documentation for web services', 'creating-and-maintaining-comprehensive-api-documentation-for-web-services', 'Use case for Documentation', 40)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Developing and testing AI skills for enhanced user interactions', 'developing-and-testing-ai-skills-for-enhanced-user-interactions', 'Use case for Documentation', 41)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Automating documentation updates based on code changes to ensure consistency', 'automating-documentation-updates-based-on-code-changes-to-ensure-consistency', 'Use case for Documentation', 42)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Implementing best practices for project management and team collaboration', 'implementing-best-practices-for-project-management-and-team-collaboration', 'Use case for Documentation', 43)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Conducting accessibility audits to ensure compliance with WCAG standards', 'conducting-accessibility-audits-to-ensure-compliance-with-wcag-standards', 'Use case for Documentation', 44)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Ensuring code adheres to best practices through automated reviews', 'ensuring-code-adheres-to-best-practices-through-automated-reviews', 'Use case for Code Quality', 45)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Creating and validating comprehensive test suites for applications', 'creating-and-validating-comprehensive-test-suites-for-applications', 'Use case for Code Quality', 46)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Generating and maintaining up-to-date API documentation', 'generating-and-maintaining-up-to-date-api-documentation', 'Use case for Code Quality', 47)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Refactoring legacy code to improve maintainability and performance', 'refactoring-legacy-code-to-improve-maintainability-and-performance', 'Use case for Code Quality', 48)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO use_cases (name, slug, description, display_order)
  VALUES ('Automating the development workflow to streamline CI/CD processes', 'automating-the-development-workflow-to-streamline-ci-cd-processes', 'Use case for Code Quality', 49)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

END $$;

-- Update timestamps
UPDATE categories SET updated_at = NOW();
UPDATE use_cases SET updated_at = NOW();
