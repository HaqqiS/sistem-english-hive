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
} from "@/app/_components/ui/breadcrumb";

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

  // Menangani kasus lain, cth: /admin/verivikasi -> Admin > Verifikasi
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join("/")}`;

          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  // Item terakhir, tidak bisa diklik
                  <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                ) : (
                  // Item di tengah, bisa diklik
                  <BreadcrumbLink asChild>
                    <Link href={href}>{capitalize(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {/* Tambahkan separator jika bukan item terakhir */}
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
