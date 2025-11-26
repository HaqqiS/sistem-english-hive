"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const IGNORED_SEGMENTS = ["detail", "sesi"];

// Fungsi helper untuk membuat huruf pertama kapital
function capitalize(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function DynamicBreadcrumb() {
  const pathname = usePathname(); // Cth: /admin/verivikasi
  const segments = pathname.split("/").filter(Boolean); // Cth: ["admin", "verivikasi"]

  if (pathname === "/admin" || pathname === "/guru") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  let currentPath = "";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isIgnored = IGNORED_SEGMENTS.includes(segment);
          currentPath += `/${segment}`;
          const isLastVisible = !isIgnored && index === segments.length - 1;
          if (isIgnored) {
            // Jangan tampilkan segmen penanda (detail, sesi)
            return null;
          }

          let displayLabel = capitalize(segment);

          // Cek apakah segmen adalah ID (lebih dari 10 karakter biasanya ID cuid)
          if (segment.length > 10) {
            // Jika segmen ID, ganti labelnya menjadi "Detail" atau "ID: ..."
            // Untuk saat loading, kita pakai label generik "Detail"
            displayLabel = "Detail";
          }

          return (
            <React.Fragment key={currentPath}>
              <BreadcrumbItem>
                {isLastVisible ? (
                  // Item terakhir, tidak bisa diklik
                  <BreadcrumbPage>{displayLabel}</BreadcrumbPage>
                ) : (
                  // Item di tengah, bisa diklik
                  <BreadcrumbLink asChild>
                    <Link href={currentPath}>{displayLabel}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {/* Tambahkan separator jika bukan item terakhir */}
              {!isLastVisible && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
