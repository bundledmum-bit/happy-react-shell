import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { usePage } from "@/hooks/usePage";
import DbPageContent from "@/components/DbPageContent";

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading } = usePage(slug);

  useEffect(() => {
    if (page?.meta_title || page?.title) {
      document.title = `${page.meta_title || page.title} | BundledMum`;
    }
  }, [page]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-[68px] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 border-4 border-border border-t-forest rounded-full animate-spin mb-3" />
          <p className="text-text-med text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen pt-[68px] flex items-center justify-center">
        <div className="text-center max-w-md px-5">
          <h1 className="pf text-3xl mb-2">Page not found</h1>
          <p className="text-text-med text-sm mb-4">The page you're looking for doesn't exist or is unpublished.</p>
          <Link to="/" className="text-forest font-semibold underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return <DbPageContent page={page} />;
}
