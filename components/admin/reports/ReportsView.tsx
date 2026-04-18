"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PrepTimeReport } from "./PrepTimeReport";
import { SalesReport } from "./SalesReport";
import { TopItemsReport } from "./TopItemsReport";

export function ReportsView() {
  return (
    <Tabs defaultValue="sales">
      <TabsList>
        <TabsTrigger value="sales">Ventas por dia</TabsTrigger>
        <TabsTrigger value="top-items">Productos mas vendidos</TabsTrigger>
        <TabsTrigger value="prep-time">Tiempo de preparacion</TabsTrigger>
      </TabsList>

      <TabsContent value="sales">
        <SalesReport />
      </TabsContent>

      <TabsContent value="top-items">
        <TopItemsReport />
      </TabsContent>

      <TabsContent value="prep-time">
        <PrepTimeReport />
      </TabsContent>
    </Tabs>
  );
}
