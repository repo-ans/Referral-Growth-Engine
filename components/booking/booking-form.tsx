"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAvailableSlots, submitBooking } from "@/lib/actions/booking";
import { SERVICE_TYPES, URGENCY_LEVELS } from "@/lib/definitions";
import {
  SnowflakeIcon,
  WrenchIcon,
  FlameIcon,
  TuneUpIcon,
  HeatPumpIcon,
  WindIcon,
  AlertTriangleIcon,
  HelpCircleIcon,
  ClockIcon,
  LoaderIcon,
} from "./icons";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  CalendarIcon,
} from "@/components/dashboard/icons";

const inputClasses =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100";

const SERVICE_ICONS: Record<(typeof SERVICE_TYPES)[number], typeof SnowflakeIcon> = {
  "AC Repair": SnowflakeIcon,
  "New AC Unit": WrenchIcon,
  "Heating / Furnace": FlameIcon,
  "Tune-Up / Maintenance": TuneUpIcon,
  "Heat Pump": HeatPumpIcon,
  "Air Quality": WindIcon,
  Emergency: AlertTriangleIcon,
  "Other / Not Sure": HelpCircleIcon,
};

const URGENCY_LABELS: Record<(typeof URGENCY_LEVELS)[number], string> = {
  emergency: "🔴 Emergency",
  today: "Today",
  "this-week": "This week",
  flexible: "I'm flexible",
};

const SLOTS = [
  { label: "8:00 – 10:00 AM", startClock: "08:00", hour: 8 },
  { label: "10:00 AM – 12:00 PM", startClock: "10:00", hour: 10 },
  { label: "12:00 – 2:00 PM", startClock: "12:00", hour: 12 },
  { label: "2:00 – 4:00 PM", startClock: "14:00", hour: 14 },
  { label: "4:00 – 6:00 PM", startClock: "16:00", hour: 16 },
  { label: "6:00 – 8:00 PM", startClock: "18:00", hour: 18 },
];

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function serviceCategory(serviceType: string | null) {
  if (serviceType === "Tune-Up / Maintenance") return "maintenance";
  if (serviceType === "New AC Unit" || serviceType === "Other / Not Sure") return "install";
  return "repair";
}
function mondayOf(offsetWeeks: number, today: Date) {
  const d = new Date(today);
  let dow = d.getDay();
  if (dow === 0) dow = 7;
  d.setDate(d.getDate() - (dow - 1));
  d.setDate(d.getDate() + offsetWeeks * 7);
  return d;
}
function businessDays(offsetWeeks: number, category: string, today: Date) {
  const monday = mondayOf(offsetWeeks, today);
  const maxDays = category === "maintenance" ? 5 : 6;
  const days: Date[] = [];
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (offsetWeeks === 0 && d < today) continue;
    days.push(d);
  }
  return days;
}
function hourFromIso(iso: string) {
  const t = iso.indexOf("T");
  return t !== -1 ? parseInt(iso.slice(t + 1, t + 3), 10) : parseInt(iso.slice(0, 2), 10);
}
// Add N hours to a full ISO string, preserving its offset — mirrors
// index.html's addHours() (GHL's free-slots response includes the
// location's UTC offset, e.g. "-05:00", which must round-trip untouched).
function addHours(iso: string, n: number) {
  const offsetMatch = iso.match(/([+-]\d{2}:\d{2}|Z)$/);
  const offset = offsetMatch ? offsetMatch[0] : "";
  const base = offset ? iso.slice(0, iso.length - offset.length) : iso;
  const parts = base.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!parts) return iso;
  let hour = parseInt(parts[2], 10) + n;
  let datePart = parts[1];
  if (hour >= 24) {
    hour -= 24;
    const d = new Date(`${datePart}T12:00:00`);
    d.setDate(d.getDate() + 1);
    datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return `${datePart}T${pad(hour)}:${parts[3]}:${parts[4]}${offset}`;
}

type Step = 1 | 2 | 3;

