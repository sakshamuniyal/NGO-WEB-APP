// frontend\src\components\admin\AdminCaseTable.tsx

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
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  TableMeta,
} from "@tanstack/react-table";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  MoreVerticalIcon,
  PlusIcon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { api } from "@/services/api";
import { useAdminAuth } from "@/context/authContext";
import { AxiosError } from "axios";

import { Case, CaseType } from "@/types";

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    enableEditCase: boolean;
    enableDeleteCase: boolean;
    onEditCase: (caseData: TData) => void;
    onDeleteCase: (caseId: string) => void;
    refetchCases: () => void;
  }
}

// --- Zod Schema for Case Form Validation ---
const caseFormSchema = z.object({
  id: z.string().optional(),
  patientName: z.string().min(1, "Patient name is required."),
  age: z.preprocess(
    (val) => Number(val),
    z.number().int().positive("Age must be a positive integer."),
  ),
  nationality: z.string().min(1, "Nationality is required."),
  typeOfCase: z.enum(["HEALTH", "EDUCATION", "OTHER"], {
    required_error: "Case type is required.",
  }),
  description: z.string().min(1, "Description is required."),
  targetAmount: z.preprocess(
    (val) => Number(val),
    z.number().positive("Target amount must be positive."),
  ),
  isActive: z.boolean().default(true),
  phoneNumber: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().optional(),
  ),
  permanentAddress: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().optional(),
  ),
  currentAddress: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().optional(),
  ),
  pdfUrls: z.preprocess(
    (val) =>
      Array.isArray(val) &&
      val.every((v) => typeof v === "string" && v.trim() !== "")
        ? val
        : [],
    z.array(z.string()).optional(),
  ),
  imageUrls: z.preprocess(
    (val) =>
      Array.isArray(val) &&
      val.every((v) => typeof v === "string" && v.trim() !== "")
        ? val
        : [],
    z.array(z.string()).optional(),
  ),
  videoUrls: z.preprocess(
    (val) =>
      Array.isArray(val) &&
      val.every((v) => typeof v === "string" && v.trim() !== "")
        ? val
        : [],
    z.array(z.string()).optional(),
  ),
  title: z.string().min(1, "Title is required."),
});

