import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, MoreVertical, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { uploadFilesToR2 } from "@/lib/api/uploads";
import { getMySubscription } from "@/lib/api/payments";
import { getMediaUrl } from "@/lib/fileConvert";
import { getFriendlyCategoryName } from "@/utils/key-translations";

import {
  businessCreateSchema,
  defaultBusinessValues,
  type BusinessCreateValues,
} from "@/components/business/business-create.schema";
import type { BusinessListing } from "@/shared/contracts";

import {
  // BUSINESS_CATEGORIES,
  BUSINESS_PLANS,
  FORM_STEPS,
} from "@/components/business/business-create.config";
import { sanitizeBusinessValues } from "@/components/business/business-plan";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { BusinessTypeStep } from "@/components/business/steps/BusinessTypeStep";
import { BusinessIdentityStep } from "@/components/business/steps/BusinessIdentityStep";
import { BusinessDetailsStep } from "@/components/business/steps/BusinessDetailsStep";
import { BusinessMediaStep } from "@/components/business/steps/BusinessMediaStep";
import { ReviewStep } from "@/components/business/steps/ReviewStep";
import {
  listBusinessListings,
  getBusinessListing,
  createBusinessListing,
  updateBusinessListing,
  deleteBusinessListing,
} from "@/lib/api/listings";
import { type BreadcrumbConfig, Breadcrumbs } from "@/components/BreadCrumbs";

const STEP_FIELDS: Record<number, (keyof BusinessCreateValues)[]> = {
  0: ["cat"],
  1: ["name", "tel", "email"],
  2: ["location", "address", "desc", "openHours", "spec"],
  3: ["photos", "videos", "priceTag"],
  4: ["pack"],
};

