// frontend\src\components\admin\PdfReceiptGenerator.tsx
import React, { useState } from "react";
import { manualReceipt } from "@/services/api";
import { useAdminAuth } from "@/context/authContext";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";

const paymentModes = ["CASH", "CARD", "UPI", "NETBANKING", "OTHER"];

export function PdfReceiptGenerator() {
  const { hasPermission } = useAdminAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    title: "Mr.",
    address: { line1: "", line2: "", state: "", country: "", zipCode: "" },
    phoneNumber: "",
    pan: "",
    modeOfPayment: "CASH",
    amount: "",
    createdAt: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canAccess =
    hasPermission("create_case") ||
    hasPermission("edit_case") ||
    hasPermission("super_admin");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name in form.address) {
      setForm({ ...form, address: { ...form.address, [name]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Get the date parts from the form (YYYY-MM-DD)
      const [year, month, day] = form.createdAt.split("-").map(Number);

      // 2. Get the current time
      const now = new Date();

      // 3. Create a new date object combining both
      // Note: month is 0-indexed in JS (January is 0)
      const combinedDate = new Date(
        year,
        month - 1,
        day,
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
      );

      await manualReceipt({
        ...form,
        amount: parseFloat(form.amount),
        // 4. Send the ISO string of the combined date
        createdAt: combinedDate.toISOString(),
      });

      setSuccess("Receipt generated and sent successfully!");
      // Reset form logic...
      setForm({
        firstName: "",
        lastName: "",
        title: "Mr.",
        address: { line1: "", line2: "", state: "", country: "", zipCode: "" },
        phoneNumber: "",
        pan: "",
        modeOfPayment: "CASH",
        amount: "",
        createdAt: "",
        email: "",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="text-center py-8 text-red-500">Permission denied.</div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">
        Manual PDF Receipt Generator
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <select
          name="title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="Mr.">Mr.</option>
          <option value="Ms.">Ms.</option>
        </select>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={form.firstName}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={form.lastName}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Donor Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <div className="flex">
          <PhoneInput
            placeholder="Phone number"
            defaultCountry="IN"
            value={form.phoneNumber}
            onChange={(val) =>
              setForm({ ...form, phoneNumber: (val as string) || "" })
            }
          />
        </div>
        <input
          type="text"
          name="pan"
          placeholder="PAN"
          value={form.pan}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="line1"
          placeholder="Address Line 1"
          value={form.address.line1}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="line2"
          placeholder="Address Line 2"
          value={form.address.line2}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="state"
          placeholder="State"
          value={form.address.state}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="country"
          placeholder="Country"
          value={form.address.country}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="zipCode"
          placeholder="Zip Code"
          value={form.address.zipCode}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <select
          name="modeOfPayment"
          value={form.modeOfPayment}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          {paymentModes.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="date"
          name="createdAt"
          placeholder="Date"
          value={form.createdAt}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate & Send"}
        </Button>
      </form>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">{success}</div>}
    </div>
  );
}
