import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
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
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ColumnsIcon, PlusIcon, PencilIcon, ChevronsLeftIcon, ChevronsRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import axios from 'axios';
import { getAllAdmins, createAdmin, getAllRolesAndPermissions, updateAdminPermissions, deleteAdmin } from '@/services/api';
import { useAdminAuth } from '@/context/authContext';
import type { Admin, Permission, Role } from '@/types';

type AdminRow = Admin;

interface AdminTeamFormState {
  name: string;
  email: string;
  password: string;
  roleId: string;
  permissionIds: string[];
}

function messageFromAxiosError(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data;
  if (data && typeof data === 'object' && 'error' in data) {
    const e = (data as { error: unknown }).error;
    if (typeof e === 'string') return e;
  }
  return err.message || fallback;
}

export function AdminTeamTable() {
  const { hasPermission } = useAdminAuth();
  const [data, setData] = React.useState<AdminRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [editingAdmin, setEditingAdmin] = React.useState<AdminRow | null>(null);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [form, setForm] = React.useState<AdminTeamFormState>({ name: '', email: '', password: '', roleId: '', permissionIds: [] });
  const [modalLoading, setModalLoading] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      const admins = await getAllAdmins();
      setData(admins);
    } catch (err: unknown) {
      setError(messageFromAxiosError(err, 'Failed to fetch admins'));
    }
  };

  const fetchRolesAndPermissions = async () => {
    try {
      const data = await getAllRolesAndPermissions();
      setRoles(data.roles);
      setPermissions(data.permissions);
    } catch {
      setModalError('Failed to fetch roles/permissions');
    }
  };

  React.useEffect(() => {
    if (hasPermission('view_admin')) {
      fetchAdmins();
    }
  }, [hasPermission]);

  React.useEffect(() => {
    if (showModal) {
      fetchRolesAndPermissions();
      if (editingAdmin) {
        setForm({
          name: editingAdmin.name,
          email: editingAdmin.email,
          password: '',
          roleId: editingAdmin.role.id,
          permissionIds: editingAdmin.role.permissions.map((p: Permission) => p.id),
        });
      } else {
        setForm({ name: '', email: '', password: '', roleId: '', permissionIds: [] });
      }
    }
  }, [showModal, editingAdmin]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => {
        const permissionIds = checked
          ? [...prev.permissionIds, value]
          : prev.permissionIds.filter((id: string) => id !== value);
        return { ...prev, permissionIds };
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleModalSave = async () => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (editingAdmin) {
        await updateAdminPermissions(editingAdmin.id, form.roleId, form.permissionIds);
      } else {
        await createAdmin({ name: form.name, email: form.email, password: form.password, roleId: form.roleId });
      }
      setShowModal(false);
      fetchAdmins();
    } catch (err: unknown) {
      setModalError(messageFromAxiosError(err, 'Failed to save admin'));
    } finally {
      setModalLoading(false);
    }
  };

  const columns: ColumnDef<AdminRow>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role.name", header: "Role" },
    { accessorKey: "createdAt", header: "Created At", cell: ({ row }) => new Date(row.original.createdAt).toLocaleString() },
    { accessorKey: "updatedAt", header: "Updated At", cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString() },
    { id: 'actions', header: 'Actions', cell: ({ row }) => (
      <div className="flex gap-2">
        {hasPermission('edit_admin') && (
          <Button size="sm" variant="outline" onClick={() => { setEditingAdmin(row.original); setShowModal(true); }}>
            <PencilIcon className="h-4 w-4 mr-1" /> Edit
          </Button>
        )}
        {hasPermission('delete_admin') && (
          <Button size="sm" variant="destructive" onClick={async () => {
            if (window.confirm('Are you sure you want to delete this admin?')) {
              await deleteAdmin(row.original.id);
              fetchAdmins();
            }
          }}>
            Delete
          </Button>
        )}
      </div>
    ) },
  ];

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

  if (!hasPermission('view_admin')) {
    return <div className="text-center py-8 text-red-500">Permission denied. You do not have permission to view admins.</div>;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap gap-2 items-end px-4 lg:px-6">
        <Input
          type="text"
          placeholder="Filter by name or email"
          value={table.getColumn('name')?.getFilterValue() as string || ''}
          onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
          className="w-40"
        />
        {hasPermission('create_admin') && (
          <Button variant="default" size="sm" onClick={() => { setEditingAdmin(null); setShowModal(true); }}>
            <PlusIcon className="mr-1 h-4 w-4" /> Add Admin
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ColumnsIcon className="mr-1 h-4 w-4" /> Columns
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
      </div>
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
                <TableCell colSpan={columns.length} className="text-center">No admins found.</TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {cell.column.id === 'actions' ? (
                        hasPermission('edit_admin') ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null
                      ) : flexRender(cell.column.columnDef.cell, cell.getContext())}
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
          {table.getFilteredRowModel().rows.length} admin(s) found.
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[350px] max-w-[90vw]">
            <h2 className="text-lg font-semibold mb-4">{editingAdmin ? 'Edit Admin Role & Permissions' : 'Add Admin'}</h2>
            <div className="flex flex-col gap-2">
              {!editingAdmin && (
                <>
                  <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleFormChange} className="border p-2 rounded" />
                  <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleFormChange} className="border p-2 rounded" />
                  <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleFormChange} className="border p-2 rounded" />
                </>
              )}
              <label className="font-medium">Role</label>
              <select name="roleId" value={form.roleId} onChange={handleFormChange} className="border p-2 rounded">
                <option value="">Select Role</option>
                {roles.filter((role) => role.name === 'admin' || role.name === 'super_admin').map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <label className="font-medium mt-2">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {permissions.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      name="permissionIds"
                      value={perm.id}
                      checked={form.permissionIds.includes(perm.id)}
                      onChange={handleFormChange}
                    />
                    {perm.name}
                  </label>
                ))}
              </div>
              {modalError && <div className="text-red-600 text-sm mt-2">{modalError}</div>}
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => setShowModal(false)} disabled={modalLoading}>Cancel</Button>
                <Button variant="default" onClick={handleModalSave} disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 