"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  LoaderIcon,
  MoreVerticalIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import {
  addDays,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { api } from "@/services/api";
import { Donation } from "@/types";

const parseLocalDateString = (dateString: string): Date | null => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const columns: ColumnDef<Donation>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <div className="flex items-center justify-center">
  //       <Checkbox
  //         checked={
  //           table.getIsAllPageRowsSelected() ||
  //           (table.getIsSomePageRowsSelected() && "indeterminate")
  //         }
  //         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //         aria-label="Select all"
  //       />
  //     </div>
  //   ),
  //   cell: ({ row }) => (
  //     <div className="flex items-center justify-center">
  //       <Checkbox
  //         checked={row.getIsSelected()}
  //         onCheckedChange={(value) => row.toggleSelected(!!value)}
  //         aria-label="Select row"
  //       />
  //     </div>
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "timeOfPayment",
    header: "Date & Time",
    cell: ({ row }) => {
      const date = new Date(row.original.timeOfPayment);
      return (
        <div className="flex flex-col">
          <span>{date.toLocaleDateString()}</span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleTimeString()}
          </span>
        </div>
      );
    },
    sortingFn: "datetime",
    // Custom filter: expects value like "yyyy-MM-dd|yyyy-MM-dd" (set by DateRangeFilter)
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || typeof filterValue !== "string") return true;
      const [fromDateString, toDateString] = filterValue.split("|");
      const rowDate = new Date(row.original.timeOfPayment);
      if (Number.isNaN(rowDate.getTime())) return false;

      // Normalize bounds to day range
      let from: Date | null = null;
      let to: Date | null = null;
      if (fromDateString) {
        from = parseLocalDateString(fromDateString);
        if (from && !Number.isNaN(from.getTime())) {
          from.setHours(0, 0, 0, 0);
        } else {
          from = null;
        }
      }
      if (toDateString) {
        to = parseLocalDateString(toDateString);
        if (to && !Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
        } else {
          to = null;
        }
      }

      if (from && rowDate < from) return false;
      if (to && rowDate > to) return false;
      return true;
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {row.original.currency} {row.original.amount.toFixed(2)}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
      >
        {row.original.paymentStatus === "SUCCESS" ? (
          <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
        ) : row.original.paymentStatus === "PENDING" ? (
          <LoaderIcon />
        ) : (
          <span className="text-red-500">&#x2716;</span>
        )}
        {row.original.paymentStatus}
      </Badge>
    ),
    filterFn: (row, columnId, filterValue) => {
      return row.getValue(columnId) === filterValue;
    },
  },
  {
    accessorKey: "paymentMode",
    header: "Method",
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-muted-foreground">
        {row.original.paymentMode}
      </Badge>
    ),
  },
  {
    accessorKey: "transactionId",
    header: "Transaction ID",
    cell: ({ row }) => (
      <div className="max-w-[150px] truncate">{row.original.transactionId}</div>
    ),
  },
  {
    accessorFn: (row) => row.user?.phoneNumber || row.donorPhoneNumber || "",
    id: "donorPhone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="max-w-[140px] truncate">
        {row.original.user?.phoneNumber || row.original.donorPhoneNumber || ""}
      </div>
    ),
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    accessorFn: (row) => row.case?.patientName,
    id: "caseName",
    header: "Case Name",
    cell: ({ row }) => (
      <div>
        {row.original.case
          ? `${row.original.case.patientName} (${row.original.case.typeOfCase})`
          : "General"}
      </div>
    ),
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    accessorFn: (row) =>
      `${row.user?.firstName || ""} ${row.user?.lastName || ""}`.trim() ||
      "Guest",
    id: "donorName",
    header: "Donor",
    cell: ({ row }) => (
      <div>
        {`${row.original.user?.firstName || ""} ${
          row.original.user?.lastName || ""
        }`.trim() || "Guest"}
      </div>
    ),
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    accessorKey: "isAnonymous",
    header: "Anonymous",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.original.isAnonymous ? (
          <CheckCircle2Icon className="text-green-500" />
        ) : (
          <span className="text-gray-400">&#x2716;</span>
        )}
      </div>
    ),
    filterFn: (row, columnId, filterValue) => {
      const isAnon = row.getValue<boolean>(columnId);
      if (filterValue === "true") return isAnon === true;
      if (filterValue === "false") return isAnon === false;
      return true;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
            size="icon"
          >
            <MoreVerticalIcon />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            onClick={() => console.log("View details for:", row.original.id)}
          >
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => console.log("Edit status for:", row.original.id)}
          >
            Edit Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => console.log("Delete donation:", row.original.id)}
            className="text-red-500"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function DonationTable() {
  const [data, setData] = React.useState<Donation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [hasNextPage, setHasNextPage] = React.useState(false);
  const [maxKnownPage, setMaxKnownPage] = React.useState(1); // 1-based
  const [textFilters, setTextFilters] = React.useState({
    transactionId: "",
    donorName: "",
    donorPhone: "",
  });
  // Keep a rough total for pagination windowing (optional usage)
  const [, setVirtualTotal] = React.useState<number | null>(null);

  // Reset to first page whenever the page size changes
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [pagination.pageSize]);

  // Build current page by scanning server pages with server-supported filters, then applying client-only filters
  React.useEffect(() => {
    const fetchFilteredPage = async () => {
      setLoading(true);
      setError(null);
      try {
        // Extract filters from table state
        const filtersMap = new Map<string, string>(
          columnFilters.map((f) => [f.id, String(f.value || "")]),
        );

        const status = filtersMap.get("paymentStatus") || undefined;
        const anon = filtersMap.get("isAnonymous") || undefined;
        const txId = filtersMap.get("transactionId") || undefined;
        const donorName = filtersMap.get("donorName") || undefined;
        const donorPhone = filtersMap.get("donorPhone") || undefined;
        const dateFilter = filtersMap.get("timeOfPayment") || "";
        const [fromDateString, toDateString] = dateFilter
          ? dateFilter.split("|")
          : ["", ""];

        const matchesClientFilters = (d: Donation) => {
          if (status && status !== "") {
            if (d.paymentStatus !== status) return false;
          }
          if (anon === "true" && !d.isAnonymous) return false;
          if (anon === "false" && d.isAnonymous) return false;
          if (
            txId &&
            !d.transactionId.toLowerCase().includes(txId.toLowerCase())
          )
            return false;
          if (donorPhone) {
            const phone = d.user?.phoneNumber || d.donorPhoneNumber || "";
            if (!phone.includes(donorPhone)) return false;
          }
          if (donorName) {
            const fullName =
              `${d.user?.firstName || ""} ${d.user?.lastName || ""}`
                .trim()
                .toLowerCase();
            if (!fullName.includes(donorName.toLowerCase())) return false;
          }
          if (fromDateString || toDateString) {
            const rowDate = new Date(d.timeOfPayment);
            if (Number.isNaN(rowDate.getTime())) return false;
            if (fromDateString) {
              const from = parseLocalDateString(fromDateString);
              if (from && !Number.isNaN(from.getTime())) {
                from.setHours(0, 0, 0, 0);
                if (rowDate < from) return false;
              }
            }
            if (toDateString) {
              const to = parseLocalDateString(toDateString);
              if (to && !Number.isNaN(to.getTime())) {
                to.setHours(23, 59, 59, 999);
                if (rowDate > to) return false;
              }
            }
          }
          return true;
        };

        const limitServer = 200; // scan in larger chunks
        const maxScanPages = 200; // safety
        let scanPage = 1;
        const sliceStart = pagination.pageIndex * pagination.pageSize;
        const sliceEnd = sliceStart + pagination.pageSize;
        const filteredAccumulator: Donation[] = [];

        while (true) {
          const params: Record<string, string | number> = {
            page: scanPage,
            limit: limitServer,
          };
          if (status) params.status = status;
          const res = await api.get("/api/admin/donations", { params });
          const items: Donation[] = res.data || [];
          if (items.length === 0) break;

          for (const d of items) {
            if (matchesClientFilters(d)) filteredAccumulator.push(d);
          }

          if (filteredAccumulator.length >= sliceEnd) break;
          if (items.length < limitServer || scanPage >= maxScanPages) break;
          scanPage += 1;
        }

        // Determine virtual total by continuing one more scan to know if more filtered items exist
        let moreExists = false;
        if (filteredAccumulator.length < sliceEnd && scanPage < maxScanPages) {
          scanPage += 1;
          // probe next page quickly
          const paramsProbe: Record<string, string | number> = {
            page: scanPage,
            limit: limitServer,
          };
          if (status) paramsProbe.status = status;
          const probeRes = await api.get("/api/admin/donations", {
            params: paramsProbe,
          });
          const probeItems: Donation[] = probeRes.data || [];
          for (const d of probeItems) {
            if (matchesClientFilters(d)) {
              filteredAccumulator.push(d);
              if (filteredAccumulator.length >= sliceEnd + 1) break;
            }
          }
          moreExists = filteredAccumulator.length > sliceEnd;
        } else {
          moreExists = filteredAccumulator.length > sliceEnd;
        }

        const pageSlice = filteredAccumulator.slice(sliceStart, sliceEnd);
        setData(pageSlice);
        setHasNextPage(moreExists);
        const total = filteredAccumulator.length; // lower bound
        setVirtualTotal(total);
        const candidateMax = Math.max(
          1,
          Math.ceil(total / pagination.pageSize),
        );
        setMaxKnownPage(candidateMax);
      } catch (err) {
        console.error("Error fetching donation data for table:", err);
        setError("Failed to load donation data.");
      } finally {
        setLoading(false);
        setHasLoadedOnce(true);
      }
    };
    fetchFilteredPage();
  }, [pagination.pageIndex, pagination.pageSize, columnFilters]);

  // Reset to first page when filters change for better UX
  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [columnFilters]);

  // Helper function to get filter value for Select components
  // Maps empty string from react-table filter state to "all" for Radix Select
  const getSelectFilterValue = (columnId: string) => {
    const filter = table.getColumn(columnId)?.getFilterValue();
    return filter === "" ? "all" : ((filter as string) ?? "all");
  };

  // Helper function to set filter value for react-table from Select components
  // Maps "all" from Radix Select to empty string for react-table filter state
  const setSelectColumnFilterValue = (columnId: string, value: string) => {
    const actualFilterValue = value === "all" ? "" : value;
    table.getColumn(columnId)?.setFilterValue(actualFilterValue);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Using server-side pagination; disable client paginator model
    manualPagination: true,
    pageCount: Math.max(1, maxKnownPage + (hasNextPage ? 1 : 0)),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Debounce text filters so search runs after typing pauses
  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const txColumn = table.getColumn("transactionId");
      const donorNameColumn = table.getColumn("donorName");
      const donorPhoneColumn = table.getColumn("donorPhone");

      const txValue = (txColumn?.getFilterValue() as string | undefined) ?? "";
      const donorNameValue =
        (donorNameColumn?.getFilterValue() as string | undefined) ?? "";
      const donorPhoneValue =
        (donorPhoneColumn?.getFilterValue() as string | undefined) ?? "";

      if (txValue !== textFilters.transactionId) {
        txColumn?.setFilterValue(textFilters.transactionId);
      }
      if (donorNameValue !== textFilters.donorName) {
        donorNameColumn?.setFilterValue(textFilters.donorName);
      }
      if (donorPhoneValue !== textFilters.donorPhone) {
        donorPhoneColumn?.setFilterValue(textFilters.donorPhone);
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [textFilters, table]);

  if (loading && !hasLoadedOnce) {
    return <div className="text-center py-8">Loading donation table...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="flex w-full flex-col justify-start gap-6">
      <div className="px-4 lg:px-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Transaction ID */}
          <Input
            placeholder="Filter by Transaction ID..."
            value={textFilters.transactionId}
            onChange={(event) =>
              setTextFilters((prev) => ({
                ...prev,
                transactionId: event.target.value,
              }))
            }
          />
          {/* Donor Name */}
          <Input
            placeholder="Filter by Donor Name..."
            value={textFilters.donorName}
            onChange={(event) =>
              setTextFilters((prev) => ({
                ...prev,
                donorName: event.target.value,
              }))
            }
          />
          {/* Phone Number */}
          <Input
            placeholder="Filter by Phone Number..."
            value={textFilters.donorPhone}
            onChange={(event) =>
              setTextFilters((prev) => ({
                ...prev,
                donorPhone: event.target.value,
              }))
            }
          />
          {/* Date Range */}
          <DateRangeFilter table={table} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter by Status */}
          <Select
            value={getSelectFilterValue("paymentStatus")}
            onValueChange={(value) =>
              setSelectColumnFilterValue("paymentStatus", value)
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter by Anonymous */}
          <Select
            value={getSelectFilterValue("isAnonymous")}
            onValueChange={(value) =>
              setSelectColumnFilterValue("isAnonymous", value)
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by Anonymous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Donors</SelectItem>
              <SelectItem value="true">Anonymous</SelectItem>
              <SelectItem value="false">Identified</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <ColumnsIcon className="mr-1 h-4 w-4" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Numeric page buttons with windowed display */}
          <div className="flex items-center gap-1">
            {(() => {
              const totalPages = Math.max(1, maxKnownPage);
              const current = pagination.pageIndex + 1;
              const windowSize = 7;
              const half = Math.floor(windowSize / 2);
              let start = Math.max(1, current - half);
              const end = Math.min(totalPages, start + windowSize - 1);
              if (end - start + 1 < windowSize) {
                start = Math.max(1, end - windowSize + 1);
              }
              const pages = [] as number[];
              for (let p = start; p <= end; p++) pages.push(p);
              return pages.map((pageNum) => {
                const isActive = current === pageNum;
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        pageIndex: pageNum - 1,
                      }))
                    }
                  >
                    {pageNum}
                  </Button>
                );
              });
            })()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() =>
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }
              disabled={pagination.pageIndex === 0}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={pagination.pageIndex === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!hasNextPage}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: Math.max(0, maxKnownPage - 1),
                }))
              }
              disabled={pagination.pageIndex >= Math.max(0, maxKnownPage - 1)}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Date range filter component for the Date column (timeOfPayment)
