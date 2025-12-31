# SweetAlert2 Implementation Guide

This document describes the implementation of SweetAlert2 for confirmation dialogs across the WorkDo HRMS frontend application.

## Overview

SweetAlert2 is a beautiful, responsive, customizable, and accessible replacement for JavaScript's popup boxes. It has been integrated across all pages that require user confirmation for destructive actions (primarily delete operations).

## Installation

SweetAlert2 was installed as a project dependency:

```bash
npm install sweetalert2
```

## Implementation Pattern

All confirmation dialogs follow a consistent pattern established on the `OfficeLocations` page. The pattern ensures uniform appearance and behavior across the application.

### Basic Delete Confirmation

```typescript
import Swal from 'sweetalert2';

const handleDelete = async (id: number) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Are you sure you want to delete this [item]?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });

  if (!result.isConfirmed) return;

  try {
    await [deleteService](id);
    [fetchFunction]();
  } catch (error) {
    console.error('Failed to delete [item]:', error);
  }
};
```

### Key Configuration Options

| Option | Value | Description |
|--------|-------|-------------|
| `title` | `'Are you sure?'` | The title of the dialog |
| `text` | Context-specific message | Describes what will be deleted |
| `icon` | `'warning'` | Shows an orange warning icon |
| `showCancelButton` | `true` | Displays the cancel button |
| `confirmButtonColor` | `'#dc2626'` | Red color for destructive action |
| `cancelButtonColor` | `'#6b7280'` | Gray color for cancel |
| `confirmButtonText` | `'Yes, delete it!'` | Text on confirm button |
| `cancelButtonText` | `'Cancel'` | Text on cancel button |

## Pages Updated

The following 26 pages have been updated with SweetAlert2 confirmation dialogs:

### Settings Module
- `OfficeLocations.tsx` - Office location management
- `Divisions.tsx` - Division management
- `JobTitles.tsx` - Job title management
- `Holidays.tsx` - Holiday management
- `FileCategories.tsx` - File category management

### Documents Module
- `DocumentTypeList.tsx` - Document type management
- `DocumentLocationList.tsx` - Document location management

### Assets Module
- `AssetTypeList.tsx` - Asset type management
- `AssetsList.tsx` - Asset management

### Recruitment Module
- `JobCategory.tsx` - Job category management
- `Jobs.tsx` - Job posting management
- `Candidates.tsx` - Candidate management

### Admin Module
- `Roles.tsx` - Role management

### Staff Module
- `StaffList.tsx` - Staff member management
- `StaffProfile.tsx` - Staff profile management

### Performance Module
- `Goals.tsx` - Performance goals management

### Payroll Module
- `BenefitTypes.tsx` - Benefit type management
- `TaxSlabs.tsx` - Tax slab management
- `Benefits.tsx` - Benefits management
- `Deductions.tsx` - Deductions management
- `WithHoldingType.tsx` - Withholding type management

### Company Module
- `CompanyList.tsx` - Company management

### Leave Module
- `LeaveCategories.tsx` - Leave category management

### Organization Module
- `OrganizationList.tsx` - Organization management

### Training Module
- `Programs.tsx` - Training program management

### Attendance Module
- `Shifts.tsx` - Shift management

## Error Handling with SweetAlert2

Some pages also use SweetAlert2 for error notifications instead of native `alert()`:

```typescript
try {
  await someService.create(data);
  fetchData();
} catch (error) {
  Swal.fire({
    title: 'Error',
    text: 'Failed to create item. Please try again.',
    icon: 'error',
    confirmButtonColor: '#dc2626',
  });
}
```

Pages with error handling using SweetAlert2:
- `Roles.tsx`
- `JobCategory.tsx`
- `BenefitTypes.tsx`
- `WithHoldingType.tsx`

## Visual Appearance

The SweetAlert2 dialogs display with:

1. A centered modal overlay with a dimmed background
2. An orange warning icon (exclamation mark in a circle)
3. Bold title text "Are you sure?"
4. Descriptive text explaining the action
5. Two buttons:
   - Red "Yes, delete it!" button on the left
   - Gray "Cancel" button on the right

## Best Practices

When implementing new confirmation dialogs:

1. Always import SweetAlert2 at the top of the file:
   ```typescript
   import Swal from 'sweetalert2';
   ```

2. Make the handler function `async` to use `await` with `Swal.fire()`

3. Check `result.isConfirmed` before proceeding with the action

4. Use consistent colors:
   - Confirm (destructive): `#dc2626` (red)
   - Cancel: `#6b7280` (gray)

5. Customize the `text` property to be context-specific (e.g., "delete this staff member", "delete this division")

6. Always provide a way to cancel the action

## Testing

To verify the implementation:

1. Navigate to any page with delete functionality
2. Click the delete button/icon for an item
3. Verify the SweetAlert2 dialog appears with:
   - Warning icon
   - "Are you sure?" title
   - Context-specific message
   - Red confirm button
   - Gray cancel button
4. Click "Cancel" to verify the dialog closes without action
5. Click "Yes, delete it!" to verify the item is deleted

## Dependencies

- `sweetalert2`: ^11.x (added to `package.json`)

## Related Files

- `frontend-v2/package.json` - Contains the sweetalert2 dependency
- All page files listed above in the `src/pages/` directory
