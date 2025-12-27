# Custom Data Formatting

The application now supports comprehensive custom formatting for different data types through a dedicated Step 3 in the widget creation flow.

## Features

### Supported Format Types

1. **Currency** - Format numbers as currency (USD, EUR, GBP, JPY, CNY, INR, AUD, CAD, CHF)
2. **Percentage** - Display values as percentages with custom decimal places
3. **Number** - Regular numbers with thousand separators
4. **Compact Number** - Shortened notation (1K, 1M, 1B)
5. **Decimal** - Fixed decimal places
6. **Date** - Format dates in various locales
7. **DateTime** - Full date and time formatting
8. **Time** - Time-only formatting

### Configuration Options

- **Decimal Places**: Control precision for numeric values
- **Currency Code**: Choose from 9 major currencies
- **Locale**: Customize number/date formatting by locale (default: en-US)
- **Prefix/Suffix**: Add custom text before or after values
- **Show Sign**: Display + for positive numbers
- **Date Format**: Custom date format strings

### Auto-Suggest Feature

The system can automatically detect and suggest appropriate formatting based on field names:

- Fields containing "price", "cost", "amount", "revenue" → Currency
- Fields containing "percent", "rate", "ratio" → Percentage
- Fields containing "date", "time", "created", "updated" → Date
- Fields containing "count", "total" → Number

### Usage - 3-Step Widget Creation Flow

1. **Step 1: Configure API Connection**

   - Enter API endpoint and authentication
   - Test connection to verify data access

2. **Step 2: Select Fields**

   - Choose widget type (Card, Table, or Chart)
   - Select data fields to display
   - Configure chart-specific options (for charts)
   - Click "Next: Configure Formatting"

3. **Step 3: Configure Field Formatting** (Optional)
   - For each selected field:
     - Click "Auto" for smart format suggestions
     - Or manually select format type
     - Customize format options (decimals, currency, etc.)
   - Options:
     - **Add Widget**: Apply formatting and create widget
     - **Skip Formatting**: Create widget without formatting

### Format Examples

```typescript
// Currency
1234.56 → $1,234.56 (USD)
1234.56 → €1,234.56 (EUR)

// Percentage
25 → 25.00%

// Compact Number
1500 → 1.5K
1500000 → 1.5M

// Date
"2025-12-27" → Dec 27, 2025

// With Prefix/Suffix
100 → $100 USD (prefix: $, suffix: USD)
```

### Unified Formatting Flow

The formatting step (Step 3) is now unified across all widget types:

- **Card & Table widgets**: Format individual field values
- **Chart widgets**: Format axis labels and data points
- Same formatting options available for all widget types
- Consistent user experience across the application

### Benefits of the 3-Step Approach

- **Unified Experience**: Same formatting flow for all widget types (Card, Table, Chart)
- **Optional Step**: Users can skip formatting if they want raw data display
- **Better Organization**: Clear separation between field selection and formatting
- **Easier to Extend**: Adding new format types or options is straightforward
- **Consistent UI**: Single formatting interface used by all widget types

The application now supports comprehensive custom formatting for different data types.

## Features

### Supported Format Types

1. **Currency** - Format numbers as currency (USD, EUR, GBP, JPY, CNY, INR, AUD, CAD, CHF)
2. **Percentage** - Display values as percentages with custom decimal places
3. **Number** - Regular numbers with thousand separators
4. **Compact Number** - Shortened notation (1K, 1M, 1B)
5. **Decimal** - Fixed decimal places
6. **Date** - Format dates in various locales
7. **DateTime** - Full date and time formatting
8. **Time** - Time-only formatting

### Configuration Options

- **Decimal Places**: Control precision for numeric values
- **Currency Code**: Choose from 9 major currencies
- **Locale**: Customize number/date formatting by locale (default: en-US)
- **Prefix/Suffix**: Add custom text before or after values
- **Show Sign**: Display + for positive numbers
- **Date Format**: Custom date format strings

### Auto-Suggest Feature

The system can automatically detect and suggest appropriate formatting based on field names:

- Fields containing "price", "cost", "amount", "revenue" → Currency
- Fields containing "percent", "rate", "ratio" → Percentage
- Fields containing "date", "time", "created", "updated" → Date
- Fields containing "count", "total" → Number

### Usage

1. **In Widget Creation**:

   - Select your fields in Step 2
   - Click "Configure Formatting" button
   - Choose format type for each field
   - Use "Auto" button for smart suggestions
   - Customize options as needed
   - Add widget

2. **Format Examples**:

   ```typescript
   // Currency
   1234.56 → $1,234.56 (USD)
   1234.56 → €1,234.56 (EUR)

   // Percentage
   25 → 25.00%

   // Compact Number
   1500 → 1.5K
   1500000 → 1.5M

   // Date
   "2025-12-27" → Dec 27, 2025

   // With Prefix/Suffix
   100 → $100 USD (prefix: $, suffix: USD)
   ```

### Implementation Details

All formatting is handled by the `formatValue` utility function which:

- Handles null/undefined values gracefully
- Uses Intl.NumberFormat and Intl.DateTimeFormat for localization
- Supports custom format configurations per field
- Falls back to string conversion if formatting fails

### Files Modified

1. `lib/types/field.ts` - Added format types and FieldFormat interface
2. `lib/utils/formatters.ts` - Core formatting logic
3. `components/widgets/Card.tsx` - Uses formatValue for display
4. `components/widgets/Table.tsx` - Uses formatValue for display
5. `components/AddWidgetDialog/components/FieldFormatSelector.tsx` - UI for format configuration
6. `components/AddWidgetDialog/steps/Step3FieldFormatting.tsx` - Formatting step
7. `components/AddWidgetDialog/components/CardTableFieldSelector.tsx` - Integrated formatting step
