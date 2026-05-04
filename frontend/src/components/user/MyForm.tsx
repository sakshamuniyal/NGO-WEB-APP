// src/components/component/MyForm.tsx
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CountryCode } from "libphonenumber-js";

// Shadcn UI components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector, {
  type CountryProps,
  type StateProps,
} from "@/components/ui/location-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, XCircle } from "lucide-react";

// Custom API client
import { api } from "@/services/api";

// Auth context
import { useAuth } from "@/context/authContext";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().optional().or(z.literal("")),
  countryRegion: z
    .tuple([z.string(), z.string()])
    .refine(([c, s]) => c.trim().length > 0 && s.trim().length > 0, {
      message: "Country and State are required",
    }),
  addressLine1: z.string().min(1, "Street address is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  postcode: z.string().min(4, "Postcode is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  panCard: z.string().optional().or(z.literal("")),
});

export default function MyForm({ buttonName }: { buttonName: string }) {
  const { user, loading: authLoading, refetchAuth } = useAuth();
  const navigate = useNavigate();

  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    description: string;
    variant: "default" | "destructive";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for LocationSelector
  // Initialize with empty strings or null, and let useEffect handle actual user data
  const [countryName, setCountryName] = useState<string>("IN"); // ISO2, must match countryRegion[0]
  const [stateName, setStateName] = useState<string>(""); // Full state name

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      countryRegion: ["IN", ""],
      addressLine1: "",
      addressLine2: "",
      postcode: "",
      email: "",
      panCard: "",
    },
  });

  useEffect(() => {
    // This effect runs when 'user' or 'authLoading' changes.
    // It's responsible for setting the form's default values AND
    // the local state for LocationSelector's props.
    if (!authLoading && user) {
      // 1. Reset react-hook-form fields
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        companyName: user.companyName || "",
        email: user.email || "",
        panCard: user.panCard || "",
        addressLine1: user.address?.line1 || "",
        addressLine2: user.address?.line2 || "",
        postcode: user.address?.zipCode || "",
        countryRegion: [
          user.address?.country?.trim() || "IN",
          user.address?.state || "",
        ],
      });

      setCountryName(user.address?.country?.trim() || "IN");
      setStateName(user.address?.state || "");
    } else if (!authLoading && !user) {
      // If auth is loaded but no user, ensure defaults are set correctly
      setCountryName("IN");
      setStateName("");
      form.reset({
        // Also reset form to defaults if user is null after loading
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        panCard: "",
        addressLine1: "",
        addressLine2: "",
        postcode: "",
        countryRegion: ["IN", ""],
      });
    }
    // form.reset from react-hook-form is stable; omitting `form` avoids extra resets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleLocationCountryChange = useCallback(
    (country: CountryProps | null) => {
      const countryIso2 = country?.iso2 || "";
      setCountryName(countryIso2);
      form.setValue("countryRegion", [countryIso2, ""], {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [form],
  );

  const handleLocationStateChange = useCallback(
    (state: StateProps | null) => {
      const stateVal = state?.name ?? "";
      setStateName(stateVal);
      const existingCountry = form.getValues("countryRegion")[0]?.trim();
      const countryIso = existingCountry || countryName || "IN";
      form.setValue("countryRegion", [countryIso, stateVal], {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [form, countryName],
  );

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p>Authentication required. Redirecting to login...</p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setAlertInfo(null);

    if (!user || !user.phoneNumber) {
      setAlertInfo({
        title: "Submission Error",
        description: "User phone number not found. Cannot update profile.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      phoneNumber: user.phoneNumber,
      firstName: values.firstName,
      lastName: values.lastName,
      companyName: values.companyName,
      email: values.email,
      panCard: values.panCard,
      address: {
        line1: values.addressLine1,
        line2: values.addressLine2,
        state: values.countryRegion[1], // Use data from form's countryRegion
        country: values.countryRegion[0], // Use data from form's countryRegion
        zipCode: values.postcode,
      },
    };

    try {
      console.log("Payload sent:", payload);
      const response = await api.put("/api/update-profile", payload, {
        withCredentials: true,
      });

      if (response.status === 200) {
        setAlertInfo({
          title: "Success!",
          description: "Changes saved successfully.",
          variant: "default",
        });
        await refetchAuth();
        navigate("/dashboard");
      } else {
        setAlertInfo({
          title: "Update Failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Form submission error", error);
      let errorMessage = "Failed to update the profile. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      setAlertInfo({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-3xl mx-auto py-8"
      >
        {alertInfo && (
          <Alert variant={alertInfo.variant} className="mb-6">
            {alertInfo.variant === "default" ? (
              <Terminal className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{alertInfo.title}</AlertTitle>
            <AlertDescription>{alertInfo.description}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAlertInfo(null)}
              className="absolute top-2 right-2"
            >
              <span className="sr-only">Close alert</span>
              <XCircle className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-6">
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Your Company" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="countryRegion"
          render={() => (
            <FormItem>
              <FormLabel>Country/Region</FormLabel>
              <FormControl>
                {/* LocationSelector receives props from MyForm's local state */}
                <LocationSelector
                  countryCode={countryName}
                  stateName={stateName}
                  onCountryChange={handleLocationCountryChange}
                  onStateChange={handleLocationStateChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="addressLine1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="House Number and Street Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="addressLine2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>2nd line for Address (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apartment, suite, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postcode/ZIP</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. 560001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Phone number</FormLabel>
          <FormControl>
            <PhoneInput
              value={user?.phoneNumber || ""}
              defaultCountry={(user?.address?.country as CountryCode) || "IN"} // Cast to CountryCode
              readOnly
              disabled
              placeholder="e.g. +91 9876543210"
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="panCard"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PAN Card (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="ABCDE1234F" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : buttonName}
        </Button>
      </form>
    </Form>
  );
}
