// src/pages/events/EventPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "cn";
import { Icon } from "@iconify/react";
import { Pencil, Plus, MoreVertical, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  listEvents,
  deleteEvent,
  getEvent,
  updateEvent,
  createEvent,
} from "../../lib/api/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DateTimePicker } from "@/components/date-time-picker";
import { Section } from "@/components/common/Section";
import LocationPickerModal from "../../core/map/LocationPickerModal";
import LocationPickerButton from "../../core/map/LocationPickerButton";
import { useModalContext } from "@/components/modal-provider";
import type { LocationPickerHandle } from "../../core/map/LocationPickerModal";
import type { VenueSport } from "../../data/sitesMeta";
import { ALL_SPORT_OPTIONS } from "../../data/sports";

/* ---------------- Types ---------------- */
export type Event = {
  _id: string;
  name: string;
  location?:
    | {
        type?: string;
        coordinates: number[];
      }
    | any;
  region?: string | null;
  sport?: string | null;
  status?: string | null;
  datetime: Date | string;
  venue?: string | null;
  updatedAt?: Date | any;
};

export type EventStatusValue = "published" | "draft" | "archived";

export type EventStatus = {
  label: string;
  value: EventStatusValue;
  color: string;
};

const STATUSES: EventStatus[] = [
  { label: "Published", value: "published", color: "bg-green-500/20" },
  { label: "Draft", value: "draft", color: "bg-yellow-500/20" },
  { label: "Archived", value: "archived", color: "bg-gray-500/20" },
];

