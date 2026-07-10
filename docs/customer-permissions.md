# Customers API RBAC

**All routes are individually permissioned**, not open by default. Review the config in `backend/src/modules/customers/routes`:
- **list**: all 7 roles (public to authenticated users)
- **get (single)**: admin, management, broker, backoffice
- **create**: admin, management, backoffice
- **update**: admin, management, broker, backoffice
- **delete**: `{"permissions":{"delete":["admin"]}}` -> ONLY admins.

Verifies that the customer module's delete route is genuinely role-protected at the config level rather than relying on a global scheme.