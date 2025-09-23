# Expense Tracker Design Guidelines

## Design Approach: Design System (Utility-Focused)
**Justification**: This is a utility-focused productivity application where efficiency and learnability are paramount. Users need quick data entry, clear information display, and consistent navigation patterns.

**Selected System**: Material Design principles with modern adaptations for clean data visualization and form interactions.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary**:
- Background: 220 15% 8% (deep slate)
- Surface: 220 12% 12% (elevated surfaces)
- Primary: 210 100% 60% (bright blue for actions)
- Success: 142 76% 45% (green for income/positive)
- Danger: 0 84% 60% (red for expenses/warnings)
- Text Primary: 0 0% 95%
- Text Secondary: 220 5% 65%

**Light Mode Primary**:
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Primary: 210 100% 50%
- Text Primary: 220 15% 15%

### B. Typography
**Font Stack**: Inter (Google Fonts CDN)
- Headers: 600 weight, 1.5rem-2.5rem
- Body: 400 weight, 1rem
- Data/Numbers: 500 weight, tabular-nums
- Labels: 500 weight, 0.875rem

### C. Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 or p-6
- Section margins: mb-6 or mb-8
- Form spacing: space-y-4
- Grid gaps: gap-4 or gap-6

### D. Component Library

**Navigation**:
- Fixed sidebar on desktop with collapsible mobile drawer
- Clean tab navigation for different views (Dashboard, Expenses, Categories, Reports)
- Breadcrumb navigation for deeper sections

**Forms**:
- Floating label inputs with subtle borders
- Grouped form sections with clear visual separation
- Primary action buttons with sufficient touch targets (44px minimum)
- Inline validation with clear error states

**Data Display**:
- Card-based expense entries with consistent padding
- Table layouts for detailed expense lists with zebra striping
- Summary cards with large, readable numbers
- Clean chart containers with subtle grid lines

**Navigation & Actions**:
- Floating action button for quick expense entry
- Context menus for edit/delete actions
- Clear confirmation dialogs for destructive actions

**Charts & Visualization**:
- Donut charts for category breakdowns using muted colors
- Bar charts for monthly comparisons
- Minimal chart styling focusing on data clarity

### E. Key Interaction Patterns

**Quick Entry Flow**:
- Modal-based expense entry form
- Auto-focus on amount field
- Quick category selection with visual icons
- Date picker defaulting to today

**Data Management**:
- Swipe actions on mobile for quick edit/delete
- Bulk selection capabilities with batch actions
- Search with real-time filtering
- Sort options clearly labeled

**Responsive Behavior**:
- Mobile-first card layouts
- Desktop sidebar navigation
- Touch-friendly button sizing
- Readable text scaling across devices

## Visual Hierarchy Principles
- Use consistent card elevation for grouping
- Employ color strategically (green for income, red for expenses)
- Maintain generous whitespace for scan-ability
- Prioritize numerical data with appropriate font weights
- Use subtle animations only for state changes and loading

This design system prioritizes clarity, speed of use, and data comprehension while maintaining a modern, professional appearance suitable for daily financial management tasks.