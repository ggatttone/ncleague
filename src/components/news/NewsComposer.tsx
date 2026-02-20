import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/supabase/auth-context";
import { useCreateArticle } from "@/hooks/use-articles";
import { buildArticlePayload, COMPOSER_MAX_LENGTH } from "@/lib/news/articleComposer";
import { supabase } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export const NewsComposer = () => {
  const { user, profile } = useAuth();
  const createArticleMutation = useCreateArticle();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(undefined);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  if (!user) {
    return null;
  }

  const trimmedContent = content.trim();
  const isEmpty = trimmedContent.length === 0;
  const isOverLimit = content.length > COMPOSER_MAX_LENGTH;
  const isSubmitting = createArticleMutation.isPending;
  const isActionDisabled = isEmpty || isOverLimit || isUploadingImage || isSubmitting;
  const warningThreshold = Math.floor(COMPOSER_MAX_LENGTH * 0.85);

  const counterClassName = cn(
    "text-xs transition-colors",
    isOverLimit
      ? "text-destructive font-semibold"
      : content.length >= warningThreshold
        ? "text-amber-600"
        : "text-muted-foreground"
  );

  const resetComposer = () => {
    setContent("");
    setCoverImageUrl(undefined);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const extension = file.name.split(".").pop() || "jpg";
      const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const filePath = `news/${user.id}/${uniquePart}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("article-images").getPublicUrl(filePath);

      setCoverImageUrl(publicUrl);
      showSuccess(t("pages.news.composer.uploadSuccess"));
    } catch (_error) {
      showError(t("pages.news.composer.uploadError"));
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (status: "draft" | "published") => {
    try {
      const payload = buildArticlePayload({
        authorId: user.id,
        content,
        coverImageUrl,
        status,
      });

      await createArticleMutation.mutateAsync(payload);
      resetComposer();
      showSuccess(
        status === "published"
          ? t("pages.news.composer.publishSuccess")
          : t("pages.news.composer.draftSuccess")
      );
    } catch (error) {
      if (error instanceof Error && error.message === "CONTENT_TOO_LONG") {
        showError(t("pages.news.composer.validationMaxLength"));
        return;
      }

      showError(t("pages.news.composer.submitError"));
    }
  };

  return (
    <section className="border border-border rounded-xl bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback>{getInitials(profile?.first_name, profile?.last_name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("pages.news.composer.placeholder")}
            className="min-h-[110px] border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 resize-none"
          />

          {coverImageUrl && (
            <div className="relative mt-3">
              <img
                src={coverImageUrl}
                alt="Composer preview"
                className="h-auto max-h-72 w-full rounded-xl border object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 h-8 w-8"
                onClick={() => setCoverImageUrl(undefined)}
                aria-label={t("pages.news.composer.removeImage")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="mt-4 border-t border-border pt-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage || isSubmitting}
                >
                  {isUploadingImage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-2 h-4 w-4" />
                  )}
                  {t("pages.news.composer.attachImage")}
                </Button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <span className={counterClassName}>
                  {t("pages.news.composer.charCounter", {
                    count: content.length,
                    max: COMPOSER_MAX_LENGTH,
                  })}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSubmit("draft")}
                  disabled={isActionDisabled}
                >
                  {t("pages.news.composer.saveDraft")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSubmit("published")}
                  disabled={isActionDisabled}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("pages.news.composer.publish")}
                </Button>
              </div>
            </div>

            {isOverLimit && (
              <p className="mt-2 text-sm text-destructive">{t("pages.news.composer.validationMaxLength")}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
