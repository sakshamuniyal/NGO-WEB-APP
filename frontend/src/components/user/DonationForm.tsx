import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  HeartHandshake,
  IndianRupee,
  Loader2,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import LocationSelector from "@/components/ui/location-input";

import { api } from "@/services/api";
import { useAuth } from "@/context/authContext";
import {
  btnPrimaryGiggles,
  fontDisplay,
  gigglesCard,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { cn } from "@/lib/utils";

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000] as const;

const baseDonationSchema = z.object({
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(1, "Donation amount must be at least 1.")
  ),
  caseId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

const guestDonorProfileSchema = z.object({
  firstName: z.string().optional().or(z.literal("")),
  lastName: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  countryRegion: z
    .array(z.string())
    .length(2, "Country and State are required if provided.")
    .optional(),
  addressLine1: z.string().optional().or(z.literal("")),
  addressLine2: z.string().optional().or(z.literal("")),
  postcode: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  panCard: z.string().optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
});

type DonationFormValues = z.infer<typeof baseDonationSchema> &
  z.infer<typeof guestDonorProfileSchema>;

const labelClass =
  "text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#71757b]";

const fieldInputClass = cn(
  "h-12 rounded-2xl border-0 bg-transparent px-4 py-3 text-[0.95rem] text-[#2d2f31] shadow-none",
  "placeholder:text-[#9a9ca0]",
  "ring-2 ring-transparent transition focus-visible:ring-[#006a3d]/35 focus-visible:ring-offset-0",
  gigglesSurface.containerLow
);

const locationShellClass = cn(
  "flex flex-col gap-3 rounded-2xl p-3 sm:flex-row",
  gigglesSurface.containerLow,
  "[&_button]:h-11 [&_button]:rounded-xl [&_button]:border-0 [&_button]:bg-white [&_button]:shadow-none [&_button]:font-medium [&_button]:text-[#2d2f31]"
);

const phoneShellClass = cn(
  "rounded-2xl p-0.5 ring-2 ring-transparent transition focus-within:ring-[#006a3d]/35",
  gigglesSurface.containerLow
);

export default function DonationForm({ caseId }: { caseId?: string }) {
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    description: string;
    variant: "default" | "destructive";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [countryName, setCountryName] = useState<string>("");
  const [stateName, setStateName] = useState<string>("");

  const formSchema = useMemo(() => {
    return baseDonationSchema
      .and(guestDonorProfileSchema)
      .superRefine((values, ctx) => {
        if (!isLoggedIn && !values.isAnonymous) {
          if (!values.firstName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "First name is required.",
              path: ["firstName"],
            });
          }
          if (!values.lastName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Last name is required.",
              path: ["lastName"],
            });
          }
          if (!values.addressLine1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Street address is required.",
              path: ["addressLine1"],
            });
          }
          if (!values.postcode) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Postcode is required.",
              path: ["postcode"],
            });
          }

          if (!values.phoneNumber) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "A phone number is required.",
              path: ["phoneNumber"],
            });
          } else {
            try {
              const phoneNumber = parsePhoneNumberFromString(
                values.phoneNumber,
                "IN"
              );
              if (!phoneNumber || !phoneNumber.isValid()) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message:
                    "A valid phone number is required to link or record your donation.",
                  path: ["phoneNumber"],
                });
              }
            } catch {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  "A valid phone number is required to link or record your donation.",
                path: ["phoneNumber"],
              });
            }
          }

          if (
            !values.countryRegion ||
            values.countryRegion.length !== 2 ||
            (values.countryRegion[0] === "" && values.countryRegion[1] === "")
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Country and State are required.",
              path: ["countryRegion"],
            });
          }
        }

        if (values.isAnonymous && values.amount > 50000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Anonymous donations cannot exceed Rs 50,000.",
            path: ["amount"],
          });
        }
      });
  }, [isLoggedIn]);

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      caseId: caseId || undefined,
      isAnonymous: false,
      firstName: "",
      lastName: "",
      companyName: "",
      countryRegion: ["", ""],
      addressLine1: "",
      addressLine2: "",
      postcode: "",
      email: "",
      panCard: "",
      phoneNumber: "",
    },
  });

  const isAnonymous = form.watch("isAnonymous");
  const amount = form.watch("amount");

  useEffect(() => {
    if (isLoggedIn && user) {
      form.reset({
        ...form.getValues(),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        companyName: user.companyName || "",
        email: user.email || "",
        panCard: user.panCard || "",
        phoneNumber: user.phoneNumber || "",
        addressLine1: user.address?.line1 || "",
        addressLine2: user.address?.line2 || "",
        postcode: user.address?.zipCode || "",
        countryRegion: [user.address?.country || "", user.address?.state || ""],
      });
      setCountryName(user.address?.country || "IN");
      setStateName(user.address?.state || "");
    } else {
      form.reset({
        ...form.getValues(),
        firstName: "",
        lastName: "",
        companyName: "",
        countryRegion: ["", ""],
        addressLine1: "",
        addressLine2: "",
        postcode: "",
        email: "",
        panCard: "",
        phoneNumber: "",
      });
      setCountryName("IN");
      setStateName("");
    }
  }, [isLoggedIn, user, form]);

  async function onSubmit(values: DonationFormValues) {
    setIsSubmitting(true);
    setAlertInfo(null);

    const payload: {
      amount: number;
      caseId?: string;
      isAnonymous: boolean;
      donorDetails?: {
        firstName: string;
        lastName: string;
        companyName?: string;
        email?: string;
        panCard?: string;
        phoneNumber: string;
        address: {
          line1: string;
          line2?: string;
          state: string;
          country: string;
          zipCode: string;
        };
      };
    } = {
      amount: values.amount,
      caseId: values.caseId,
      isAnonymous: values.isAnonymous,
    };

    if (!values.isAnonymous && !isLoggedIn) {
      payload.donorDetails = {
        firstName: values.firstName!,
        lastName: values.lastName!,
        companyName: values.companyName || undefined,
        email: values.email || undefined,
        panCard: values.panCard || undefined,
        phoneNumber: values.phoneNumber!,
        address: {
          line1: values.addressLine1!,
          line2: values.addressLine2 || undefined,
          state: values.countryRegion![1],
          country: values.countryRegion![0] || "IN",
          zipCode: values.postcode!,
        },
      };
    }

    try {
      const response = await api.post("/api/donate", payload, {
        withCredentials: true,
      });

      if (response.status === 200) {
        setAlertInfo({
          title: "Payment initiated",
          description: "Redirecting you to our secure payment partner…",
          variant: "default",
        });
        window.location.href = response.data.paymentLink;
      } else {
        setAlertInfo({
          title: "Donation failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      let errorMessage = "Failed to process donation. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      setAlertInfo({
        title: "Donation error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div
        className={`flex min-h-[50vh] flex-col items-center justify-center gap-4 ${gigglesSurface.onSurfaceVariant}`}
      >
        <Loader2 className="h-9 w-9 animate-spin text-[#006a3d]" aria-hidden />
        <p className="text-sm font-medium text-[#2d2f31]">Loading your session…</p>
      </div>
    );
  }

  return (
    <div className={cn(gigglesPublicShell, "pb-14 pt-8 lg:pt-14")}>
      <div className="mb-14 flex flex-wrap items-start gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#ffca4d] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#755700]">
          <IndianRupee className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          Donate
        </span>
        {caseId ? (
          <span className="inline-flex items-center rounded-full bg-[#e4f6f5] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#006a3d]">
            Case-linked gift
          </span>
        ) : null}
      </div>

      <h1
        className={`${fontDisplay} mb-10 max-w-3xl text-[2.15rem] font-semibold tracking-[-0.02em] text-[#2d2f31] md:text-[2.75rem] lg:text-[3.2rem]`}
      >
        Give with confidence —{" "}
        <span className="block text-[#755700] md:inline md:leading-none">
          every rupee counts.
        </span>
      </h1>

      <p
        className={`mb-12 max-w-2xl text-[1.05rem] leading-relaxed md:text-[1.1rem] ${gigglesSurface.onSurfaceVariant}`}
      >
        Complete the form below to start a secure checkout. You can give anonymously (up to ₹50,000) or
        share details so we can thank you and send receipts.
      </p>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,360px)] lg:items-start xl:gap-14">
        <div className={cn(gigglesCard, "p-8 lg:p-10")}>
          {isLoggedIn ? (
            <div
              className={`mb-8 rounded-2xl px-4 py-3 text-sm ${gigglesSurface.containerLow} ${gigglesSurface.onSurfaceVariant}`}
            >
              You&apos;re signed in — we&apos;ll use your saved profile for this donation. Toggle
              anonymous if you prefer not to be named publicly.
            </div>
          ) : null}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                onSubmit,
                (_errors: FieldErrors<DonationFormValues>) => {
                  setAlertInfo({
                    title: "Check the form",
                    description: "Please correct the highlighted fields.",
                    variant: "destructive",
                  });
                }
              )}
              className="space-y-8"
            >
              {alertInfo ? (
                <div
                  className={cn(
                    "relative flex gap-3 rounded-2xl px-4 py-3 pr-12 text-sm",
                    alertInfo.variant === "default"
                      ? "bg-[#e8f5ee] text-[#0d4f2f]"
                      : "bg-[#fce8ee] text-[#8f1a3f]"
                  )}
                  role="status"
                >
                  <div>
                    <p className="font-semibold">{alertInfo.title}</p>
                    <p className="mt-1 opacity-90">{alertInfo.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertInfo(null)}
                    className="absolute right-3 top-3 rounded-lg p-1 opacity-70 hover:opacity-100"
                    aria-label="Dismiss message"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Amount (INR)</FormLabel>
                    <div className="flex flex-wrap gap-2 pb-2">
                      {PRESET_AMOUNTS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          className={cn(
                            "rounded-full px-4 py-2 text-sm font-semibold transition",
                            amount === v
                              ? "bg-[#006a3d] text-white shadow-[0_8px_20px_rgba(0,106,61,0.25)]"
                              : "bg-[#f0f0f3] text-[#2d2f31] hover:bg-[#e4e6ea]"
                          )}
                          onClick={() =>
                            form.setValue("amount", v, { shouldValidate: true })
                          }
                        >
                          ₹{v.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Or enter another amount"
                        className={fieldInputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      "flex flex-row items-start gap-4 space-y-0 rounded-2xl p-5",
                      gigglesSurface.containerLow
                    )}
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1 border-[#2d2f31]/25 data-[state=checked]:border-[#006a3d] data-[state=checked]:bg-[#006a3d]"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-snug">
                      <FormLabel className={cn(labelClass, "!mt-0 normal-case")}>
                        Donate anonymously
                      </FormLabel>
                      <FormDescription
                        className={cn(
                          "!mt-2 text-[0.85rem] leading-relaxed",
                          gigglesSurface.onSurfaceVariant
                        )}
                      >
                        Your name won&apos;t appear publicly. Anonymous gifts are limited to ₹50,000 per
                        transaction.
                      </FormDescription>
                    </div>
                    <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                  </FormItem>
                )}
              />

              {!isAnonymous && !isLoggedIn ? (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>First name</FormLabel>
                          <FormControl>
                            <Input className={fieldInputClass} placeholder="Given name" {...field} />
                          </FormControl>
                          <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Last name</FormLabel>
                          <FormControl>
                            <Input className={fieldInputClass} placeholder="Family name" {...field} />
                          </FormControl>
                          <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Company (optional)</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldInputClass}
                            placeholder="Organization name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="countryRegion"
                    render={() => (
                      <FormItem>
                        <FormLabel className={labelClass}>Country &amp; state</FormLabel>
                        <FormControl>
                          <div className={locationShellClass}>
                            <LocationSelector
                              countryCode={countryName}
                              stateName={stateName}
                              onCountryChange={(country) => {
                                const countryIso2 = country?.iso2 || "";
                                setCountryName(countryIso2);
                                form.setValue("countryRegion", [
                                  countryIso2,
                                  form.getValues("countryRegion")?.[1] || "",
                                ]);
                                form.trigger("countryRegion");
                              }}
                              onStateChange={(state) => {
                                const stateVal = state?.name || "";
                                setStateName(stateVal);
                                form.setValue("countryRegion", [
                                  form.getValues("countryRegion")?.[0] || "",
                                  stateVal,
                                ]);
                                form.trigger("countryRegion");
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Street address</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldInputClass}
                            placeholder="House number, street"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Address line 2 (optional)</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldInputClass}
                            placeholder="Apartment, suite, landmark"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>PIN / ZIP</FormLabel>
                        <FormControl>
                          <Input className={fieldInputClass} placeholder="e.g. 110003" {...field} />
                        </FormControl>
                        <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Phone</FormLabel>
                        <FormControl>
                          <div className={phoneShellClass}>
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                              defaultCountry="IN"
                              placeholder="e.g. +91 98765 43210"
                              className="w-full"
                            />
                          </div>
                        </FormControl>
                        <FormDescription
                          className={cn("text-[0.85rem]", gigglesSurface.onSurfaceVariant)}
                        >
                          We use this to link your gift to your account if you sign in later.
                        </FormDescription>
                        <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Email (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            className={fieldInputClass}
                            placeholder="you@example.org"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="panCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>PAN (optional)</FormLabel>
                        <FormControl>
                          <Input className={fieldInputClass} placeholder="ABCDE1234F" {...field} />
                        </FormControl>
                        <FormMessage className="text-[0.8rem] text-[#b7004d]" />
                      </FormItem>
                    )}
                  />
                </>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  btnPrimaryGiggles,
                  "w-full py-4 text-[0.95rem] sm:w-auto sm:min-w-[200px]",
                  isSubmitting && "pointer-events-none opacity-60"
                )}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Processing…
                  </span>
                ) : (
                  "Continue to pay"
                )}
              </button>
            </form>
          </Form>
        </div>

        <aside className="space-y-6">
          <div className={`rounded-[2rem] p-8 lg:p-9 ${gigglesSurface.containerLow}`}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_8px_20px_rgba(45,47,49,0.06)]">
                <ShieldCheck className="h-5 w-5 text-[#006a3d]" strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <p className={`text-sm font-semibold text-[#2d2f31]`}>Secure checkout</p>
                <p className={`mt-2 text-[0.9rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}>
                  You&apos;ll finish payment on our partner&apos;s encrypted page. We don&apos;t store
                  card numbers on this site.
                </p>
              </div>
            </div>
            <div className="my-8 border-t border-[#d8d8de]/80" aria-hidden />
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_8px_20px_rgba(45,47,49,0.06)]">
                <Lock className="h-5 w-5 text-[#755700]" strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <p className={`text-sm font-semibold text-[#2d2f31]`}>Receipts &amp; 80G</p>
                <p className={`mt-2 text-[0.9rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}>
                  Placeholder: eligible donations receive email receipts. Update this copy with your
                  actual tax exemption and timeline language.
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-[#0d3f2a] p-10 text-white shadow-[0_20px_44px_rgba(0,0,0,0.15)]">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,#006a3d_12%,transparent_72%)]" />
            <HeartHandshake className="relative h-6 w-6 text-[#ffca4d]" strokeWidth={1.75} />
            <p className={`relative ${fontDisplay} mt-4 text-xl font-semibold`}>
              Questions before you give?
            </p>
            <p className="relative mt-3 text-sm text-white/85">
              Our team can help with corporate giving, matching, or impact reports — placeholder text.
            </p>
            <Link
              to="/contact"
              className="relative mt-6 inline-flex text-sm font-bold text-[#ffca4d] underline-offset-4 hover:underline"
            >
              Contact us
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
