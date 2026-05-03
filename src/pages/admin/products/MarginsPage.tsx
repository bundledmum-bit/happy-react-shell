import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandMarginsTab from "./BrandMarginsTab";
import BundleTierRollupTab from "./BundleTierRollupTab";

type Tab = "brands" | "bundles";

export default function MarginsPage() {
  const [tab, setTab] = useState<Tab>("brands");

  return (
    <div>
      <div className="mb-6">
        <h1 className="pf text-2xl font-bold">Margins</h1>
        <p className="text-text-med text-sm mt-1">
          Manage retail prices and target margins across brands and bundles.
        </p>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="brands">Per-Brand Margins</TabsTrigger>
          <TabsTrigger value="bundles">Bundle Tier Rollup &amp; Estimator</TabsTrigger>
        </TabsList>
        <TabsContent value="brands" className="mt-4">
          <BrandMarginsTab />
        </TabsContent>
        <TabsContent value="bundles" className="mt-4">
          <BundleTierRollupTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