/* --------------- Page --------------- */
export function EventPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  // const [search, setSearch] = useState("");
  // const [sort, setSort] = useState<"updated" | "name">("updated");

  async function loadEvents() {
    setLoading(true);
    try {
      let items: Event[] = [];

      items = (await listEvents()) as Event[];

      // sort
      items.sort((a: any, b: any) => {
        // if (sort === "updated") {
        //   const at = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        //   const bt = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        //   if (bt !== at) return bt - at;
        // }
        return (a.name || "").localeCompare(b.name || "");
      });

      setEvents(items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteEvent(t: Event) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    await deleteEvent(t._id);
    await loadEvents();
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      {/* Top bar */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
          {/* Title + subtitle */}
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg md:text-xl font-semibold tracking-tight text-foreground/90">
              <span className="truncate">Events</span>
            </h2>
            <p className="mt-0.5 text-sm text-foreground/70 truncate">
              Browse and manage events.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={() => navigate("/admin/events/new")}
              className="inline-flex items-center gap-2"
            >
              <Plus />
              <span>New event</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {/* <Section title="Filters">
        <div className="grid gap-4 md:grid-cols-6">

          <Field className="md:col-span-3">
            <FieldLabel htmlFor="search">Search</FieldLabel>
            <Input
              id="search"
              placeholder="Name, address, tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Select
              value={categoryId}
              onValueChange={(value) => {
                if (value !== null) {
                  setCategoryId(value);
                }
              }}
            >
              <SelectTrigger
                id="category"
                className="w-full"
              >
                <SelectValue>
                  {CATEGORIES.find((c) => c.id === categoryId)?.label}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="zone">Zone</FieldLabel>
            <Select
              value={zoneId}
              onValueChange={(value) => {
                if (value !== null) {
                  setZoneId(value);
                }
              }}
              disabled={zonesLoading || zones.length === 0}
            >
              <SelectTrigger
                id="zone"
                className="w-full"
              >
                <SelectValue>
                  {zoneId === ALL_ZONES
                    ? "(All zones)"
                    : zones.find((z) => z.id === zoneId)?.name}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {zones.length > 0 && (
                  <SelectItem value={ALL_ZONES}>
                    (All zones)
                  </SelectItem>
                )}

                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              {
                zonesLoading
                  ? "Loading zones…"
                  : zones.length === 0
                    ? "No zones for this category — showing root collection."
                    : undefined
              }
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="sort">Sort by</FieldLabel>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (value !== null) {
                  setSort(value as any);
                }
              }}
            >
              <SelectTrigger
                id="sort"
                className="w-full"
              >
                <SelectValue>
                  {sort === "updated" ? "Last updated" : "Name (A→Z)"}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="updated">
                  Last updated
                </SelectItem>
                <SelectItem value="name">
                  Name (A→Z)
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section> */}

      {/* Cards */}
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <div className="col-span-full grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="overflow-hidden rounded-3xl">
                <Skeleton className="w-full aspect-video bg-foreground/20" />
                <Skeleton className="p-4 space-y-3">
                  <Skeleton className="h-4 w-1/2 rounded bg-foreground/20" />
                  <Skeleton className="h-3 w-2/3 rounded bg-foreground/20" />
                  <Skeleton className="h-8 w-full rounded bg-foreground/20" />
                </Skeleton>
              </Skeleton>
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <Empty className="col-span-full border border-foreground/30 p-8 text-foreground/50 shadow-sm">
            <EmptyHeader>
              <EmptyDescription className="text-center text-sm text-foreground/50">
                No events found
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="default"
                onClick={() => navigate("/admin/events/new")}
                className="inline-flex items-center gap-2"
              >
                <Plus />
                <span>New event</span>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!loading &&
          events.map((item, index) => {
            const sport = ALL_SPORT_OPTIONS.find((s) => s.key === item.sport);
            const status = STATUSES.find((s) => s.value === item.status);

            return (
              <Card
                key={index}
                size="sm"
                className="relative mx-auto w-full max-w-sm"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="absolute end-4 top-4 z-20"
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("more_actions", "More actions")}
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <MoreVertical />
                        <span className="sr-only">Open actions</span>
                      </Button>
                    }
                  />

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => handleDeleteEvent(item)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* body */}
                <CardHeader>
                  <CardTitle
                    className={cn(
                      "flex items-center justify-start gap-2",
                      "font-semibold leading-tight text-foreground/90"
                    )}
                  >
                    <span className="block truncate">{item.name}</span>
                    <Badge
                      variant="secondary"
                      className={cn(status?.color ?? "bg-gray-500")}
                    >
                      {status?.label ?? "Unknown"}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex items-center gap-2">
                  {sport?.icon && (
                    <Icon icon={sport.icon} width={16} height={16} />
                  )}
                  <span className="text-sm text-foreground/70">
                    {sport?.label ?? "Unknown"}
                  </span>
                </CardContent>

                <CardContent>
                  {item.venue && (
                    <CardDescription>{item.venue}</CardDescription>
                  )}

                  {item.datetime && (
                    <CardDescription>
                      {new Date(item.updatedAt).toLocaleDateString(lang, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  )}
                </CardContent>

                <CardFooter className="w-full flex-1 flex-col items-end gap-2">
                  <div className="text-xs text-muted-foreground">
                    {item.updatedAt?.toDate
                      ? new Date(item.updatedAt.toDate()).toLocaleString()
                      : ""}
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate(`/admin/events/${item._id}`)}
                  >
                    <Pencil />
                    <span>{t("edit", "Edit")}</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

export function AddEventPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // base fields
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [venue, setVenue] = useState("");
  const [datetime, setDatetime] = useState<Date | undefined>(undefined);
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [region, setRegion] = useState("");
  const [sport, setSport] = useState<VenueSport["key"] | "">("");

  // UX state
  const [saving, setSaving] = useState(false);

  const canSave = !!name && lat !== "" && lng !== "" && !saving;

  const { isOpen, setIsOpen, setModalContent } = useModalContext();
  const pickerRef = useRef<LocationPickerHandle>(null);

  const openModal = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setModalContent({
      title: "Select location",
      size: "lg",
      children: (
        <LocationPickerModal
          ref={pickerRef}
          isOpen={true}
          onClose={() => setIsOpen(false)}
          initialLat={typeof lat === "number" ? lat : undefined}
          initialLng={typeof lng === "number" ? lng : undefined}
          onSelect={(selLat, selLng) => {
            setLat(selLat);
            setLng(selLng);
          }}
        />
      ),
      footer: (
        <>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button onClick={() => pickerRef.current?.useLocation()}>
            Use this location
          </Button>
        </>
      ),
      onClose: () => setIsOpen(false),
    });
    setIsOpen(true);
  };

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const docRef = await createEvent({
        name,
        sport: sport || "",
        region: region || "",
        location: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        datetime: datetime || new Date(),
        status: status || "",
        venue: venue,
      });

      console.log("Event created:", docRef);
      toast.success(
        t("events.eventcreate.sucess", "Event created successfully")
      );
      window.scrollTo({ top: 0, behavior: "smooth" });

      // reset form
      setName("");
      setVenue("");
      setDatetime(undefined);
      setStatus("");
      setRegion("");
      setLat(0);
      setLng(0);
      setSport("");
    } catch (e) {
      console.error(e);
      toast.error(
        t(
          "events.eventcreate.error",
          "Failed to create event. Check your permissions/rules and try again."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft />
            {t("back", "Back")}
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {t("events.newevent.title", "Add a Event")}
            </h2>
            <p className="mt-1 text-sm text-foreground/70">
              {t(
                "events.newevent.description",
                "Create a new event and add it to the map."
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" onClick={onSave} disabled={!canSave}>
            {saving
              ? t("events.save.saving", "Saving…")
              : t("events.save.create", "Create event")}
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              setName("");
              setRegion("");
              setStatus("");
              setVenue("");
              setDatetime(undefined);
              setLat("");
              setLng("");
              setSport("");
            }}
          >
            {t("events.reset", "Reset")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form column - left */}
        <div className="lg:col-span-8 space-y-6">
          <FormComp
            name={name}
            setName={setName}
            status={status}
            setStatus={setStatus}
            venue={venue}
            setVenue={setVenue}
            datetime={datetime}
            setDatetime={setDatetime}
            lat={lat}
            setLat={setLat}
            lng={lng}
            setLng={setLng}
            region={region}
            setRegion={setRegion}
            sport={sport}
            setSport={setSport}
            openModal={openModal}
          />
        </div>
      </div>
    </div>
  );
}

export function EditEventPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const params = useParams();
  const eventId = params.eventId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [sport, setSport] = useState<VenueSport["key"] | "">("");
  const [status, setStatus] = useState("");
  const [venue, setVenue] = useState("");
  const [datetime, setDatetime] = useState<Date | undefined>(undefined);
  const [region, setRegion] = useState("");

  const canSave = !!eventId && !!name && lat !== "" && lng !== "" && !saving;

  const { isOpen, setIsOpen, setModalContent } = useModalContext();
  const pickerRef = useRef<LocationPickerHandle>(null);

  const openModal = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setModalContent({
      title: "Select location",
      size: "lg",
      children: (
        <LocationPickerModal
          ref={pickerRef}
          isOpen={true}
          onClose={() => setIsOpen(false)}
          initialLat={typeof lat === "number" ? lat : undefined}
          initialLng={typeof lng === "number" ? lng : undefined}
          onSelect={(selLat, selLng) => {
            setLat(selLat);
            setLng(selLng);
          }}
        />
      ),
      footer: (
        <>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button onClick={() => pickerRef.current?.useLocation()}>
            Use this location
          </Button>
        </>
      ),
      onClose: () => setIsOpen(false),
    });
    setIsOpen(true);
  };

  /* ---------- Load ---------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getEvent(eventId);
        if (!snap) {
          toast.error(t("events.notfound", "Event not found."));
          return;
        }
        const d = snap as Event;

        setName(d.name || "");
        setLat(d.location.coordinates?.[1] ?? "");
        setLng(d.location.coordinates?.[0] ?? "");
        setSport((d.sport as VenueSport["key"]) || "");
        setStatus(d.status || "");
        setVenue(d.venue || "");
        setDatetime(d.datetime ? new Date(d.datetime) : undefined);
        setRegion(d.region || "");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  /* ---------- Save ---------- */
  async function onSave() {
    setSaving(true);
    try {
      await updateEvent(eventId, {
        name,
        sport: sport || null,
        location: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        status: status || null,
        venue: venue,
        datetime: datetime || null,
        region: region || null,
      });
      toast.success(t("events.eventupdate.success", "Changes saved."));
    } catch (e) {
      console.error(e);

      toast.error(t("events.eventupdate.error", "Failed to save changes."));
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Delete / Duplicate ---------- */
  async function onDelete() {
    if (
      !confirm(
        t("events.delete.confirm", "Delete this event? This cannot be undone.")
      )
    )
      return;
    await deleteEvent(eventId);
    navigate("/admin/events");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 mx-auto max-w-5xl p-6 text-sm text-foreground/70">
        <Spinner />
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      {/* Top bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {t("events.editevent.title", "Edit event")}
            </h2>
            <p className="mt-1 text-sm text-foreground/70">
              {t(
                "events.editevent.description",
                "Update details, visuals, links"
              )}
              {/* {isRoot(zoneParam) ? "" : " — zone-scoped"}. */}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
          <Button onClick={onSave} disabled={!canSave}>
            {saving
              ? t("events.save.saving", "Saving…")
              : t("events.save.edit", "Save changes")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          <FormComp
            name={name}
            setName={setName}
            status={status}
            setStatus={setStatus}
            venue={venue}
            setVenue={setVenue}
            datetime={datetime}
            setDatetime={setDatetime}
            lat={lat}
            setLat={setLat}
            lng={lng}
            setLng={setLng}
            region={region}
            setRegion={setRegion}
            sport={sport}
            setSport={setSport}
            openModal={openModal}
          />
        </div>
      </div>
    </div>
  );
}

const FormComp = ({
  name,
  setName,
  status,
  setStatus,
  venue,
  setVenue,
  datetime,
  setDatetime,
  lat,
  setLat,
  lng,
  setLng,
  region,
  setRegion,
  sport,
  setSport,
  openModal,
}: {
  name: string;
  setName: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  venue: string;
  setVenue: (value: string) => void;
  datetime?: Date;
  setDatetime: (value?: Date) => void;
  lat: number | "";
  setLat: (value: number | "") => void;
  lng: number | "";
  setLng: (value: number | "") => void;
  region: string;
  setRegion: (value: string) => void;
  sport: VenueSport["key"] | "";
  setSport: (value: VenueSport["key"] | "") => void;
  openModal: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Section title={t("events.basic.title", "Basic details")}>
        <div className="grid gap-4 sm:grid-cols-1">
          <Field>
            <FieldLabel htmlFor="name">
              {t("events.fields.name", "Event name")}
            </FieldLabel>
            <Input
              required
              id="name"
              placeholder="e.g. Opening Ceremony"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-1">
          <Field>
            <FieldLabel htmlFor="status">
              {t("events.fields.status", "Event status")}
            </FieldLabel>
            <ToggleGroup
              value={[status]}
              onValueChange={(value) => {
                if (value.length > 0) {
                  setStatus(value[0]);
                }
              }}
              variant="outline"
            >
              {STATUSES.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className={status === option.value ? "border-primary" : ""}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        </div>

        {ALL_SPORT_OPTIONS.length === 0 ? (
          <p className="text-sm text-foreground/70">
            No sport options found in site meta.
          </p>
        ) : (
          <Field>
            <FieldLabel htmlFor="sport">
              {t("events.fields.sport", "Sport")}
            </FieldLabel>
            <Select
              value={sport}
              onValueChange={(value) => setSport(value || "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a sport">
                  <Icon
                    icon={
                      ALL_SPORT_OPTIONS.find((c) => c.key === sport)?.icon || ""
                    }
                    width={18}
                    height={18}
                  />
                  {ALL_SPORT_OPTIONS.find((c) => c.key === sport)?.label}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {ALL_SPORT_OPTIONS.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    <span className="flex items-center gap-2">
                      {s.icon && <Icon icon={s.icon} width={18} height={18} />}
                      <span>{s.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="venue">
            {t("events.fields.venue", "Venue")}
          </FieldLabel>
          <Input
            id="venue"
            placeholder="e.g. Stadium"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="datetime">
            {t("events.fields.datetime", "Event Date and time")}
          </FieldLabel>
          <DateTimePicker
            // id="datetime"
            date={datetime}
            setDate={setDatetime}
          />
        </Field>
      </Section>

      <Section title={t("events.location.title", "Location details")}>
        <div className="grid gap-4 sm:grid-cols-1">
          <Field>
            <FieldLabel htmlFor="region">
              {t("events.fields.region", "Event region")}
            </FieldLabel>
            <Input
              id="region"
              placeholder="e.g. Dakar"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="lng">
                {t("events.fields.lat", "Latitude")}
              </FieldLabel>
              <Input
                required
                id="lat"
                type="number"
                step="any"
                placeholder="14.6928"
                value={lat as any}
                onChange={(e) =>
                  setLat(
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lng">
                {t("events.fields.lng", "Longitude")}
              </FieldLabel>
              <Input
                required
                id="lng"
                type="number"
                step="any"
                placeholder="-17.4467"
                value={lng as any}
                onChange={(e) =>
                  setLng(
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
              />
            </Field>
          </div>
          <LocationPickerButton onClick={() => openModal()} />
        </div>
      </Section>
    </>
  );
};
