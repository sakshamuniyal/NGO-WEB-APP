"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/authContext";
import type { CountryCode } from "libphonenumber-js";
import { parsePhoneNumberWithError } from "libphonenumber-js";

import { Button } from "@/components/ui/button";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { ArrowRightIcon, UserPlusIcon, X } from "lucide-react";

import { api } from "@/services/api";
import {
  btnPrimaryGiggles,
  btnSecondaryGiggles,
  fontDisplay,
  fontBody,
  gigglesCard,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(5, "Phone number is too short"),
});

type AlertInfo = {
  title: string;
  description: string;
  variant: "default" | "destructive";
};

const otpSlotClass =
  "!border-0 h-14 w-11 rounded-xl bg-[#f0f0f3] text-lg font-semibold text-[#2d2f31] shadow-none ring-2 ring-transparent transition-shadow focus-within:ring-[#006a3d]/35 data-[active=true]:ring-[#006a3d]/45";

export default function LoginWithOTPForm() {
  const [step, setStep] = useState<"login" | "verify">("login");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fullPhoneNumber, setFullPhoneNumber] = useState("");
  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);

  const { isLoggedIn, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { countryCode: "IN", phone: "" },
  });

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoggedIn, authLoading, navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const maskPhoneNumber = (number: string) => {
    if (number.length <= 4) return number;
    try {
      const parsed = parsePhoneNumberWithError(number);
      if (parsed?.isValid()) {
        const n = parsed.nationalNumber;
        if (n.length <= 4) return number;
        const maskedNational = "*".repeat(n.length - 4) + n.slice(-4);
        return `+${parsed.countryCallingCode}${maskedNational}`;
      }
    } catch (e) {
      console.error("maskPhoneNumber:", e);
    }
    return "*".repeat(number.length - 4) + number.slice(-4);
  };

  async function requestOTP(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setAlertInfo(null);
    try {
      let parsedPhoneNumber;
      try {
        parsedPhoneNumber = parsePhoneNumberWithError(
          values.phone,
          values.countryCode as CountryCode
        );
      } catch {
        setAlertInfo({
          title: "Invalid Phone Number",
          description: "Check the digits and selected country.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!parsedPhoneNumber?.isValid()) {
        setAlertInfo({
          title: "Invalid Phone Number",
          description: "This number doesn't look valid for the selected region.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const fullE164PhoneNumber = parsedPhoneNumber.number;
      const { status } = await api.post(
        "api/auth/request-otp",
        { fullPhoneNumber: fullE164PhoneNumber },
        { withCredentials: true }
      );

      if (status === 200) {
        setAlertInfo({
          title: "Code sent",
          description: "Check your SMS inbox for the one-time password.",
          variant: "default",
        });
        setStep("verify");
        setResendCooldown(60);
        setFullPhoneNumber(fullE164PhoneNumber);
        localStorage.setItem("phoneNumber", fullE164PhoneNumber);
      }
    } catch (error: unknown) {
      let message = "Couldn't send OTP. Try again.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message ?? message;
      }
      setAlertInfo({ title: "Request failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAlertInfo(null);
    try {
      const storedPhoneNumber = localStorage.getItem("phoneNumber");
      if (!storedPhoneNumber) {
        setAlertInfo({
          title: "Session expired",
          description: "Send a new OTP to continue.",
          variant: "destructive",
        });
        setLoading(false);
        setStep("login");
        return;
      }

      const { status, data } = await api.post(
        "api/auth/verify-otp",
        { fullPhoneNumber: storedPhoneNumber, otp },
        { withCredentials: true }
      );

      if (status === 200) {
        if (data.user) await login(data.user);
        setAlertInfo({
          title: "Welcome back!",
          description: "Taking you inside your Impact Hub.",
          variant: "default",
        });
        navigate(data.isProfileComplete ? "/dashboard" : "/complete-profile");
      }
    } catch (error: unknown) {
      let message = "Verification failed.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message ?? message;
      }
      setAlertInfo({
        title: "Wrong or expired OTP",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !fullPhoneNumber) return;
    setLoading(true);
    setAlertInfo(null);
    try {
      const { status } = await api.post(
        "api/auth/request-otp",
        { fullPhoneNumber },
        { withCredentials: true }
      );
      if (status === 200) {
        setAlertInfo({
          title: "OTP resent",
          description: "A fresh code is on its way.",
          variant: "default",
        });
        setResendCooldown(60);
      }
    } catch (error: unknown) {
      let message = "Could not resend.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message ?? message;
      }
      setAlertInfo({ title: "Resend failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const marketingSide = (
    <div className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#dcf8ea] via-[#b8efd4] to-[#8fe4bc] lg:h-full lg:min-h-[560px] lg:rounded-none lg:rounded-bl-[2.5rem] lg:rounded-tl-[2.5rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-[-10%] h-64 w-64 rounded-full bg-white/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-72 w-72 rounded-full bg-[#006a3d]/10 blur-3xl"
      />
      <div className="relative z-[1] p-8 lg:p-12">
        <span className="inline-flex items-center rounded-full bg-[#ffca4d] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#755700]">
          Community driven
        </span>
      </div>
      <div className="relative z-[1] space-y-5 px-8 pb-10 lg:mt-auto lg:p-12">
        <p
          className={`${fontDisplay} text-[1.85rem] font-semibold leading-tight tracking-[-0.02em] text-[#07412a] lg:text-[2.1rem]`}
        >
          Every{" "}
          <span className="font-[Georgia,serif] italic text-[#755700] lowercase"> giggle </span>
          starts with a{" "}
          <span className="relative inline-block pb-2">
            choice
            <span
              className="absolute bottom-1 left-0 right-0 h-[0.125rem] rounded-full bg-[#b7004d]/70"
              aria-hidden
            />
          </span>
          .
        </p>
        <p className="max-w-[20rem] text-[0.95rem] leading-relaxed text-[#1d3f2f]">
          Join our mission for education, care, and sustainable joy across every community we
          serve.
        </p>
      </div>
    </div>
  );

  const alertBanner =
    alertInfo ? (
      <div
        role="status"
        className={cn(
          "relative mb-8 flex gap-3 rounded-2xl px-4 py-3 pr-12 text-sm",
          alertInfo.variant === "default"
            ? "bg-[#e8f5ee] text-[#0d4f2f]"
            : "bg-[#fce8ee] text-[#8f1a3f]"
        )}
      >
        <div className="min-w-0 flex-1">
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
    ) : null;

  return (
    <PublicPageLayout showFooter={false}>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-center bg-[#e8eae8] py-10 lg:py-14",
          fontBody
        )}
      >
        <div className={gigglesPublicShell}>
          <div
            className={cn(
              "w-full overflow-hidden lg:rounded-[2.5rem]",
              gigglesCard,
              "lg:grid lg:min-h-[560px] lg:grid-cols-2 lg:p-0"
            )}
          >
            <div className="hidden lg:flex">{marketingSide}</div>

            <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:p-14">
              <div className="mb-10 w-full lg:hidden">{marketingSide}</div>

              {alertBanner}

              <p className="w-full text-center text-[0.9rem] font-medium text-[#2d9170] lg:text-left">
                Giggles Foundation
              </p>
              {step === "login" ? (
            <>
              <h1
                className={`mt-5 w-full text-center text-[2rem] font-bold tracking-tight text-[#252628] lg:text-left ${fontDisplay}`}
              >
                Welcome back
              </h1>
              <p
                className={`mt-3 w-full text-center text-[0.95rem] leading-relaxed lg:text-left ${gigglesSurface.onSurfaceVariant}`}
              >
                Enter your mobile number to continue your journey of impact.
              </p>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(requestOTP)}
                  className="w-full space-y-8 pt-10"
                >
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#84878c]">
                          Mobile number
                        </FormLabel>
                        <FormControl>
                          <div className="w-full overflow-hidden rounded-full bg-[#f0f0f3] p-2 pr-4 shadow-inner">
                            <PhoneInput
                              {...field}
                              value={field.value}
                              onChange={field.onChange}
                              defaultCountry="IN"
                              international={true}
                              countrySelectProps={{
                                defaultCountry: "IN",
                                onCountryChange: (country?: CountryCode) =>
                                  form.setValue("countryCode", country || "IN"),
                              }}
                              className="w-full [&_input]:h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_button]:shrink-0 [&_button]:rounded-l-full [&_button]:border-0 [&_button]:bg-transparent"
                              placeholder=""
                            />
                          </div>
                        </FormControl>
                        <FormDescription className={`text-xs ${gigglesSurface.onSurfaceVariant}`}>
                          OTP works for WhatsApp-supported numbers registered in India and abroad.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`${btnPrimaryGiggles} flex min-h-[3.25rem] w-full items-center justify-center gap-2 py-4`}
                  >
                    {loading ? "Sending…" : "Get OTP"}
                    <ArrowRightIcon className="h-5 w-5" aria-hidden />
                  </Button>

                  <div className="flex items-center gap-4 pt-6">
                    <div className="h-px flex-1 bg-[#dadde3]" aria-hidden />
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#95979c]">
                      New to giggles?
                    </span>
                    <div className="h-px flex-1 bg-[#dadde3]" aria-hidden />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className={cn(btnSecondaryGiggles, "w-full")}
                    asChild
                  >
                    <Link to="/" className="inline-flex justify-center gap-2">
                      <UserPlusIcon className="h-4 w-4" />
                      Explore first — OTP creates your account on verify
                    </Link>
                  </Button>

                  <p className={`text-center text-[0.7rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}>
                    By continuing you agree to the{" "}
                    <button type="button" className="font-semibold text-[#006a3d] hover:underline">
                      Privacy Policy
                    </button>{" "}
                    &amp;{" "}
                    <button type="button" className="font-semibold text-[#006a3d] hover:underline">
                      Terms of Service
                    </button>
                    .
                  </p>
                </form>
              </Form>
            </>
          ) : (
            <>
              <h2
                className={`mt-2 w-full text-center text-[1.75rem] font-bold tracking-tight text-[#252628] lg:text-left ${fontDisplay}`}
              >
                Verify your identity
              </h2>
              <p
                className={`mt-4 w-full text-center text-[0.9rem] lg:text-left ${gigglesSurface.onSurfaceVariant}`}
              >
                Code sent to{" "}
                <strong className="text-[#252628]">{maskPhoneNumber(fullPhoneNumber)}</strong>
              </p>

              <form onSubmit={verifyOTP} className="mt-12 w-full space-y-10">
                <div className="flex w-full justify-center lg:justify-start">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                    containerClassName="w-full justify-center gap-0 sm:justify-start"
                  >
                    <InputOTPGroup className="gap-2 sm:gap-3">
                      <InputOTPSlot index={0} className={otpSlotClass} />
                      <InputOTPSlot index={1} className={otpSlotClass} />
                      <InputOTPSlot index={2} className={otpSlotClass} />
                    </InputOTPGroup>
                    <InputOTPSeparator className="mx-1 text-[#b8bcbf] sm:mx-2" />
                    <InputOTPGroup className="gap-2 sm:gap-3">
                      <InputOTPSlot index={3} className={otpSlotClass} />
                      <InputOTPSlot index={4} className={otpSlotClass} />
                      <InputOTPSlot index={5} className={otpSlotClass} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="submit"
                  className={`${btnPrimaryGiggles} flex min-h-[3.25rem] w-full items-center justify-center gap-2 py-4`}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying…" : "Verify & proceed"}
                </Button>

                <div className="flex w-full flex-col items-center gap-3 text-sm lg:items-start">
                  <button
                    type="button"
                    className={`font-semibold ${resendCooldown > 0 ? "text-[#aab]" : "text-[#006a3d] hover:underline"}`}
                    onClick={() => void handleResendOTP()}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    className={`text-[0.8rem] ${gigglesSurface.onSurfaceVariant} hover:text-[#2d2f31]`}
                    onClick={() => {
                      setStep("login");
                      setOtp("");
                      setAlertInfo(null);
                    }}
                  >
                    Edit phone number
                  </button>
                </div>
              </form>
            </>
          )}
            </div>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
