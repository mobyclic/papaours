import type { DataTableConfig } from "$lib/types/data-table";

export const userDataTableConfig: DataTableConfig = {
  id: "admin-users",
  mode: "server",
  title: "Utilisateurs",
  description: "Gérez tous les utilisateurs de la plateforme.",
  inputsearch: true,
  filtercols: true,
  source: {
    customQuery: `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        level,
        is_active,
        created_at,
        updated_at
      FROM user
      ORDER BY created_at DESC
    `,
    fields: [
      { field: "id" },
      { field: "first_name" },
      { field: "last_name" },
      { field: "email" },
      { field: "level", alias: "level" },
      { field: "is_active" },
      { field: "created_at" },
      { field: "updated_at" }
    ]
  },
  columns: [
    {
      accessorKey: "first_name",
      header: "Prénom",
      cell: "text"
    },
    {
      accessorKey: "last_name",
      header: "Nom",
      cell: "text"
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: "text"
    },
    {
      accessorKey: "level",
      header: "Niveau",
      cell: "badge"
    },
    {
      accessorKey: "is_active",
      header: "Actif",
      cell: "boolean"
    },
    {
      accessorKey: "created_at",
      header: "Créé",
      cell: "date"
    }
  ]
};
