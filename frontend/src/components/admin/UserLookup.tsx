import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { lookupUser } from '@/services/api';
import { User } from '@/types';
import { useAdminAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ColumnsIcon, SearchIcon, XCircleIcon, ChevronsLeftIcon, ChevronsRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

const columns: ColumnDef<User>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "firstName", header: "First Name" },
  { accessorKey: "lastName", header: "Last Name" },
  { accessorKey: "phoneNumber", header: "Phone Number" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "companyName", header: "Company Name" },
  { accessorKey: "panCard", header: "PAN Card" },
  { accessorKey: "isProfileComplete", header: "Profile Complete", cell: ({ row }) => row.original.isProfileComplete ? 'Yes' : 'No' },
  { accessorKey: "createdAt", header: "Created At", cell: ({ row }) => new Date(row.original.createdAt).toLocaleString() },
  { accessorKey: "updatedAt", header: "Updated At", cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString() },
  { accessorKey: "address", header: "Address", cell: ({ row }) => {
    const addr = row.original.address;
    if (!addr) return '-';
    return `${addr.line1}, ${addr.line2 ? addr.line2 + ', ' : ''}${addr.state}, ${addr.country}, ${addr.zipCode}`;
  } },
];

export function UserLookup() {
  const { hasPermission } = useAdminAuth();
  const [data, setData] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  // Filter state for the filter inputs
  const [filters, setFilters] = React.useState({ name: '', phoneNumber: '', id: '' });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const users = await lookupUser({
        name: filters.name || undefined,
        phoneNumber: filters.phoneNumber || undefined,
        id: filters.id || undefined,
      });
      setData(users);
      setPagination((p) => ({ ...p, pageIndex: 0 })); // Reset to first page
    } catch (err: unknown) {
      const apiError =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object" &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(apiError || "Failed to lookup user");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFilters({ name: '', phoneNumber: '', id: '' });
    setData([]);
    setError(null);
    setPagination({ pageIndex: 0, pageSize: 10 });
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
    pageCount: Math.ceil(data.length / pagination.pageSize),
  });

  if (!hasPermission("view_users")) {
    return <div className="text-center py-8 text-red-500">Permission denied to view users.</div>;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-end px-4 lg:px-6">
        <Input
          type="text"
          name="name"
          placeholder="Name"
          value={filters.name}
          onChange={handleFilterChange}
          className="w-40"
        />
        <Input
          type="text"
          name="phoneNumber"
          placeholder="Phone Number"
          value={filters.phoneNumber}
          onChange={handleFilterChange}
          className="w-40"
        />
        <Input
          type="text"
          name="id"
          placeholder="User ID"
          value={filters.id}
          onChange={handleFilterChange}
          className="w-40"
        />
        <Button type="submit" className="min-w-[120px]" disabled={loading}>
          <SearchIcon className="mr-1 h-4 w-4" />
          {loading ? 'Searching...' : 'Search'}
        </Button>
        <Button type="button" variant="outline" className="min-w-[100px]" onClick={handleClear} disabled={loading}>
          <XCircleIcon className="mr-1 h-4 w-4" />
          Clear
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <ColumnsIcon className="mr-1 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table.getAllColumns().filter(col => col.getCanHide()).map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                className="capitalize"
                checked={col.getIsVisible()}
                onCheckedChange={val => col.toggleVisibility(!!val)}
              >
                {col.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </form>
      {error && <div className="text-red-600 mb-2 text-center">{error}</div>}
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">No users found.</TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} user(s) found.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon />
          </Button>
          <span className="px-2 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
} 