const FILE_LIMITS = {
  pdf: { maxCount: 2, maxSizeMB: 20, allowedTypes: ["application/pdf"] },
  image: {
    maxCount: 10,
    maxSizeMB: 10,
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  video: {
    maxCount: 2,
    maxSizeMB: 100,
    allowedTypes: ["video/mp4", "video/quicktime", "video/webm"],
  },
};

// --- Columns Definition for Case Data ---
const columns: ColumnDef<Case>[] = [
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
    accessorKey: "patientName",
    header: "Patient Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.patientName}</div>
    ),
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    accessorKey: "age",
    header: () => <div className="text-right">Age</div>,
    cell: ({ row }) => <div className="text-right">{row.original.age}</div>,
  },
  {
    accessorKey: "nationality",
    header: "Nationality",
    cell: ({ row }) => <div>{row.original.nationality}</div>,
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    accessorKey: "typeOfCase",
    header: "Case Type",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.typeOfCase}</Badge>
    ),
    filterFn: (row, columnId, filterValue) => {
      return row.getValue(columnId) === filterValue;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate text-muted-foreground">
        {row.original.description || "N/A"}
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    accessorKey: "targetAmount",
    header: () => <div className="text-right">Target (₹)</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        ₹
        {row.original.targetAmount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    ),
  },
  {
    accessorKey: "raisedAmount",
    header: () => <div className="text-right">Raised (₹)</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        ₹
        {row.original.raisedAmount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    ),
  },
  {
    id: "remainingAmount",
    header: () => <div className="text-right">Remaining (₹)</div>,
    cell: ({ row }) => {
      const remaining = row.original.targetAmount - row.original.raisedAmount;
      const colorClass = remaining <= 0 ? "text-green-600" : "text-red-600";
      return (
        <div className={`text-right font-semibold tabular-nums ${colorClass}`}>
          ₹
          {remaining.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Active",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.original.isActive ? (
          <CheckCircle2Icon className="text-green-500" />
        ) : (
          <span className="text-gray-400">&#x2716;</span>
        )}
      </div>
    ),
    filterFn: (row, columnId, filterValue) => {
      const isActive = row.getValue<boolean>(columnId);
      if (filterValue === "true") return isActive === true;
      if (filterValue === "false") return isActive === false;
      return true;
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => <div>{row.original.phoneNumber || "N/A"}</div>,
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    accessorKey: "permanentAddress",
    header: "Perm. Address",
    cell: ({ row }) => (
      <div className="max-w-[150px] truncate">
        {row.original.permanentAddress || "N/A"}
      </div>
    ),
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    accessorKey: "currentAddress",
    header: "Curr. Address",
    cell: ({ row }) => (
      <div className="max-w-[150px] truncate">
        {row.original.currentAddress || "N/A"}
      </div>
    ),
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  // ⭐ UPDATED: Display multiple URLs for PDF, Image, Video ⭐
  {
    accessorKey: "pdfUrls",
    header: "PDFs",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1 max-w-[150px]">
        {row.original.pdfUrls?.map((url: string, index: number) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs"
          >
            PDF {index + 1}
          </a>
        )) || "N/A"}
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false, // Filtering by array content is complex
  },
  {
    accessorKey: "imageUrls",
    header: "Images",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1 max-w-[150px]">
        {row.original.imageUrls?.map((url: string, index: number) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs"
          >
            Image {index + 1}
          </a>
        )) || "N/A"}
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: "videoUrls",
    header: "Videos",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1 max-w-[150px]">
        {row.original.videoUrls?.map((url: string, index: number) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs"
          >
            Video {index + 1}
          </a>
        )) || "N/A"}
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorFn: (row) => row.createdBy?.email || row.createdBy?.name || "N/A",
    id: "createdBy",
    header: "Created By",
    cell: ({ row }) => {
      const creator = row.original.createdBy;
      return <div>{creator?.name || creator?.email || "N/A"}</div>;
    },
    enableColumnFilter: true,
    filterFn: "includesString",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
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
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.original.updatedAt);
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
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta<Case>;

      const handleEditClick = () => {
        if (meta.enableEditCase && typeof meta.onEditCase === "function") {
          meta.onEditCase(row.original);
        } else {
          console.warn(
            "Edit functionality not enabled or onEditCase handler not provided.",
          );
        }
      };

      const handleDeleteClick = async () => {
        if (meta.enableDeleteCase && typeof meta.onDeleteCase === "function") {
          if (
            window.confirm(
              "Are you sure you want to delete this case? This action cannot be undone.",
            )
          ) {
            try {
              await meta.onDeleteCase(row.original.id);
              toast.success("Case deleted successfully.");
              meta.refetchCases();
            } catch (error: unknown) {
              console.error("Failed to delete case:", error);
              let errorMessage = "Failed to delete case.";
              if (
                error instanceof AxiosError &&
                error.response?.data?.message
              ) {
                errorMessage = error.response.data.message;
              } else if (error instanceof Error) {
                errorMessage = error.message;
              }
              toast.error(errorMessage);
            }
          }
        } else {
          console.warn(
            "Delete functionality not enabled or onDeleteCase handler not provided.",
          );
        }
      };

      return (
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
            {meta.enableEditCase && (
              <DropdownMenuItem onClick={handleEditClick}>
                Edit
              </DropdownMenuItem>
            )}
            {meta.enableDeleteCase && (
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-red-500"
              >
                Delete
              </DropdownMenuItem>
            )}
            {!meta.enableEditCase && !meta.enableDeleteCase && (
              <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// --- Case Form Component (Used in Dialog) ---
type CaseFormValues = z.infer<typeof caseFormSchema>;

interface CaseFormProps {
  initialData?: Case;
  onSave: (data: CaseFormValues) => Promise<void>;
  // onClose: () => void;
  isSaving: boolean;
  formId: string;
  onFileUploadStatusChange: (isUploading: boolean) => void; // ⭐ NEW: Callback for upload status ⭐
}

// Interface to track upload status for each file
interface FileUploadStatus {
  file: File;
  progress: number; // 0-100
  status: "pending" | "uploading" | "success" | "failed";
  error: string | null;
  url?: string; // The S3 URL if successful
}

const CaseForm: React.FC<CaseFormProps> = ({
  initialData,
  onSave,
  // onClose,
  isSaving,
  formId,
  onFileUploadStatusChange,
}) => {
  console.log("[CaseForm] Rendered with initialData:", initialData);
  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: initialData
      ? {
          id: initialData.id,
          patientName: initialData.patientName,
          age: initialData.age,
          nationality: initialData.nationality,
          typeOfCase: initialData.typeOfCase,
          description: initialData.description,
          targetAmount: initialData.targetAmount,
          isActive: initialData.isActive,
          phoneNumber: initialData.phoneNumber ?? undefined,
          permanentAddress: initialData.permanentAddress ?? undefined,
          currentAddress: initialData.currentAddress ?? undefined,
          pdfUrls: initialData.pdfUrls ?? [],
          imageUrls: initialData.imageUrls ?? [],
          videoUrls: initialData.videoUrls ?? [],
          title: initialData.title,
        }
      : {
          patientName: "",
          age: 0,
          nationality: "",
          typeOfCase: undefined,
          description: "",
          targetAmount: 0,
          isActive: true,
          phoneNumber: undefined,
          permanentAddress: undefined,
          currentAddress: undefined,
          pdfUrls: [],
          imageUrls: [],
          videoUrls: [],
          title: "",
        },
  });

  // State to manage individual file upload progress and status
  const [pdfUploads, setPdfUploads] = React.useState<FileUploadStatus[]>([]);
  const [imageUploads, setImageUploads] = React.useState<FileUploadStatus[]>(
    [],
  );
  const [videoUploads, setVideoUploads] = React.useState<FileUploadStatus[]>(
    [],
  );

  // Calculate if any file is currently uploading
  const isAnyFileCurrentlyUploading = React.useMemo(() => {
    return (
      pdfUploads.some((u) => u.status === "uploading") ||
      imageUploads.some((u) => u.status === "uploading") ||
      videoUploads.some((u) => u.status === "uploading")
    );
  }, [pdfUploads, imageUploads, videoUploads]);

  React.useEffect(() => {
    console.log("[CaseForm] useEffect initialData:", initialData);
    onFileUploadStatusChange(isAnyFileCurrentlyUploading);
  }, [
    isAnyFileCurrentlyUploading,
    onFileUploadStatusChange,
    initialData,
    isSaving,
  ]);

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id,
        patientName: initialData.patientName,
        age: initialData.age,
        nationality: initialData.nationality,
        typeOfCase: initialData.typeOfCase,
        description: initialData.description,
        targetAmount: initialData.targetAmount,
        isActive: initialData.isActive,
        phoneNumber: initialData.phoneNumber ?? undefined,
        permanentAddress: initialData.permanentAddress ?? undefined,
        currentAddress: initialData.currentAddress ?? undefined,
        pdfUrls: initialData.pdfUrls ?? [],
        imageUrls: initialData.imageUrls ?? [],
        videoUrls: initialData.videoUrls ?? [],
        title: initialData.title,
      });
    } else {
      form.reset({
        patientName: "",
        age: 0,
        nationality: "",
        typeOfCase: undefined,
        description: "",
        targetAmount: 0,
        isActive: true,
        phoneNumber: undefined,
        permanentAddress: undefined,
        currentAddress: undefined,
        pdfUrls: [],
        imageUrls: [],
        videoUrls: [],
        title: "",
      });
    }
    // Reset upload states
    setPdfUploads([]);
    setImageUploads([]);
    setVideoUploads([]);
  }, [initialData, form]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "pdf" | "image" | "video",
  ) => {
    // Block uploads if no caseId (i.e., new case creation)
    const caseId = initialData?.id;
    if (!caseId) {
      toast.error("Please save the case before uploading files.");
      e.target.value = "";
      return;
    }
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentUrls = form.getValues(`${fileType}Urls`) || [];
    const currentUploadsState = (() => {
      switch (fileType) {
        case "pdf":
          return pdfUploads;
        case "image":
          return imageUploads;
        case "video":
          return videoUploads;
      }
    })();

    const setUploadsState = (() => {
      switch (fileType) {
        case "pdf":
          return setPdfUploads;
        case "image":
          return setImageUploads;
        case "video":
          return setVideoUploads;
      }
    })();

    const { maxCount, maxSizeMB, allowedTypes } = FILE_LIMITS[fileType];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (
      currentUrls.length + files.length + currentUploadsState.length >
      maxCount
    ) {
      toast.error(`You can upload a maximum of ${maxCount} ${fileType} files.`);
      e.target.value = ""; // Clear input
      return;
    }

    const newUploads: FileUploadStatus[] = files.map((file) => ({
      file,
      progress: 0,
      status: "pending",
      error: null,
    }));

    setUploadsState((prev) => [...prev, ...newUploads]);

    for (const uploadItem of newUploads) {
      const file = uploadItem.file;

      if (file.size > maxSizeBytes) {
        setUploadsState((prev) =>
          prev.map((item) =>
            item.file === file
              ? {
                  ...item,
                  status: "failed",
                  error: `File size exceeds ${maxSizeMB}MB.`,
                }
              : item,
          ),
        );
        toast.error(`${file.name}: File size exceeds ${maxSizeMB}MB.`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        setUploadsState((prev) =>
          prev.map((item) =>
            item.file === file
              ? {
                  ...item,
                  status: "failed",
                  error: `Invalid file type. Allowed: ${allowedTypes.join(
                    ", ",
                  )}`,
                }
              : item,
          ),
        );
        toast.error(
          `${file.name}: Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
        );
        continue;
      }

      setUploadsState((prev) =>
        prev.map((item) =>
          item.file === file ? { ...item, status: "uploading" } : item,
        ),
      );

      try {
        const formData = new FormData();
        formData.append("file", file);
        // Use correct folder path
        let folder = "";
        if (fileType === "pdf") folder = `cases/${caseId}/pdf`;
        if (fileType === "image") folder = `cases/${caseId}/images`;
        if (fileType === "video") folder = `cases/${caseId}/videos`;
        formData.append("folder", folder);

        const response = await api.post("/api/admin/upload/public", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            withCredentials: true, // Ensure token is sent
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadsState((prev) =>
                prev.map((item) =>
                  item.file === file
                    ? { ...item, progress: percentCompleted }
                    : item,
                ),
              );
            }
          },
        });

        const fileUrl = response.data.fileUrl;
        console.log(
          `[FileUpload] Successfully uploaded ${file.name}. URL: ${fileUrl}`,
        );
        setUploadsState((prev) =>
          prev.map((item) =>
            item.file === file
              ? { ...item, status: "success", url: fileUrl }
              : item,
          ),
        );
        form.setValue(
          `${fileType}Urls`,
          [...(form.getValues(`${fileType}Urls`) || []), fileUrl],
          { shouldValidate: true },
        );
        console.log(
          `[FileUpload] Updated form state for ${fileType}Urls:`,
          form.getValues(`${fileType}Urls`),
        );
        toast.success(`${file.name} uploaded successfully!`);
      } catch (error: unknown) {
        console.error(`Error uploading ${file.name}:`, error);
        const errorMessage =
          error instanceof AxiosError && error.response?.data?.message
            ? error.response.data.message
            : error instanceof Error
              ? error.message
              : "Upload failed.";
        setUploadsState((prev) =>
          prev.map((item) =>
            item.file === file
              ? { ...item, status: "failed", error: errorMessage }
              : item,
          ),
        );
        toast.error(`${file.name}: ${errorMessage}`);
      }
    }
    e.target.value = ""; // Clear the input so same file can be selected again
  };

  const handleRemoveFile = (
    fileType: "pdf" | "image" | "video",
    urlToRemove: string,
  ) => {
    const currentUrls = form.getValues(`${fileType}Urls`) || [];
    const updatedUrls = currentUrls.filter((url) => url !== urlToRemove);
    form.setValue(`${fileType}Urls`, updatedUrls, { shouldValidate: true });
    toast.info(`Removed file from ${fileType} list.`);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    // Ensure all uploads are completed before saving the form
    const allUploads = [...pdfUploads, ...imageUploads, ...videoUploads];
    const pendingOrUploading = allUploads.some(
      (u) => u.status === "pending" || u.status === "uploading",
    );

    if (pendingOrUploading) {
      toast.error(
        "Please wait for all files to finish uploading before saving.",
      );
      return;
    }

    // Use the form state for file URLs
    const finalData = {
      ...data,
      pdfUrls: form.getValues("pdfUrls"),
      imageUrls: form.getValues("imageUrls"),
      videoUrls: form.getValues("videoUrls"),
    };

    // Merge existing URLs from initialData if editing and not re-uploaded
    if (initialData) {
      finalData.pdfUrls = [
        ...(initialData.pdfUrls || []),
        ...(finalData.pdfUrls || []),
      ];
      finalData.imageUrls = [
        ...(initialData.imageUrls || []),
        ...(finalData.imageUrls || []),
      ];
      finalData.videoUrls = [
        ...(initialData.videoUrls || []),
        ...(finalData.videoUrls || []),
      ];

      // Remove duplicates if any (e.g., if user uploads same file twice)
      finalData.pdfUrls = Array.from(new Set(finalData.pdfUrls));
      finalData.imageUrls = Array.from(new Set(finalData.imageUrls));
      finalData.videoUrls = Array.from(new Set(finalData.videoUrls));
    }

    console.log("[CaseForm] handleSubmit data:", data);
    console.log(
      "[CaseForm] handleSubmit form pdfUrls:",
      form.getValues("pdfUrls"),
    );
    console.log(
      "[CaseForm] handleSubmit form imageUrls:",
      form.getValues("imageUrls"),
    );
    console.log(
      "[CaseForm] handleSubmit form videoUrls:",
      form.getValues("videoUrls"),
    );
    console.log("[CaseForm] handleSubmit finalData:", finalData);
    await onSave(finalData);
  });

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="patientName">Patient Name</Label>
        <Input
          id="patientName"
          {...form.register("patientName")}
          disabled={isSaving || isAnyFileCurrentlyUploading}
        />
        {form.formState.errors.patientName && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.patientName.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            {...form.register("age", { valueAsNumber: true })}
            disabled={isSaving || isAnyFileCurrentlyUploading}
          />
          {form.formState.errors.age && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.age.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            {...form.register("nationality")}
            disabled={isSaving || isAnyFileCurrentlyUploading}
          />
          {form.formState.errors.nationality && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.nationality.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="typeOfCase">Case Type</Label>
        <Select
          name="typeOfCase"
          value={form.watch("typeOfCase") || ""}
          onValueChange={(value) =>
            form.setValue("typeOfCase", value as CaseType, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          disabled={isSaving || isAnyFileCurrentlyUploading}
        >
          <SelectTrigger id="typeOfCase">
            <SelectValue placeholder="Select a case type" />
          </SelectTrigger>
          <SelectContent className="z-[300]">
            <SelectItem value="HEALTH">Health</SelectItem>
            <SelectItem value="EDUCATION">Education</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.typeOfCase && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.typeOfCase.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="targetAmount">Target Amount (₹)</Label>
        <Input
          id="targetAmount"
          type="number"
          step="0.01"
          {...form.register("targetAmount", { valueAsNumber: true })}
          disabled={isSaving || isAnyFileCurrentlyUploading}
        />
        {form.formState.errors.targetAmount && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.targetAmount.message}
          </p>
        )}
      </div>

      {/* isActive checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", !!checked)}
          disabled={isSaving || isAnyFileCurrentlyUploading}
        />
        <Label htmlFor="isActive">Case is Active</Label>
      </div>
      {form.formState.errors.isActive && (
        <p className="text-red-500 text-sm">
          {form.formState.errors.isActive.message}
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
        <Input
          id="phoneNumber"
          {...form.register("phoneNumber")}
          disabled={isSaving || isAnyFileCurrentlyUploading}
        />
        {form.formState.errors.phoneNumber && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.phoneNumber.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="permanentAddress">Permanent Address (Optional)</Label>
        <Textarea
          id="permanentAddress"
          {...form.register("permanentAddress")}
          disabled={isSaving || isAnyFileCurrentlyUploading}
        />
        {form.formState.errors.permanentAddress && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.permanentAddress.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="currentAddress">Current Address (Optional)</Label>
        <Textarea
          id="currentAddress"
          {...form.register("currentAddress")}
          disabled={isSaving || isAnyFileCurrentlyUploading}
        />
        {form.formState.errors.currentAddress && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.currentAddress.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...form.register("title")}
          disabled={isSaving || isAnyFileCurrentlyUploading}
        />
        {form.formState.errors.title && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          disabled={isSaving || isAnyFileCurrentlyUploading}
        />
        {form.formState.errors.description && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      {/* ⭐ MULTIPLE FILE UPLOAD SECTIONS ⭐ */}

      {/* PDF Upload Section */}
      <div className="grid gap-2 border p-4 rounded-md">
        <Label className="font-semibold flex items-center gap-2">
          <UploadCloudIcon className="w-5 h-5" /> Upload PDFs (Max{" "}
          {FILE_LIMITS.pdf.maxCount}, {FILE_LIMITS.pdf.maxSizeMB}MB each)
        </Label>
        {!initialData?.id && (
          <div className="text-yellow-600 text-xs mb-2">
            Save the case before uploading files.
          </div>
        )}
        <Input
          type="file"
          id="pdfFiles"
          accept={FILE_LIMITS.pdf.allowedTypes.join(",")}
          multiple
          onChange={(e) => handleFileUpload(e, "pdf")}
          className="block h-full w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={
            !initialData?.id ||
            isSaving ||
            pdfUploads.length + (form.getValues("pdfUrls")?.length || 0) >=
              FILE_LIMITS.pdf.maxCount
          }
        />
        {form.formState.errors.pdfUrls && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.pdfUrls.message}
          </p>
        )}
        <div className="mt-2 space-y-2">
          {/* Display existing PDFs */}
          {(initialData?.pdfUrls || []).map((url: string, index: number) => (
            <div
              key={`existing-pdf-${index}`}
              className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
            >
              <span className="truncate text-sm">
                Existing PDF:{" "}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFile("pdf", url)}
                className="text-red-500 hover:text-red-700"
                disabled={
                  !initialData?.id || isSaving || isAnyFileCurrentlyUploading
                }
              >
                <XCircleIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {/* Display new uploads */}
          {pdfUploads.map((upload, index) => (
            <div
              key={`new-pdf-${index}`}
              className="flex flex-col p-2 border rounded-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{upload.file.name}</span>
                {upload.status === "uploading" && (
                  <span className="text-xs text-blue-600">Uploading...</span>
                )}
                {upload.status === "success" && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2Icon className="h-4 w-4" /> Uploaded
                  </span>
                )}
                {upload.status === "failed" && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <XCircleIcon className="h-4 w-4" /> Failed
                  </span>
                )}
                {(upload.status === "success" ||
                  upload.status === "failed") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (upload.url) handleRemoveFile("pdf", upload.url);
                      setPdfUploads((prev) =>
                        prev.filter((item) => item !== upload),
                      ); // Remove from upload state
                    }}
                    className="text-red-500 hover:text-red-700"
                    disabled={
                      !initialData?.id ||
                      isSaving ||
                      isAnyFileCurrentlyUploading
                    }
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {upload.status === "uploading" && (
                <Progress value={upload.progress} className="w-full mt-1" />
              )}
              {upload.error && (
                <p className="text-red-500 text-xs mt-1">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="grid gap-2 border p-4 rounded-md">
        <Label className="font-semibold flex items-center gap-2">
          <UploadCloudIcon className="w-5 h-5" /> Upload Images (Max{" "}
          {FILE_LIMITS.image.maxCount}, {FILE_LIMITS.image.maxSizeMB}MB each)
        </Label>
        {!initialData?.id && (
          <div className="text-yellow-600 text-xs mb-2">
            Save the case before uploading files.
          </div>
        )}
        <Input
          type="file"
          id="imageFiles"
          accept={FILE_LIMITS.image.allowedTypes.join(",")}
          multiple
          onChange={(e) => handleFileUpload(e, "image")}
          className="block w-full h-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={
            !initialData?.id ||
            isSaving ||
            imageUploads.length + (form.getValues("imageUrls")?.length || 0) >=
              FILE_LIMITS.image.maxCount
          }
        />
        {form.formState.errors.imageUrls && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.imageUrls.message}
          </p>
        )}
        <div className="mt-2 space-y-2">
          {/* Display existing Images */}
          {(initialData?.imageUrls || []).map((url: string, index: number) => (
            <div
              key={`existing-image-${index}`}
              className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
            >
              <span className="truncate text-sm">
                Existing Image:{" "}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFile("image", url)}
                className="text-red-500 hover:text-red-700"
                disabled={
                  !initialData?.id || isSaving || isAnyFileCurrentlyUploading
                }
              >
                <XCircleIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {/* Display new uploads */}
          {imageUploads.map((upload, index) => (
            <div
              key={`new-image-${index}`}
              className="flex flex-col p-2 border rounded-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{upload.file.name}</span>
                {upload.status === "uploading" && (
                  <span className="text-xs text-blue-600">Uploading...</span>
                )}
                {upload.status === "success" && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2Icon className="h-4 w-4" /> Uploaded
                  </span>
                )}
                {upload.status === "failed" && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <XCircleIcon className="h-4 w-4" /> Failed
                  </span>
                )}
                {(upload.status === "success" ||
                  upload.status === "failed") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (upload.url) handleRemoveFile("image", upload.url);
                      setPdfUploads((prev) =>
                        prev.filter((item) => item !== upload),
                      ); // Remove from upload state
                    }}
                    className="text-red-500 hover:text-red-700"
                    disabled={
                      !initialData?.id ||
                      isSaving ||
                      isAnyFileCurrentlyUploading
                    }
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {upload.status === "uploading" && (
                <Progress value={upload.progress} className="w-full mt-1" />
              )}
              {upload.error && (
                <p className="text-red-500 text-xs mt-1">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Video Upload Section */}
      <div className="grid gap-2 border p-4 rounded-md">
        <Label className="font-semibold flex items-center gap-2">
          <UploadCloudIcon className="w-5 h-5" /> Upload Videos (Max{" "}
          {FILE_LIMITS.video.maxCount}, {FILE_LIMITS.video.maxSizeMB}MB each)
        </Label>
        {!initialData?.id && (
          <div className="text-yellow-600 text-xs mb-2">
            Save the case before uploading files.
          </div>
        )}
        <Input
          type="file"
          id="videoFiles"
          accept={FILE_LIMITS.video.allowedTypes.join(",")}
          multiple
          onChange={(e) => handleFileUpload(e, "video")}
          className="block w-full h-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={
            !initialData?.id ||
            isSaving ||
            videoUploads.length + (form.getValues("videoUrls")?.length || 0) >=
              FILE_LIMITS.video.maxCount
          }
        />
        {form.formState.errors.videoUrls && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.videoUrls.message}
          </p>
        )}
        <div className="mt-2 space-y-2">
          {/* Display existing Videos */}
          {(initialData?.videoUrls || []).map((url: string, index: number) => (
            <div
              key={`existing-video-${index}`}
              className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
            >
              <span className="truncate text-sm">
                Existing Video:{" "}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFile("video", url)}
                className="text-red-500 hover:text-red-700"
                disabled={
                  !initialData?.id || isSaving || isAnyFileCurrentlyUploading
                }
              >
                <XCircleIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {/* Display new uploads */}
          {videoUploads.map((upload, index) => (
            <div
              key={`new-video-${index}`}
              className="flex flex-col p-2 border rounded-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{upload.file.name}</span>
                {upload.status === "uploading" && (
                  <span className="text-xs text-blue-600">Uploading...</span>
                )}
                {upload.status === "success" && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2Icon className="h-4 w-4" /> Uploaded
                  </span>
                )}
                {upload.status === "failed" && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <XCircleIcon className="h-4 w-4" /> Failed
                  </span>
                )}
                {(upload.status === "success" ||
                  upload.status === "failed") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (upload.url) handleRemoveFile("video", upload.url);
                      setPdfUploads((prev) =>
                        prev.filter((item) => item !== upload),
                      ); // Remove from upload state
                    }}
                    className="text-red-500 hover:text-red-700"
                    disabled={
                      !initialData?.id ||
                      isSaving ||
                      isAnyFileCurrentlyUploading
                    }
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {upload.status === "uploading" && (
                <Progress value={upload.progress} className="w-full mt-1" />
              )}
              {upload.error && (
                <p className="text-red-500 text-xs mt-1">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* <DialogFooter>
        <Button
          variant="outline"
          // onClick={onClose}
          disabled={isSaving || isAnyFileCurrentlyUploading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || isAnyFileCurrentlyUploading}>
          {isSaving
            ? "Saving..."
            : initialData?.id
            ? "Save Changes"
            : "Create Case"}
        </Button>
      </DialogFooter> */}
    </form>
  );
};

// --- Main AdminCaseTable Component ---
export function AdminCaseTable() {
  const { hasPermission } = useAdminAuth();
  const [data, setData] = React.useState<Case[]>([]);
  const [loading, setLoading] = React.useState(true);
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

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCase, setEditingCase] = React.useState<Case | null>(null);
  const [isSavingCase, setIsSavingCase] = React.useState(false);
  const [isAnyFileUploadingGlobal, setIsAnyFileUploadingGlobal] =
    React.useState(false);

  const formId = React.useId();

  const refetchCases = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!hasPermission("view_cases")) {
        setError("Permission denied to view cases.");
        setLoading(false);
        return;
      }
      const res = await api.get("/api/admin/cases");
      setData(res.data);
      setLoading(false);
    } catch (err: unknown) {
      console.error("Error fetching case data for table:", err);
      let errorMessage = "Failed to load case data.";
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  }, [hasPermission]);

  React.useEffect(() => {
    refetchCases();
  }, [refetchCases]);

  const handleAddCaseClick = () => {
    setEditingCase(null);
    setIsModalOpen(true);
  };

  const handleEditCase = (caseData: Case) => {
    const transformedCase: Case = {
      ...caseData,
      phoneNumber: caseData.phoneNumber ?? undefined,
      permanentAddress: caseData.permanentAddress ?? undefined,
      currentAddress: caseData.currentAddress ?? undefined,
      pdfUrls: caseData.pdfUrls ?? undefined,
      imageUrls: caseData.imageUrls ?? undefined,
      videoUrls: caseData.videoUrls ?? undefined,
    };
    setEditingCase(transformedCase);
    setIsModalOpen(true);
  };

  const handleSaveCase = async (values: CaseFormValues) => {
    console.log("[AdminCaseTable] handleSaveCase received values:", values);
    setIsSavingCase(true);
    try {
      if (values.id) {
        if (!hasPermission("edit_case")) {
          toast.error("Permission denied to edit cases.");
          setIsSavingCase(false);
          return;
        }
        await api.put(`/api/admin/cases/${values.id}`, values);
        toast.success("Case updated successfully.");
      } else {
        if (!hasPermission("create_case")) {
          toast.error("Permission denied to create cases.");
          setIsSavingCase(false);
          return;
        }
        const { id, ...createPayload } = values;
        console.log(values);
        await api.post("/api/admin/cases", createPayload);
        toast.success("Case created successfully.");
      }
      setIsModalOpen(false);
      refetchCases();
    } catch (err: unknown) {
      console.error("Error saving case:", err);
      let errorMessage = "Failed to save case.";
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSavingCase(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!hasPermission("delete_case")) {
      toast.error("Permission denied to delete cases.");
      return;
    }
    try {
      await api.delete(`/api/admin/cases/${caseId}`);
      toast.success("Case deleted successfully.");
      refetchCases();
    } catch (err: unknown) {
      console.error("Error deleting case:", err);
      let errorMessage = "Failed to delete case.";
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      enableEditCase: hasPermission("edit_case"),
      enableDeleteCase: hasPermission("delete_case"),
      onEditCase: handleEditCase,
      onDeleteCase: handleDeleteCase,
      refetchCases: refetchCases,
    },
  });

  const getSelectFilterValue = (columnId: string) => {
    const filter = table.getColumn(columnId)?.getFilterValue();
    return filter === "" ? "all" : ((filter as string) ?? "all");
  };

  const setSelectColumnFilterValue = (columnId: string, value: string) => {
    const actualFilterValue = value === "all" ? "" : value;
    table.getColumn(columnId)?.setFilterValue(actualFilterValue);
  };

  if (loading) {
    return <div className="text-center py-8">Loading cases...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!hasPermission("view_cases")) {
    return (
      <div className="text-center py-8 text-red-500">
        Permission denied to view cases.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        {/* Search/Filter for Patient Name */}
        <Input
          placeholder="Filter by Patient Name..."
          value={
            (table.getColumn("patientName")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("patientName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        {/* Filter by Case Type */}
        <Select
          value={getSelectFilterValue("typeOfCase")}
          onValueChange={(value) =>
            setSelectColumnFilterValue("typeOfCase", value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="HEALTH">Health</SelectItem>
            <SelectItem value="EDUCATION">Education</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter by isActive status */}
        <Select
          value={getSelectFilterValue("isActive")}
          onValueChange={(value) =>
            setSelectColumnFilterValue("isActive", value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by Active" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          {hasPermission("create_case") && (
            <Button variant="outline" size="sm" onClick={handleAddCaseClick}>
              <PlusIcon className="mr-1 h-4 w-4" />
              <span>Add New Case</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
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
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Case Dialog (Modal) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {/* ⭐ UPDATED DialogContent and added scrollable div ⭐ */}
        <DialogContent className="sm:max-w-[800px] flex flex-col max-h-[95vh] overflow-hidden p-0">
          {" "}
          {/* p-0 to manage padding internally */}
          <DialogHeader className="p-6 pb-4">
            {" "}
            {/* Padding for header */}
            <DialogTitle>
              {editingCase ? "Edit Case" : "Add New Case"}
            </DialogTitle>
            <DialogDescription>
              {editingCase
                ? "Edit the details of the existing case."
                : "Fill in the details to add a new case."}
            </DialogDescription>
          </DialogHeader>
          {/* This div makes the form content scrollable */}
          <div className="flex-grow overflow-y-auto px-6">
            {" "}
            {/* py-4 handled by form's space-y-4 */}
            <CaseForm
              formId={formId} // ⭐ Pass the generated form ID ⭐
              initialData={editingCase || undefined}
              onSave={handleSaveCase}
              isSaving={isSavingCase}
              onFileUploadStatusChange={setIsAnyFileUploadingGlobal}
            />
          </div>
          {/* ⭐ DialogFooter moved here, outside the scrollable div ⭐ */}
          <DialogFooter className="flex justify-end p-6 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSavingCase || isAnyFileUploadingGlobal}
            >
              {" "}
              {/* ⭐ Use isAnyFileUploadingGlobal ⭐ */}
              Cancel
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={isSavingCase || isAnyFileUploadingGlobal}
            >
              {" "}
              {/* ⭐ Use isAnyFileUploadingGlobal ⭐ */}
              {isSavingCase
                ? "Saving..."
                : editingCase?.id
                  ? "Save Changes"
                  : "Create Case"}{" "}
              {/* ⭐ Use editingCase?.id ⭐ */}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