export function BusinessPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [businessListings, setBusinessListings] = useState<BusinessListing[]>([]);
  // const [search, setSearch] = useState("");
  // const [sort, setSort] = useState<"updated" | "name">("updated");

  const breadcrumbConfig: BreadcrumbConfig = {
    "/business": {
      label: t("business.businesses", "Businesses"),
    },
  }

  async function loadBusinessListings() {
    setLoading(true);
    try {
      let items: BusinessListing[] = [];

      items = (await listBusinessListings()) as BusinessListing[];

      // sort
      items.sort((a: BusinessListing, b: BusinessListing) => {
        // if (sort === "updated") {
        //   const at = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        //   const bt = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        //   if (bt !== at) return bt - at;
        // }
        return (a.name || "").localeCompare(b.name || "");
      });

      setBusinessListings(items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBusinessListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteBusinessListing(item: BusinessListing) {
    if (!confirm("Delete this business listing? This cannot be undone.")) return;
    try {
      await deleteBusinessListing(item._id);
      await loadBusinessListings();
    } catch (error) {
      console.error("Failed to delete business listing:", error);
      toast.error("Failed to delete the business listing. Please try again.");
    }
  }

  return (
      <div className="mx-auto max-w-6xl pt-16 pb-8 space-y-6">
        <Breadcrumbs
          config={breadcrumbConfig}
        />
        <Card>
          <CardHeader>
            <Badge variant="secondary">
              {t("hello", "Bonjour", { name: user?.firstName || user?.fullName || "User" })}
            </Badge>
          </CardHeader>
          <CardContent>
            <CardTitle className="max-w-xl">
              {t("business.hero_title", "Gérez vos établissements pour les Jeux.")}
            </CardTitle>
            <CardDescription className="max-w-xl">
              {t("business.hero_description", "Des milliers de visiteurs chercheront où dormir, manger, se déplacer et faire leurs achats à Dakar. Publiez vos fiches sur la carte officielle et captez cette audience.")}
            </CardDescription>
          </CardContent>
          <CardFooter>

            <CardAction>
              <Button
                variant="default"
                onClick={() => navigate("/business/create")}
                className="inline-flex items-center gap-2"
              >
                <Plus />
                <span>{t("business.new_listing", "New business listing")}</span>
              </Button>
            </CardAction>
          </CardFooter>
        </Card>

        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
            {/* Title + subtitle */}
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg md:text-xl font-semibold tracking-tight text-foreground/90">
                <span className="truncate">{t("business.listings", "Business listings")}</span>
              </h2>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="link"
                onClick={() => navigate("/business/create")}
                className="inline-flex items-center gap-2"
              >
                <Plus />
                <span>{t("business.new_listing", "New business listing")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading && (
            <div className="col-span-full grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="overflow-hidden rounded-3xl" >
                  <Skeleton className="aspect-video w-full bg-foreground/20" />
                  <Skeleton className="p-4 space-y-3">
                    <Skeleton className="h-4 w-1/2 rounded bg-foreground/20" />
                    <Skeleton className="h-3 w-2/3 rounded bg-foreground/20" />
                    <Skeleton className="h-8 w-full rounded bg-foreground/20" />
                  </Skeleton>
                </Skeleton>
              ))}
            </div>
          )}

          {!loading && businessListings.length === 0 && (
            <Empty className="col-span-full border border-foreground/30 p-8 text-foreground/50 shadow-sm">
              <EmptyHeader>
                <EmptyDescription className="text-center text-sm text-foreground/50">
                  {t("business.not_found", "No business listings found")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="default"
                  onClick={() => navigate("/business/create")}
                  className="inline-flex items-center gap-2"
                >
                  <Plus />
                  <span>{t("business.new_listing", "New business listing")}</span>
                </Button>
              </EmptyContent>
            </Empty>
          )}

          {!loading &&
            businessListings.map((item, index) => {
              return (
                <Card
                  key={index}
                  className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden"
                  size="sm"
                >
                  <Badge
                    className="absolute start-4 top-4 z-20"
                    variant="secondary"
                  >
                    {getFriendlyCategoryName(item.cat, t)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="absolute end-4 top-4 z-20"
                      render={
                        <Button
                          variant="ghost" size="icon-sm"
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
                        // disabled
                        // aria-disabled
                        onClick={() => handleDeleteBusinessListing(item)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <CardHeader className="p-0 gap-0">
                    {/* image */}
                    {item.photos && item.photos.length > 0 ? (
                    <>
                      <div className="absolute bg-gradient-to-b from-background to-transparent w-full h-1/4 aspect-video object-cover"/>
                      <img
                        src={getMediaUrl(item.photos[0])}
                        alt={item.name}
                        className="w-full aspect-video object-cover"
                        loading="lazy"
                      />
                    </>
                    ) : (
                      <div className="flex items-center z-10 aspect-video w-full justify-center bg-background/50 text-foreground/30">
                        {t("no_image", "No image")}
                      </div>
                    )}
                  <Separator />
                  </CardHeader>
                  {/* body */}
                  <CardHeader>
                    <CardTitle className="font-semibold leading-tight text-foreground/90">
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {item.desc && (
                      <CardDescription>
                        {item.desc}
                      </CardDescription>
                    )}
                    {item.address && (
                      <CardDescription>
                        {item.address}
                      </CardDescription>
                    )}

                    {/* 
                  {item.location && (
                    <p className="text-xs text-foreground/50">
                      {item.location.coordinates[0]?.toFixed?.(5)} •{" "}
                      {item.location.coordinates[1]?.toFixed?.(5)}
                    </p>
                  )} */}

                  </CardContent>
                  <CardFooter className="w-full flex-1 items-end">
                    {/* <div className="text-xs text-foreground/50">
                    {item.updatedAt?.toDate
                      ? new Date(item.updatedAt.toDate()).toLocaleString()
                      : ""}
                  </div> */}
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/business/listings/${item._id}`)}
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

export function BusinessCreate() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [plan, setPlan] = useState("discover");

  const breadcrumbConfig: BreadcrumbConfig = {
    "/business": {
      label: t("business.businesses", "Businesses"),
    },

    "/create": {
      label: t("business.create", "Create Business"),
    },
  }

  const selectedPlan = plan in BUSINESS_PLANS
    ? (plan as BusinessCreateValues["pack"])
    : "discover";

  useEffect(() => {
    void getMySubscription()
      .then((subscription) => setPlan(subscription.plan))
      .catch(() => undefined);
  }, []);

  const form = useForm({
    resolver: zodResolver(businessCreateSchema),
    defaultValues: { ...defaultBusinessValues, pack: selectedPlan },
    mode: "onTouched",
    shouldUnregister: false,
  });

  const {
    handleSubmit,
    trigger,
    setValue,
    // watch,
  } = form;

  useEffect(() => {
    setValue("pack", selectedPlan, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [selectedPlan, setValue]);

  // const category = watch("cat");
  // const plan = watch("pack");

  const stepTitle = [
    t("businessCreate.steps.type", "What type of business do you want to list?"),
    t("businessCreate.steps.identity", "Business identity and contact information"),
    t("businessCreate.steps.details", "Business details"),
    t("businessCreate.steps.media", "Photos & media"),
    t("businessCreate.steps.review", "Review your listing"),
  ][step];

  const next = async () => {
    const fields = STEP_FIELDS[step];

    const valid = await trigger(fields, {
      shouldFocus: true,
    });

    if (!valid) return;

    setStep((current) =>
      Math.min(current + 1, FORM_STEPS.length - 1),
    );
  };

  const previous = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const onSubmit = async (values: BusinessCreateValues) => {
    setSubmitting(true);

    try {
      const sanitizedValues = sanitizeBusinessValues({
        ...values,
        pack: selectedPlan,
      });
      const { photos, videos, ...businessData } = sanitizedValues;

      const uploadedPhotos = await uploadFilesToR2(photos);
      const uploadedVideos = await uploadFilesToR2(videos);

      const payload = {
        ...businessData,
        photos: uploadedPhotos,
        videos: uploadedVideos,
      };

      // 4. Send the pure JSON payload to your Hono server
      await createBusinessListing(payload);

      toast.success(
        t(
          "businessCreate.success",
          "Your business has been submitted successfully.",
        ),
      );

      // Replace this with your router navigation or
      // success screen once your API response is defined.
    } catch (error) {
      console.error(error);

      toast.error(
        t(
          "businessCreate.error",
          "Unable to submit your business. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = (
    { stepTitle }: { stepTitle?: string }
  ) => {
    switch (step) {
      case 0:
        return <BusinessTypeStep title={stepTitle} />;

      case 1:
        return <BusinessIdentityStep title={stepTitle} />;

      case 2:
        return <BusinessDetailsStep title={stepTitle} />;

      case 3:
        return <BusinessMediaStep title={stepTitle} />;

      case 4:
        return <ReviewStep title={stepTitle} />;

      default:
        return null;
    }
  };

  return (

      <div className="pt-16 pb-8">
        <FormProvider {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto w-full max-w-3xl space-y-6"
          >
            <div className="space-y-2">
              <Breadcrumbs
                 config={breadcrumbConfig}
              />
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                  {t(
                    "businessCreate.title",
                    "Create your business",
                  )}
                </h1>

                <span className="text-sm text-muted-foreground">
                  {t("businessCreate.step", "Step")}{" "}
                  {step + 1} / {FORM_STEPS.length}
                </span>
              </div>

              <Progress
                value={((step + 1) / FORM_STEPS.length) * 100}
              />

            </div>

            <Card>
              {renderStep({stepTitle})}
              <CardFooter className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={previous}
                  disabled={step === 0 || submitting}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t("common.back", "Back")}
                </Button>

                {step < FORM_STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      void next();
                    }}
                  >
                    {t("common.continue", "Continue")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? t("common.submitting", "Submitting...")
                      : t(
                        "businessCreate.submit",
                        "Submit listing",
                      )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </form>
        </FormProvider>
      </div>
  );
}

export function BusinessEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const listingId = params.id;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const breadcrumbConfig: BreadcrumbConfig = {
    "/business": {
      label: t("business.businesses", "Businesses"),
    },

    "/business/listings": {
      label: t("business.listings", "Listings"),
    },
  }

  const form = useForm({
    resolver: zodResolver(businessCreateSchema),
    defaultValues: defaultBusinessValues,
    mode: "onTouched",
    shouldUnregister: false,
  });

  const {
    handleSubmit,
    reset,
  } = form;

  useEffect(() => {
    let active = true;

    async function loadListing() {
      if (!listingId) {
        setLoadError(t("businessEdit.notFound", "Business listing not found."));
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const listing = (await getBusinessListing(listingId)) as BusinessListing;
        if (!active) return;

        reset({
          ...defaultBusinessValues,
          cat: listing.cat as BusinessCreateValues["cat"],
          name: listing.name,
          tel: listing.tel,
          wa: listing.wa,
          email: listing.email,
          website: listing.website,
          social: listing.social,
          address: listing.address,
          location: listing.location,
          desc: listing.desc,
          openHours: listing.openHours,
          spec: listing.spec,
          pack: listing.pack as BusinessCreateValues["pack"],
          priceTag: listing.priceTag ?? "",
        });
      } catch (error) {
        console.error("Failed to load business listing:", error);
        if (active) {
          setLoadError(
            t(
              "businessEdit.loadError",
              "Unable to load this business listing. Please try again.",
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadListing();
    return () => {
      active = false;
    };
  }, [listingId, reset, t]);

  const handleDelete = async () => {
    if (!listingId || deleting) return;
    if (!confirm(t("businessEdit.deleteConfirm", "Delete this business listing? This cannot be undone."))) return;

    setDeleting(true);
    try {
      await deleteBusinessListing(listingId);
      toast.success(t("businessEdit.deleteSuccess", "Business listing deleted."));
      navigate("/business");
    } catch (error) {
      console.error("Failed to delete business listing:", error);
      toast.error(t("businessEdit.deleteError", "Unable to delete the business listing. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  const onSubmit = async (values: BusinessCreateValues) => {
    setSubmitting(true);

    try {
      const { photos, videos, ...businessData } = values;

      const uploadedPhotos = await uploadFilesToR2(photos);
      const uploadedVideos = await uploadFilesToR2(videos);

      const payload: Record<string, unknown> = {
        ...businessData,
      };

      // Leave existing remote media untouched unless replacement files were selected.
      if (photos.length > 0) payload.photos = uploadedPhotos;
      if (videos.length > 0) payload.videos = uploadedVideos;

      await updateBusinessListing(listingId , payload);

      toast.success(
        t(
          "businessCreate.success",
          "Your business has been submitted successfully.",
        ),
      );

      // Replace this with your router navigation or
      // success screen once your API response is defined.
    } catch (error) {
      console.error(error);

      toast.error(
        t(
          "businessCreate.error",
          "Unable to submit your business. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="pt-16 pb-8">
        <div className="mx-auto w-full max-w-3xl">

          {loading && <Skeleton className="h-[38rem] w-full" />}

          {!loading && loadError && (
            <Empty className="border p-8">
              <EmptyHeader>
                <EmptyDescription>{loadError}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>

          {!loading && !loadError && (
            <FormProvider {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-3xl space-y-6">
              <div className="space-y-2">
                <Breadcrumbs
                  config={breadcrumbConfig}
                />
              </div>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("businessEdit.title", "Edit business listing")}</CardTitle>
                    <CardDescription>
                      {t("businessEdit.description", "Update your listing information and save your changes.")}
                    </CardDescription>
                  </CardHeader>
                  <BusinessTypeStep title={t("businessCreate.steps.type", "Business type")} />
                  <BusinessIdentityStep title={t("businessCreate.steps.identity", "Business identity and contact information")} />
                  <BusinessDetailsStep title={t("businessCreate.steps.details", "Business details")} />
                  <BusinessMediaStep title={t("businessCreate.steps.media", "Photos & media")} />
                  <CardFooter className="flex justify-between gap-3">
                    <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={submitting || deleting}>
                      {deleting ? t("common.deleting", "Deleting...") : t("common.delete", "Delete")}
                    </Button>
                    <Button type="submit" disabled={submitting || deleting}>
                      {submitting ? t("common.saving", "Saving...") : t("common.save", "Save changes")}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </FormProvider>
          )}
      </div>
  )
}
