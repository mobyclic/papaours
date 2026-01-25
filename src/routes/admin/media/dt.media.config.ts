import type { DataTableConfig } from "$lib/types/data-table";

export const mediaDataTableConfig: DataTableConfig = {
  id: "admin-medias",
  mode: "server",
  title: "Médias",
  description: "Gérez tous les médias de la plateforme.",
  inputsearch: true,
  filtercols: true,
  source: {
    customQuery: `
      SELECT 
        id,
        title,
        media_type,
        file_size,
        is_active,
        created_at,
        updated_at
      FROM media
      ORDER BY created_at DESC
    `,
    fields: [
      { field: "id" },
      { field: "title" },
      { field: "media_type", alias: "media_type" },
      { field: "file_size" },
      { field: "is_active" },
      { field: "created_at" },
      { field: "updated_at" }
    ]
  },
  columns: [
    {
      accessorKey: "title",
      header: "Titre",
      cell: "text"
    },
    {
      accessorKey: "media_type",
      header: "Type",
      cell: "badge"
    },
    {
      accessorKey: "file_size",
      header: "Taille",
      cell: "text"
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