function DateRangeFilter({
  table,
}: {
  table: ReturnType<typeof useReactTable<Donation>>;
}) {
  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(
    undefined,
  );
  const [open, setOpen] = React.useState(false);

  // Apply filter to timeOfPayment via local date string range
  React.useEffect(() => {
    const nextValue =
      !range?.from && !range?.to
        ? ""
        : `${range?.from ? format(range.from, "yyyy-MM-dd") : ""}|${
            range?.to ? format(range.to, "yyyy-MM-dd") : ""
          }`;

    const column = table.getColumn("timeOfPayment");
    const currentValue = (column?.getFilterValue() as string | undefined) ?? "";
    if (currentValue !== nextValue) {
      column?.setFilterValue(nextValue);
    }
  }, [range, table]);

  React.useEffect(() => {
    if (open) {
      setDraftRange(range);
    }
  }, [open, range]);

  const applyPresetRange = (nextRange: DateRange) => {
    setDraftRange(nextRange);
    setRange(nextRange);
    setOpen(false);
  };

  const displayLabel = !range?.from
    ? "Filter by Date"
    : range.to
      ? `${format(range.from, "dd MMM yyyy")} - ${format(range.to, "dd MMM yyyy")}`
      : `${format(range.from, "dd MMM yyyy")} onward`;

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal w-full min-w-0"
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate" title={displayLabel}>
              {displayLabel}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] sm:w-[380px] p-0" align="start">
          <div className="grid grid-cols-2 gap-2 border-b p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = startOfDay(new Date());
                applyPresetRange({ from: today, to: today });
              }}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = startOfDay(new Date());
                applyPresetRange({ from: subDays(today, 6), to: today });
              }}
            >
              Last 7 days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                applyPresetRange({ from: startOfMonth(now), to: now });
              }}
            >
              This month
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const lastMonth = subMonths(new Date(), 1);
                applyPresetRange({
                  from: startOfMonth(lastMonth),
                  to: endOfMonth(lastMonth),
                });
              }}
            >
              Last month
            </Button>
          </div>
          <Calendar
            mode="range"
            numberOfMonths={1}
            showOutsideDays={false}
            captionLayout="dropdown"
            fromYear={new Date().getFullYear() - 20}
            toYear={new Date().getFullYear() + 1}
            selected={draftRange}
            onSelect={setDraftRange}
            defaultMonth={
              draftRange?.from ?? range?.from ?? addDays(new Date(), -7)
            }
          />
          <div className="flex items-center justify-end gap-2 border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDraftRange(undefined)}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setRange(draftRange);
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {(range?.from || range?.to) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRange(undefined)}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