export function BookingForm({
  userId,
  firstName,
  lastName,
  phone,
  email,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const draftKey = `booking-draft:${userId}`;
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [step, setStep] = useState<Step>(1);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [step1Touched, setStep1Touched] = useState(false);
  const [step3Touched, setStep3Touched] = useState(false);

  // Resume step-1 progress if they navigated away (e.g. via the navbar's
  // "Book Appointment" button) before finishing — see lib/dal.ts's
  // canBookAppointment(), which is what makes that button reappear.
  // Scoped per-user since a shared browser could otherwise leak a draft.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<{
        serviceType: string;
        urgency: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        notes: string;
      }>;
      if (draft.serviceType) setServiceType(draft.serviceType);
      if (draft.urgency) setUrgency(draft.urgency);
      if (draft.address) setAddress(draft.address);
      if (draft.city) setCity(draft.city);
      if (draft.state) setStateVal(draft.state);
      if (draft.zip) setZip(draft.zip);
      if (draft.notes) setNotes(draft.notes);
      // eslint-disable-next-line no-empty
    } catch {}
    // Only ever restore once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const draft = { serviceType, urgency, address, city, state: stateVal, zip, notes };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      // eslint-disable-next-line no-empty
    } catch {}
  }, [draftKey, serviceType, urgency, address, city, stateVal, zip, notes]);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [freeIsoSlots, setFreeIsoSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    label: string;
    startIso: string;
    endIso: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successAt, setSuccessAt] = useState<Date | null>(null);

  const category = serviceCategory(serviceType);
  const days = useMemo(
    () => businessDays(weekOffset, category, today),
    [weekOffset, category, today]
  );

  useEffect(() => {
    // Selected day fell out of range after a week/category change.
    if (selectedDay && !days.some((d) => isSameDay(d, selectedDay))) {
      setSelectedDay(null);
      setSelectedSlot(null);
    }
  }, [days, selectedDay]);

  useEffect(() => {
    if (!selectedDay || step !== 2) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSelectedSlot(null);
    getAvailableSlots(ymd(selectedDay))
      .then((slots) => {
        if (!cancelled) setFreeIsoSlots(slots);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDay, step]);

  const allowedSlots = SLOTS.filter((s) => {
    if (!selectedDay) return false;
    if (category === "maintenance") {
      const isWeekday = selectedDay.getDay() >= 1 && selectedDay.getDay() <= 5;
      if (!isWeekday) return false;
      return s.hour >= 10 && s.hour < 15;
    }
    return true;
  });

  function validateStep1() {
    return !!serviceType && !!urgency && zip.trim().length > 0;
  }

  function goToStep2() {
    setStep1Touched(true);
    if (!validateStep1()) return;
    setWeekOffset(0);
    setSelectedDay(null);
    setStep(2);
  }

  async function handleSubmit() {
    setStep3Touched(true);
    if (!smsConsent || !marketingConsent || !selectedSlot || !serviceType || !urgency) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitBooking({
      serviceType: serviceType as (typeof SERVICE_TYPES)[number],
      urgency: urgency as (typeof URGENCY_LEVELS)[number],
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: stateVal.trim() || undefined,
      postalCode: zip.trim(),
      notes: notes.trim() || undefined,
      startTime: selectedSlot.startIso,
      endTime: selectedSlot.endIso,
      smsConsent: true,
      marketingConsent: true,
    });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    try {
      localStorage.removeItem(draftKey);
      // eslint-disable-next-line no-empty
    } catch {}
    setSuccessAt(selectedDay);
  }

  if (successAt && selectedSlot) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950">
          <CheckIcon className="h-7 w-7 text-teal-600 dark:text-teal-400" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
          You&apos;re on the schedule!
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          A confirmation will be sent to <strong>{phone || email}</strong>.
          <br />
          We&apos;ll call you within 15 minutes to confirm.
        </p>
        <div className="mt-5 flex items-center gap-3 rounded-lg bg-teal-600 p-4 text-left">
          <CalendarIcon className="h-6 w-6 shrink-0 text-white" />
          <div>
            <p className="text-sm font-semibold text-white">
              {DAY_FULL[successAt.getDay()]}, {MONTH_ABBR[successAt.getMonth()]}{" "}
              {successAt.getDate()}
            </p>
            <p className="text-xs text-teal-100">{selectedSlot.label}</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Go to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-2">
        {([1, 2, 3] as Step[]).map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold " +
                (n < step
                  ? "bg-teal-600 text-white"
                  : n === step
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800")
              }
            >
              {n < step ? <CheckIcon className="h-3.5 w-3.5" /> : n}
            </div>
            {i < 2 && (
              <div
                className={
                  "h-0.5 w-8 " + (n < step ? "bg-teal-600" : "bg-zinc-200 dark:bg-zinc-800")
                }
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-medium text-zinc-500">
        <span>Service</span>
        <span>Schedule</span>
        <span>Confirm</span>
      </div>

      {step === 1 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            What do you need help with?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {SERVICE_TYPES.map((type) => {
              const ServiceIcon = SERVICE_ICONS[type];
              const selected = serviceType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setServiceType(type)}
                  className={
                    "cursor-pointer rounded-md border p-3 text-center transition-colors " +
                    (selected
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950"
                      : "border-zinc-200 hover:border-teal-400 dark:border-zinc-800")
                  }
                >
                  <ServiceIcon
                    className={
                      "mx-auto h-5 w-5 " +
                      (selected ? "text-teal-600 dark:text-teal-400" : "text-zinc-400")
                    }
                  />
                  <span className="mt-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    {type}
                  </span>
                </button>
              );
            })}
          </div>
          {step1Touched && !serviceType && (
            <p className="mt-1.5 text-xs text-red-600">Please select a service.</p>
          )}

          <p className="mt-5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            How urgent is this?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {URGENCY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setUrgency(level)}
                className={
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                  (urgency === level
                    ? "border-orange-600 bg-orange-600 text-white"
                    : "border-zinc-200 text-slate-700 hover:border-orange-400 dark:border-zinc-800 dark:text-slate-300")
                }
              >
                {URGENCY_LABELS[level]}
              </button>
            ))}
          </div>
          {step1Touched && !urgency && (
            <p className="mt-1.5 text-xs text-red-600">Please select an urgency.</p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500">Name</label>
              <p className="mt-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300">
                {firstName} {lastName}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500">Phone</label>
              <p className="mt-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300">
                {phone || "—"}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="address" className="block text-sm font-medium">
              Street address{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              autoComplete="street-address"
              className={inputClasses}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium">
                City <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin"
                autoComplete="address-level2"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium">
                State <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id="state"
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                placeholder="TX"
                maxLength={2}
                autoComplete="address-level1"
                className={inputClasses}
              />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="zip" className="block text-sm font-medium">
              ZIP code
            </label>
            <input
              id="zip"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="78701"
              maxLength={10}
              autoComplete="postal-code"
              className={inputClasses}
            />
            {step1Touched && !zip.trim() && (
              <p className="mt-1 text-xs text-red-600">Required</p>
            )}
          </div>

          <button
            type="button"
            onClick={goToStep2}
            className="mt-5 w-full cursor-pointer rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Continue — pick a date &amp; time
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" /> Back
          </button>

          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Pick a date &amp; time
          </p>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 disabled:opacity-30 dark:border-zinc-800"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {days.length > 0 &&
                `${MONTH_ABBR[days[0].getMonth()]} ${days[0].getDate()} – ${MONTH_ABBR[days[days.length - 1].getMonth()]} ${days[days.length - 1].getDate()}`}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div
            className="mt-3 grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, 1fr)` }}
          >
            {days.map((d) => {
              const selected = !!selectedDay && isSameDay(d, selectedDay);
              return (
                <button
                  key={ymd(d)}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={
                    "cursor-pointer rounded-md border py-1.5 text-center transition-colors " +
                    (selected
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-zinc-200 hover:border-teal-400 dark:border-zinc-800")
                  }
                >
                  <div
                    className={
                      "text-[10px] font-semibold " +
                      (selected ? "text-teal-100" : "text-zinc-400")
                    }
                  >
                    {DAY_ABBR[d.getDay()]}
                  </div>
                  <div className="text-sm font-bold">{d.getDate()}</div>
                  <div
                    className={
                      "text-[9px] " + (selected ? "text-teal-100" : "text-zinc-400")
                    }
                  >
                    {MONTH_ABBR[d.getMonth()]}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            {!selectedDay && (
              <p className="py-6 text-center text-xs text-zinc-400">
                Select a day to see available times.
              </p>
            )}
            {selectedDay && slotsLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-400">
                <LoaderIcon className="h-4 w-4 animate-spin" /> Checking availability…
              </div>
            )}
            {selectedDay && !slotsLoading && (
              <div className="grid grid-cols-2 gap-2">
                {allowedSlots.map((s) => {
                  const hourMap = new Map(
                    freeIsoSlots.map((iso) => [hourFromIso(iso), iso] as const)
                  );
                  const iso = hourMap.get(s.hour);
                  const available = !!iso;
                  const selected = selectedSlot?.label === s.label;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        if (!iso) return;
                        setSelectedSlot({
                          label: s.label,
                          startIso: iso,
                          endIso: addHours(iso, 2),
                        });
                      }}
                      className={
                        "flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 " +
                        (selected
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-zinc-200 hover:border-teal-400 dark:border-zinc-800")
                      }
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedSlot}
            onClick={() => setStep(3)}
            className="mt-5 w-full cursor-pointer rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Review &amp; confirm
          </button>
        </div>
      )}

      {step === 3 && selectedDay && selectedSlot && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" /> Back
          </button>

          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Confirm your appointment
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm font-semibold text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300">
            <CalendarIcon className="h-4.5 w-4.5 shrink-0" />
            {DAY_FULL[selectedDay.getDay()]}, {MONTH_ABBR[selectedDay.getMonth()]}{" "}
            {selectedDay.getDate()} · {selectedSlot.label}
          </div>

          <div className="mt-3 space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex justify-between">
              <span className="text-zinc-500">Service</span>
              <span className="font-medium">{serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Urgency</span>
              <span className="font-medium">
                {urgency ? URGENCY_LABELS[urgency as (typeof URGENCY_LEVELS)[number]] : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Name</span>
              <span className="font-medium">
                {firstName} {lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Phone</span>
              <span className="font-medium">{phone || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-zinc-500">Address</span>
              <span className="text-right font-medium">
                {[address, city, stateVal].filter(Boolean).join(", ") || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">ZIP</span>
              <span className="font-medium">{zip}</span>
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="notes" className="block text-sm font-medium">
              Anything else we should know?{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Model/brand, description of problem, access instructions…"
              rows={3}
              className={inputClasses + " resize-none"}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label
              className={
                "flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 " +
                (step3Touched && !smsConsent
                  ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                  : "border-zinc-200 dark:border-zinc-800")
              }
            >
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-orange-600"
              />
              <span>
                I consent to receive SMS notifications and alerts from Grande Air
                Solutions. Message frequency varies. Message and data rates may
                apply. Text HELP to (512) 677-4424 for assistance. You can reply
                STOP to unsubscribe at any time.
              </span>
            </label>
            <label
              className={
                "flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 " +
                (step3Touched && !marketingConsent
                  ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                  : "border-zinc-200 dark:border-zinc-800")
              }
            >
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-orange-600"
              />
              <span>
                By checking this box, I agree to receive occasional marketing
                messages from Grande Air Solutions. Message frequency varies.
                Message and data rates may apply. Text HELP to (512) 677-4424 for
                assistance.
              </span>
            </label>
          </div>

          {submitError && (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 w-full cursor-pointer rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Booking…" : "Book My Appointment"}
          </button>
        </div>
      )}
    </div>
  );
}
