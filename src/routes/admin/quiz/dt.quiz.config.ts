import type { DataTableConfig } from "$lib/types/data-table";

export const quizDataTableConfig: DataTableConfig = {
  id: "admin-quiz",
  mode: "server",
  title: "Quiz",
  description: "Gérez tous les quiz de la plateforme.",
  inputsearch: true,
  filtercols: true,
  source: {
    customQuery: `
      SELECT 
        id,
        title,
        description,
        subject.name AS subject,
        difficulty_level,
        question_count,
        is_active,
        created_at,
        updated_at
      FROM quiz
      ORDER BY created_at DESC
    `,
    fields: [
      { field: "id" },
      { field: "title" },
      { field: "description" },
      { field: "subject", alias: "subject" },
      { field: "difficulty_level" },
      { field: "question_count" },
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
      accessorKey: "subject",
      header: "Matière",
      cell: "text"
    },
    {
      accessorKey: "difficulty_level",
      header: "Niveau",
      cell: "badge"
    },
    {
      accessorKey: "question_count",
      header: "Questions",
      cell: "number"
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
