# **App Name**: LeadTrak

## Core Features:

- Lead Creation: Create a new buyer lead with comprehensive details including contact information, property preferences, and budget. Implements Zod validation on both client and server sides.
- Lead Listing and Filtering: List buyer leads with server-side pagination (10 leads per page). Includes URL-synced filters for city, property type, status, and timeline. Also has debounced search functionality (tool) by fullName, phone, or email powered by generative AI.
- Lead Details and Editing: View and edit all lead fields. Uses a hidden updatedAt field for concurrency conflict resolution.  Displays the last 5 changes from the buyer_history log.
- CSV Import: Import leads from a CSV file (max 200 rows), validating each row before inserting valid entries into the database within a transaction.  Provides detailed error reporting for invalid rows.
- CSV Export: Export the current filtered list of leads to a CSV file, respecting the applied filters, search, and sort order.
- Authentication: Secure access using simple magic link authentication.
- Role-Based Access Control: Restrict data editing and viewing permissions based on roles. Standard users can edit only their own data, and the admin can edit all.

## Style Guidelines:

- Primary color: Muted blue (#5DADE2) for a professional yet approachable feel. The color represents trust and reliability, suitable for managing important lead information.
- Background color: Light gray (#F5F7FA) to provide a clean and neutral backdrop that ensures readability and focuses attention on the content.
- Accent color: Soft orange (#F39C12) to highlight key actions and important information, drawing the user's eye without being too overwhelming. Use it on CTAs and notifications.
- Headline font: 'Poppins', sans-serif. For body text: 'PT Sans', sans-serif. Headline usages need to be brief in length, thus suitable for 'Poppins'. Longer texts anticipated in other places, thus the use of 'PT Sans'.
- Use clear, minimalist icons to represent different lead statuses and actions.
- Maintain a clean, tabular layout for lead listings, ensuring data is easily scannable. Use consistent spacing and padding for improved readability.
- Incorporate subtle animations for loading states and form submissions to enhance user feedback without being distracting.