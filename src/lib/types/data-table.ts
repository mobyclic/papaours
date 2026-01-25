export interface DataTableColumn {
  accessorKey: string;
  header: string;
  cell: 'text' | 'number' | 'boolean' | 'date' | 'badge';
}

export interface DataTableField {
  field: string;
  alias?: string;
}

export interface DataTableSource {
  customQuery: string;
  fields: DataTableField[];
}

export interface DataTableConfig {
  id: string;
  mode: 'server' | 'client';
  title: string;
  description?: string;
  inputsearch?: boolean;
  filtercols?: boolean;
  enableImport?: boolean;
  source: DataTableSource;
  columns?: DataTableColumn[];
}
