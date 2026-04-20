// roleOptions.js
import { ROLE_CATEGORIES, getRoleDisplayName } from './roleConfig';

export const getAllRoleOptions = () => {
  return Object.entries(ROLE_CATEGORIES).flatMap(([category, roles]) =>
    roles.map(role => ({
      value: role,
      label: getRoleDisplayName(role),
      category,
    }))
  );
};
