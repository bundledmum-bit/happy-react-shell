interface Props {
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  onChange: (field: string, value: string) => void;
  contentTitle?: string;
  contentDescription?: string;
}

export default function SEOEditor({ metaTitle, metaDescription, ogImageUrl, onChange, contentTitle, contentDescription }: Props) {
  const titleLen = metaTitle.length;
  const descLen = metaDescription.length;
  const titleColor = titleLen === 0 ? "text-text-light" : titleLen <= 60 ? "text-green-600" : "text-destructive";
  const descColor = descLen === 0 ? "text-text-light" : descLen <= 160 ? "text-green-600" : "text-destructive";

  const autoGenerate = () => {
    if (contentTitle && !metaTitle) onChange("meta_title", contentTitle.slice(0, 60));
    if (contentDescription && !metaDescription) onChange("meta_description", contentDescription.slice(0, 160));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">SEO Settings</h3>
        <button type="button" onClick={autoGenerate} className="text-xs text-forest font-semibold hover:underline">
          Auto-generate
        </button>
      </div>

      <div>
        <label className="text-xs font-semibold text-text-med block mb-1">
          Meta Title <span className={`${titleColor}`}>({titleLen}/60)</span>
        </label>
        <input value={metaTitle} onChange={e => onChange("meta_title", e.target.value)}
          placeholder="Page title for search engines"
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
      </div>

      <div>
        <label className="text-xs font-semibold text-text-med block mb-1">
          Meta Description <span className={`${descColor}`}>({descLen}/160)</span>
        </label>
        <textarea value={metaDescription} onChange={e => onChange("meta_description", e.target.value)}
          placeholder="Short description for search results"
          rows={3} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
      </div>

      <div>
        <label className="text-xs font-semibold text-text-med block mb-1">OG Image URL</label>
        <input value={ogImageUrl} onChange={e => onChange("og_image_url", e.target.value)}
          placeholder="https://..."
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
      </div>

      {/* Google preview */}
      <div className="border border-border rounded-lg p-4 bg-background">
        <p className="text-xs text-text-light mb-1">Search preview</p>
        <div className="text-[#1a0dab] text-base font-medium truncate">{metaTitle || contentTitle || "Page Title"}</div>
        <div className="text-[#006621] text-xs truncate">bundledmum.com</div>
        <div className="text-text-med text-xs line-clamp-2 mt-0.5">{metaDescription || contentDescription || "Page description..."}</div>
      </div>
    </div>
  );
}
