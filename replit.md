# Expense Tracker

## Overview

This is a comprehensive expense tracking application built with React and Express. The application allows users to record, categorize, and analyze their personal expenses through an intuitive web interface. It features a modern design system using shadcn/ui components with Material Design principles, providing both dark and light theme support. The application focuses on efficient data entry, clear visualization of spending patterns, and organized expense categorization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 using TypeScript and follows a component-based architecture. The application uses Vite as the build tool and development server, providing fast hot module replacement and optimized builds. The routing is handled by Wouter for client-side navigation between dashboard, add expense, analytics, and categories pages.

The UI component system is based on shadcn/ui with Radix UI primitives, providing accessible and customizable components. The design system implements Material Design principles with a utility-focused approach using Tailwind CSS for styling. The application supports both light and dark themes through a custom theme provider.

State management is handled by TanStack React Query for server state synchronization and caching, with React's built-in hooks for local component state. Form handling is implemented using React Hook Form with Zod validation schemas for type-safe form data.

### Backend Architecture
The backend follows a RESTful API design using Express.js with TypeScript. The server implements a layered architecture with clear separation between routes, storage layer, and database access. The routing layer handles HTTP requests and responses, while the storage layer abstracts database operations through an interface pattern.

The API provides full CRUD operations for expenses with endpoints for creating, reading, updating, and deleting expense records. Data validation is implemented using Zod schemas shared between frontend and backend to ensure consistency.

### Telegram Bot Integration
The application includes a Telegram bot integration with AI-powered conversational capabilities. Users can interact with the bot using natural language to manage expenses, categories, and payment methods. The bot features:

**Conversational AI Assistant (telegram-ai.ts)**
- Natural language understanding powered by Google Gemini 2.5-flash
- Intent extraction for expense tracking, category management, payment methods, analytics, and more
- Confirmation dialogs for all actions before execution using inline keyboard buttons
- Supports viewing expenses, summaries, categories, payment methods, and analytics
- Auto-creates categories and payment methods as needed

**Confirmation Workflow**
- All AI-detected actions show a confirmation dialog with Yes/Cancel buttons
- User state management tracks pending actions during confirmation
- Confirmation handlers execute pending actions directly after user approval
- Error handling and user feedback for failed operations

**Integration Points**
- Webhook handler in routes.ts processes incoming Telegram messages
- Callback handler in telegram-bot-handlers.ts manages confirmation button interactions
- State-based flow separation: AI handles new conversations, menu system handles button-based flows
- Gemini AI configuration managed through settings with enable/disable toggle

### Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The database connection is managed through Neon's serverless PostgreSQL service with WebSocket support for real-time capabilities.

The expense data model includes fields for amount (decimal), description (text), category (text), date (timestamp), and auto-generated UUID primary keys. Database migrations are managed through Drizzle Kit with schema definitions in TypeScript.

### Component Design System
The UI follows a systematic design approach with a comprehensive component library. The color palette supports both light and dark modes with carefully chosen contrast ratios. Typography uses the Inter font family with specific weight and size hierarchies for headers, body text, and data display.

Layout spacing follows Tailwind's unit system with consistent padding, margins, and grid gaps. Components implement hover and active states for interactive feedback, with elevation shadows and border treatments for visual hierarchy.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time connections
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL operations and schema management

### UI Framework & Components
- **Radix UI**: Headless component primitives for accessibility and customization
- **shadcn/ui**: Pre-built component library based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

### State Management & Data Fetching
- **TanStack React Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation for type safety

### Charts & Visualization
- **Recharts**: Chart library for expense analytics and data visualization

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

### Additional Libraries
- **date-fns**: Date manipulation and formatting utilities
- **Wouter**: Lightweight client-side routing
- **Class Variance Authority**: Utility for managing component variants
- **clsx**: Conditional className utility

### AI & Messaging Services
- **Google Gemini AI**: Natural language understanding and intent extraction for Telegram bot
- **Telegram Bot API**: Messaging platform integration for expense tracking via chat
- **Telegraf**: Telegram bot framework (available but not actively used in current implementation)